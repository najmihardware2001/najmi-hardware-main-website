const pricing=require('./master-catalogue');
const exact=v=>{if(v==null)return null;const s=String(v);if(!/^\d+(\.\d{1,6})?$/.test(s))throw Error('Invalid source price');const [w,f='']=s.split('.');return BigInt(w)*1000000n+BigInt(f.padEnd(6,'0'))};
async function applyReviewedPlan(c,plan,sha,ownerId,reason){
 if(!/^[a-f0-9]{64}$/.test(sha)||!Array.isArray(plan.rows)||!plan.workbook_sha256)throw Error('Invalid reviewed plan');
 if(!Number.isSafeInteger(ownerId)||String(reason||'').trim().length<12)throw Error('Owner ID and a meaningful review reason are required');
 if(plan.rows.some(r=>r.status==='REJECTED_INPUT'))throw Error('Resolve rejected input rows before applying');
 const rows=plan.rows.filter(r=>r.status==='READY_FOR_REVIEW');if(!rows.length)throw Error('No client-confirmed prices to apply');
 if(new Set(rows.map(r=>r.original_inventory_code)).size!==rows.length)throw Error('Duplicate code in reviewed plan');
 const owner=(await c.query("SELECT id FROM admin_users WHERE id=$1 AND status='ACTIVE' AND role IN ('ADMIN','SUPER_ADMIN')",[ownerId])).rows[0];if(!owner)throw Error('Active owner administrator required');let applied=0,already=0;
 for(const r of rows){
  const key='client-price-return:'+sha+':'+r.original_inventory_code;
  if((await c.query('SELECT 1 FROM catalogue_change_history WHERE operation_key=$1',[key])).rows.length){already++;continue}
  const matches=(await c.query('SELECT v.*,p.source_id selected_parent,p.name_en parent_name FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.original_inventory_code=$1 FOR UPDATE OF v',[String(r.original_inventory_code)])).rows;
  if(matches.length!==1)throw Error('Code is not unique: '+r.original_inventory_code);const old=matches[0];
  if(old.selected_parent!==r.parent_id||old.parent_name!==r.parent_name||old.id!==r.variant_id||old.selling_unit!==r.original_selling_unit)throw Error('Code, selected parent or unit changed');
  if(exact(old.source_client_sales_price)!==exact(r.old_source_price))throw Error('Source price changed since preview');
  const value=exact(r.confirmed_source_price);if(value==null||value<=0n||value>=1000000000000000n)throw Error('Positive source price below 1 billion KWD required');
  const retail=pricing.retailPrice(r.confirmed_source_price);if(retail!==r.calculated_website_retail_kwd||r.rule!==pricing.PRICING_RULE)throw Error('Calculated retail differs from the reviewed plan');
  await c.query('INSERT INTO catalogue_change_history(operation_key,kind,entity_id,before_data,after_data,source_reference) VALUES($1,$2,$3,$4,$5,$6)',[key,'CLIENT_CONFIRMED_SOURCE_PRICE',String(old.id),JSON.stringify(old),JSON.stringify({source_client_sales_price:r.confirmed_source_price,computed_retail_price:retail,owner_id:ownerId,reason}),plan.workbook_sha256]);
  await c.query('UPDATE product_variants SET source_client_sales_price=$2,computed_retail_price=$3,pricing_rule=$4,source_price_version=source_price_version+1,price_approved=false,is_purchase_eligible=false,selling_price=NULL WHERE id=$1',[old.id,r.confirmed_source_price,retail,pricing.PRICING_RULE]);
  await c.query('INSERT INTO admin_audit_log(admin_id,action,entity_id,details) VALUES($1,$2,$3,$4)',[ownerId,'catalogue.client_price_return',String(old.id),JSON.stringify({plan_sha256:sha,reason,source_code:r.original_inventory_code})]);applied++;
 }
 return {applied,already_applied:already,stock_and_mapping_unchanged:true,purchase_approvals_revoked:true};
}
module.exports={applyReviewedPlan};
