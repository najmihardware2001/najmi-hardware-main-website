const router=require('express').Router(),db=require('../db'),service=require('../services/master-catalogue'),crypto=require('crypto');
const {fail}=service;const auth=require('../middleware/auth'),{audit}=require('../services/commerce-settings'),media=require('../services/media');
router.get('/products/:ref/configuration',async(req,res)=>res.json(await service.configuration(req.params.ref,req.query)));
router.get('/products/:ref/visuals',async(req,res)=>res.json(await require('../services/catalogue-visuals').publicVisuals(req.params.ref)));
router.post('/catalogue/resolve',async(req,res)=>res.json(await service.configuration(req.body.parent_id,req.body.criteria||{})));
router.post('/catalogue/rfq',require('../middleware/rate-limit')(20,60000),async(req,res)=>{
 const b=req.body;if(['retail_price','wholesale_price','unitPrice','targetUnitPrice','total','price'].some(k=>b[k]!=null))fail('Wholesale requests must not contain a price');
 const p=await service.parent(b.parent_id),configuration=b.configuration||{},rows=await service.records(p.id);
 const allowed=['specification_id','size_value','size_unit','length_value','length_unit','color','unknown_colour','requested_colour'];const criteria=Object.fromEntries(allowed.filter(k=>configuration[k]!=null&&configuration[k]!=='').map(k=>[k,configuration[k]]));
 const result=await service.configuration(p.id,criteria);
 if(Object.keys(criteria).length&&!result.selected_specification&&result.resolution.matches===0)fail('This source-record combination does not exist');
 const quantity=Number(b.quantity);if(!Number.isFinite(quantity)||quantity<=0||quantity>1000000)fail('Enter a positive requested quantity');
 const unit=String(b.unit||'').trim();const matched=service.matching(rows,result.selected_criteria);const units=[...new Set(matched.map(v=>v.selling_unit).filter(Boolean))];const selectedUnit=result.selected_specification?.measurements.packaging;if(!unit||unit.length>20||units.length&&!units.includes(unit)&&unit!==selectedUnit)fail('Select the original supply unit');
 if(result.resolution.variant_id&&rows.find(v=>v.id===result.resolution.variant_id)?.selling_unit!==unit)fail('Requested quantity must use the selected source record supply unit');
 const contact=b.customer||{},name=String(contact.name||'').trim(),phone=String(contact.phone||'').trim(),email=String(contact.email||'').trim();
 if(!name||name.length>150||(!phone&&!email))fail('Name and contact details are required');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Invalid email');if(phone&&!/^\+?[\d\s()-]{7,25}$/.test(phone))fail('Invalid phone');
 const preference=String(b.preference||'').slice(0,500),notes=String(b.notes||'').slice(0,2000),mode=b.mode==='RETAIL'?'RETAIL':'WHOLESALE';
 const clean={...result.selected_criteria,...(criteria.requested_colour?{requested_colour:criteria.requested_colour}:{}),preference,unit,quantity,resolution:result.resolution.state,external_parent:p.source_id};
 const c=await db.pool.connect();
 try{await c.query('BEGIN');const number='RFQ-'+new Date().getFullYear()+'-'+crypto.randomBytes(5).toString('hex').toUpperCase(),key=crypto.randomUUID();
  const rfq=(await c.query(`INSERT INTO rfqs(rfq_number,access_key,customer_name,customer_phone,customer_email,company_name,contact_person,email,phone,notes,status)
   VALUES($1,$2,$3,$4,$5,$6,$3,$5,$4,$7,'SUBMITTED') RETURNING id`,[number,key,name,phone,email,String(contact.company||'').slice(0,200),notes])).rows[0];
 const variant=result.resolution.matches===1&&result.resolution.state!=='PREFERENCE_ENQUIRY'?result.resolution.variant_id:null;
  await c.query(`INSERT INTO rfq_items(rfq_id,product_id,variant_id,product_name,custom_description,quantity,unit,target_price,target_unit_price,notes)
   VALUES($1,$2,$3,$4,$4,$5,$6,NULL,NULL,$7)`,[rfq.id,p.id,variant,p.name_en,quantity,unit,JSON.stringify(clean)]);
  await c.query('INSERT INTO catalogue_rfq_configs(rfq_id,parent_id,source_variant_id,mode,configuration) VALUES($1,$2,$3,$4,$5)',[rfq.id,p.id,variant,mode,JSON.stringify(clean)]);
  await c.query('COMMIT');res.status(201).json({success:true,rfqNumber:number,accessKey:key,message:'Request received. Staff will prepare a personalized quotation.'});
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
});
// Existing admin authentication and role guards also protect these extension routes.
router.use('/admin',auth.admin,auth.permissions,(req,res,next)=>{res.set('Cache-Control','private,no-store');next()});
router.get('/admin/products/:id/catalogue',async(req,res)=>{
 const p=await service.parent(req.params.id,true),variants=await service.records(p.id);
 const evidence=(await db.query('SELECT * FROM catalogue_evidence WHERE parent_id=$1 ORDER BY kind,source_row',[p.id])).rows;
 const photos=(await db.query('SELECT * FROM catalogue_photo_reviews WHERE parent_id=$1 ORDER BY id DESC',[p.id])).rows;
 const specifications=(await db.query('SELECT * FROM catalogue_specifications WHERE parent_id=$1 AND active ORDER BY id',[p.id])).rows;
 res.json({parent:p,variants:variants.map(v=>({...v,readiness:service.readiness(v)})),evidence,photos,specifications,pricing_rule:service.PRICING_RULE});
});
router.get('/admin/products/:id/readiness',async(req,res)=>{const p=await service.parent(req.params.id,true),rows=await service.records(p.id);res.json({parent:p.source_id,items:rows.map(v=>({id:v.id,code:v.original_inventory_code,source_price:v.source_client_sales_price,retail_price:service.priceFor(v),unit:v.selling_unit,stock:v.inventory_quantity,reasons:service.readiness(v),state:service.readiness(v).length?'ENQUIRY_ONLY':'READY_FOR_APPROVAL'}))});});
router.get('/admin/products/:id/supplied-photos',async(req,res)=>{const p=await service.parent(req.params.id,true);res.json((await db.query('SELECT * FROM catalogue_supplied_photos WHERE parent_candidates ? $1 OR parent_candidates=\'[]\'::jsonb ORDER BY filename',[p.source_id])).rows)});
router.post('/admin/products/:id/visual-review',async(req,res)=>{const p=await service.parent(req.params.id,true),c=await db.pool.connect();try{await c.query('BEGIN');const result=await require('../services/catalogue-visuals').reviewBatch(p.id,req.body.ids,req.body.status,req.admin,req.body.reason,req.body.individually_compared,c);await c.query('COMMIT');res.json(result)}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}});
router.patch('/admin/products/:id/visuals/:photo',async(req,res)=>res.json(await require('../services/catalogue-visuals').placePhoto(await service.parent(req.params.id,true),Number(req.params.photo),req.body,req.admin)));
router.post('/admin/products/:id/visuals/:photo/main',async(req,res)=>res.json(await require('../services/catalogue-visuals').setMain(await service.parent(req.params.id,true),Number(req.params.photo),req.admin)));
router.get('/admin/products/:id/catalogue-reference/:photo',async(req,res)=>{const p=await service.parent(req.params.id,true),photo=(await db.query('SELECT reference_filename FROM catalogue_photo_reviews WHERE parent_id=$1 AND id=$2',[p.id,Number(req.params.photo)])).rows[0];const path=require('path'),fs=require('fs'),folder=path.resolve(__dirname,'../../../selected-category/originals/najam images'),file=path.resolve(folder,photo?.reference_filename||'__missing__');if(!file.startsWith(folder+path.sep)||!fs.existsSync(file))fail('Original reference file not available',404);const bytes=await require('sharp')(file).resize(1000,1000,{fit:'inside',withoutEnlargement:true}).jpeg().toBuffer();res.json({data_uri:'data:image/jpeg;base64,'+bytes.toString('base64'),filename:photo.reference_filename});});
router.patch('/admin/products/:id/a-plus',async(req,res)=>{const p=await service.parent(req.params.id,true),c=req.body.content;if(!c||typeof c!=='object'||Array.isArray(c)||JSON.stringify(c).length>80000)fail('Invalid A+ content');for(const lang of ['en','ar']){for(const key of ['description','details','applications','selection','usage','care'])if(typeof c[key+'_'+lang]!=='string'||!c[key+'_'+lang].trim())fail('Complete bilingual A+ sections');if(!Array.isArray(c['faq_'+lang])||!c['faq_'+lang].length||c['faq_'+lang].some(f=>typeof f.q!=='string'||!f.q.trim()||typeof f.a!=='string'||!f.a.trim()))fail('Supply bilingual FAQs');}if(!Array.isArray(c.specifications)||!c.specifications.length||c.specifications.some(s=>typeof s.key!=='string'||typeof s.en!=='string'||typeof s.ar!=='string'))fail('Supply bilingual specifications');await db.query("UPDATE products SET custom_fields=jsonb_set(custom_fields,'{listing_content}',$2),short_description_en=$3,short_description_ar=$4,details_en=$5,details_ar=$6,how_to_use_en=$7,how_to_use_ar=$8,updated_at=NOW() WHERE id=$1",[p.id,JSON.stringify(c),c.description_en,c.description_ar,c.details_en,c.details_ar,c.usage_en,c.usage_ar]);await audit(req.admin.id,'catalogue.aplus.edit',p.id,{version:c.version});res.json({success:true});});
router.post('/admin/products/:id/catalogue-hold',async(req,res)=>{const p=await service.parent(req.params.id,true),ids=req.body.ids,reason=String(req.body.reason||'').trim();if(!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(id=>!Number.isSafeInteger(id))||reason.length<10)fail('Select up to 100 reviewed candidates and give a reason');const result=await db.query("UPDATE product_variants SET is_purchase_eligible=false,price_approved=false WHERE product_id=$1 AND id=ANY($2::int[]) RETURNING id",[p.id,ids]);await audit(req.admin.id,'catalogue.reviewed_hold',p.id,{ids:result.rows.map(r=>r.id),reason});res.json({updated:result.rows.length});});
router.patch('/admin/products/:id/catalogue/:variant',async(req,res)=>{
 const p=await service.parent(req.params.id,true),b=req.body,old=(await db.query('SELECT * FROM product_variants WHERE id=$1 AND product_id=$2',[Number(req.params.variant),p.id])).rows[0];if(!old)fail('Candidate not found',404);
 const status=b.mapping_status||old.mapping_status;if(!['PENDING','APPROVED','REJECTED'].includes(status))fail('Invalid mapping status');
 const inventory=b.inventory_quantity===undefined?old.inventory_quantity:b.inventory_quantity===''||b.inventory_quantity===null?null:Number(b.inventory_quantity);
 if(inventory!==null&&(!Number.isInteger(inventory)||inventory<0))fail('Inventory must be a verified nonnegative integer');
 const price=service.retailPrice(old.source_client_sales_price);
 if(b.source_client_sales_price!==undefined&&Number(b.source_client_sales_price)!==Number(old.source_client_sales_price))fail('Use the authorized source-price correction action');
 if(b.selling_price!==undefined&&b.selling_price!==''&&b.selling_price!==null&&(price===null||Number(b.selling_price)!==Number(price)))fail('Retail price is fixed at source Sales Price × 1.60');
 const priceApproved=b.price_approved===undefined?old.price_approved:b.price_approved===true,mediaApproved=b.media_approved===undefined?old.media_approved:b.media_approved===true;
 const colour=b.color===undefined?old.color:String(b.color||'').trim()||null;
 const dimensions={};for(const field of ['size_value','length_value']){const v=b[field]===undefined?old[field]:b[field];dimensions[field]=v==null||v===''?null:String(v);if(dimensions[field]!==null&&(!/^\d+(\.\d{1,3})?$/.test(dimensions[field])||Number(dimensions[field])<=0))fail('Confirmed dimensions must be positive with at most three decimals');}
 for(const field of ['size_unit','length_unit']){dimensions[field]=String(b[field]===undefined?old[field]||'':b[field]||'').trim()||null;if(dimensions[field]&&!/^[A-Za-z]{1,20}$/.test(dimensions[field]))fail('Enter the confirmed original dimension unit');}
 const eligible=b.is_purchase_eligible===undefined?old.is_purchase_eligible:b.is_purchase_eligible===true;
 const measurementType=b.confirmed_measurement_type||old.attributes.confirmed_measurement_type||'diameter';if(!['diameter','width','thickness','weight'].includes(measurementType))fail('Choose a valid measurement type');
 const specificationId=b.confirmed_specification_id===''?null:b.confirmed_specification_id===undefined?old.attributes.confirmed_specification_id:Number(b.confirmed_specification_id);
 const specifications=(await db.query('SELECT id,measurement_type,measurements FROM catalogue_specifications WHERE parent_id=$1 AND active',[p.id])).rows;
 if(specificationId!=null&&!specifications.some(s=>s.id===specificationId))fail('Select a specification belonging to this parent');
 const reviewed={...old,...dimensions,color:colour,mapping_status:status,attributes:{...old.attributes,confirmed_measurement_type:measurementType,confirmed_specification_id:specificationId}};
 if(eligible&&specifications.length&&!specifications.some(s=>s.measurement_type!=='enquiry'&&(!s.measurements.sheet_dimensions||!!s.measurements.sheet_dimensions.unit)&&service.matching([reviewed],{...s.measurements,measurement_type:s.measurement_type,specification_id:s.id}).length))fail('A confirmed selected specification with known dimension units is required before purchase');
 if(priceApproved&&!price)fail('An original client Sales Price is required');
 if(eligible&&(status!=='APPROVED'||!priceApproved||!mediaApproved||!colour||price===null||Number(price)<=0||inventory===null||inventory<=0))fail('Approve identity, colour, price, media and verified inventory before enabling purchase');
 if(eligible&&(!dimensions.size_value||!dimensions.size_unit||(measurementType==='diameter'&&(!dimensions.length_value||!dimensions.length_unit))))fail('Confirm the applicable measurement and original units before enabling purchase');
 let target=p.id;if(b.parent_id&&Number(b.parent_id)!==p.id){const dest=await service.parent(b.parent_id,true);target=dest.id;if(eligible)fail('Corrected parent mapping must be reviewed before purchase');}
 await db.query(`UPDATE product_variants SET product_id=$2,mapping_status=$3,inventory_quantity=$4,verified_stock=$4,selling_price=$5,price_approved=$6,media_approved=$7,is_purchase_eligible=$8,color=$9,status=$10,stock_status=$11,size_value=$12,size_unit=$13,length_value=$14,length_unit=$15,updated_at=NOW() WHERE id=$1`,[old.id,target,status,inventory,price,priceApproved,mediaApproved,eligible,colour,status==='APPROVED'?'ACTIVE':status==='REJECTED'?'ARCHIVED':'DRAFT',inventory>0?'IN_STOCK':'OUT_OF_STOCK',dimensions.size_value,dimensions.size_unit,dimensions.length_value,dimensions.length_unit]);
 await db.query('UPDATE product_variants SET attributes=attributes||$2::jsonb WHERE id=$1',[old.id,JSON.stringify({confirmed_measurement_type:measurementType,confirmed_specification_id:specificationId})]);
 await audit(req.admin.id,'catalogue.candidate.review',old.id,{before:old,changes:b});res.json({success:true});
});
router.patch('/admin/products/:id/source-price/:variant',async(req,res)=>{
 if(req.admin.role!=='SUPER_ADMIN')fail('Owner source-price permission required',403);const p=await service.parent(req.params.id,true),b=req.body,reason=String(b.reason||'').trim();if(reason.length<10)fail('Supply the source correction reference and reason');const price=service.retailPrice(b.source_sales_price);if(price===null)fail('Supply the corrected original price');const c=await db.pool.connect();try{await c.query('BEGIN');const old=(await c.query('SELECT * FROM product_variants WHERE id=$1 AND product_id=$2 FOR UPDATE',[Number(req.params.variant),p.id])).rows[0];if(!old)fail('Candidate not found',404);await c.query('UPDATE product_variants SET source_client_sales_price=$2,computed_retail_price=$3,selling_price=$3,pricing_rule=$4,source_price_version=source_price_version+1,price_approved=false,is_purchase_eligible=false,updated_at=NOW() WHERE id=$1',[old.id,b.source_sales_price,price,service.PRICING_RULE]);await audit(req.admin.id,'catalogue.source_price.correction',old.id,{old_source:old.source_client_sales_price,new_source:b.source_sales_price,calculated:price,reason},c);await c.query('COMMIT');res.json({success:true,calculated:price,requires_reapproval:true});}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
});
router.patch('/admin/products/:id/catalogue-evidence/:evidence',async(req,res)=>{
 const p=await service.parent(req.params.id,true),state=req.body.review_status;if(!['PENDING','APPROVED_REFERENCE','REJECTED'].includes(state))fail('Invalid evidence state');
 const r=await db.query('UPDATE catalogue_evidence SET review_status=$3 WHERE id=$1 AND parent_id=$2 RETURNING id',[Number(req.params.evidence),p.id,state]);if(!r.rows.length)fail('Evidence not found',404);
 await audit(req.admin.id,'catalogue.evidence.review',req.params.evidence,{state,note:String(req.body.note||'').slice(0,1000)});res.json({success:true});
});
router.post('/admin/products/:id/catalogue-photos',async(req,res)=>{
 const p=await service.parent(req.params.id,true),b=req.body,url=media.validateUrl(b.url);if(!url)fail('Upload an image first');
 if(!['MAIN','COLOUR','GALLERY'].includes(b.kind))fail('Choose an image role');
 const r=(await db.query(`INSERT INTO catalogue_photo_reviews(parent_id,colour,url,kind,generated,reference_filename) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(parent_id,url) DO UPDATE SET status='PENDING_APPROVAL' RETURNING *`,[p.id,String(b.colour||'').slice(0,100),url,b.kind,b.generated===true,String(b.reference_filename||'').slice(0,200)])).rows[0];
 const asset=(await db.query('SELECT sha256 FROM media_assets WHERE url=$1',[url])).rows[0];await db.query('UPDATE catalogue_photo_reviews SET file_hash=$2,origin=$3 WHERE id=$1',[r.id,asset?.sha256||null,b.generated===true?'GENERATED_DRAFT':'UPLOADED_REFERENCE']);
 await audit(req.admin.id,'catalogue.photo.upload',r.id,{parent:p.id});res.json(r);
});
router.patch('/admin/products/:id/catalogue-photos/:photo',async(req,res)=>{
 const p=await service.parent(req.params.id,true),state=req.body.status;if(!['APPROVED','REJECTED','PENDING_APPROVAL'].includes(state))fail('Invalid photo approval');
 const prior=(await db.query('SELECT * FROM catalogue_photo_reviews WHERE id=$1 AND parent_id=$2',[Number(req.params.photo),p.id])).rows[0];if(!prior)fail('Photo not found',404);if(state==='APPROVED'&&prior.qa_status==='FAILED')fail('This image failed accuracy review. Upload a corrected sibling image.');
 const photo=(await db.query('UPDATE catalogue_photo_reviews SET status=$3,reviewed_by=$4,reviewed_at=NOW() WHERE id=$1 AND parent_id=$2 RETURNING *',[Number(req.params.photo),p.id,state,req.admin.id])).rows[0];if(!photo)fail('Photo not found',404);
 if(photo.kind==='MAIN'&&state==='APPROVED')await db.query(`UPDATE product_images SET webp_url=$2,local_path=$2,card_url=$2,thumbnail_url=$2,alt_en=$3,alt_ar=$4 WHERE product_id=$1 AND image_order=1`,[p.id,photo.url,p.name_en,p.name_ar]);
 if(state!=='APPROVED')await db.query("UPDATE product_images SET webp_url='/uploads/selected-category/photo-coming-soon.webp',local_path='/uploads/selected-category/photo-coming-soon.webp',card_url='/uploads/selected-category/photo-coming-soon.webp',thumbnail_url='/uploads/selected-category/photo-coming-soon.webp' WHERE product_id=$1 AND COALESCE(webp_url,local_path,cloudinary_url)=$2",[p.id,photo.url]);
 if(photo.kind==='MAIN')await db.query("UPDATE products SET custom_fields=jsonb_set(custom_fields,'{photo_status}',to_jsonb($2::text)),updated_at=NOW() WHERE id=$1",[p.id,state==='APPROVED'?(photo.generated?'AI_ILLUSTRATION':'APPROVED_PHOTO'):'PHOTO_REVIEW_REQUIRED']);
 await audit(req.admin.id,'catalogue.photo.review',photo.id,{status:state,generated:photo.generated});res.json({success:true});
});
module.exports=router;
