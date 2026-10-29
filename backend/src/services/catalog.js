const {SYSTEMS,isManaged}=require('./managed-catalogues');
const db=require('../db');
const OFFER_JOIN=`LEFT JOIN LATERAL (
 SELECT id,title_en,title_ar,discount_percent FROM offers
 WHERE active AND starts_at<=NOW() AND (ends_at IS NULL OR ends_at>NOW())
 AND (product_id=p.id OR (product_id IS NULL AND (category_id=p.category_id OR EXISTS (
 SELECT 1 FROM product_category_memberships membership JOIN categories extra ON extra.id=membership.category_id
 WHERE membership.product_id=p.id AND membership.category_id=offers.category_id AND extra.status='ACTIVE'
 ))))
 ORDER BY priority DESC,discount_percent DESC,id DESC LIMIT 1
) offer ON true`;
const PRICE=`ROUND(p.selling_price*(1-COALESCE(offer.discount_percent,0)/100),${require('../utils/money').decimals()})`;
const MEMBERSHIP_JOIN=`LEFT JOIN LATERAL (
 SELECT extra.id,extra.slug,extra.name_en,extra.name_ar,extra.priority,extra.badge_en,extra.badge_ar
 FROM product_category_memberships membership JOIN categories extra ON extra.id=membership.category_id
 WHERE membership.product_id=p.id AND extra.status='ACTIVE'
 ORDER BY extra.priority DESC,extra.id ASC LIMIT 1
) featured_category ON true`;
const FEATURED_PRIORITY='GREATEST(c.priority,COALESCE(featured_category.priority,c.priority))';
const SELECT=`SELECT p.id,p.sku,p.slug,p.name_ar,p.name_en,p.variants_enabled,(p.variants_enabled AND EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id=p.id AND v.status='ACTIVE')) AS has_shades,p.short_description_ar,p.short_description_en,
 p.details_ar,p.details_en,p.how_to_use_ar,p.how_to_use_en,p.custom_fields,p.status,p.stock_status,p.priority,p.routine_step,p.translation_status,
 p.seo_title_ar,p.seo_title_en,p.seo_description_ar,p.seo_description_en,
 p.selling_price AS base_price,${PRICE} AS selling_price,
 CASE WHEN offer.id IS NOT NULL THEN GREATEST(COALESCE(p.regular_price,0),p.selling_price) ELSE p.regular_price END AS regular_price,
 p.currency,p.category_id,p.brand_id,p.updated_at,p.created_at,p.inventory_quantity,p.low_stock_threshold,
 p.price_approved,p.is_purchase_eligible,p.verified_stock,p.source_id,p.source_sku,p.supplier_name,
 p.source_system,p.custom_fields->>'photo_status' AS photo_status,p.custom_fields->'listing_content' AS listing_content,
 p.custom_fields->'selected_specification'->'colour_preferences' AS enquiry_colours,
 (SELECT COALESCE(json_agg(pr.url ORDER BY pr.sort_order,pr.id),'[]'::json) FROM catalogue_photo_reviews pr WHERE pr.parent_id=p.id AND pr.status='APPROVED' AND COALESCE(pr.qa_status,'UNREVIEWED')<>'FAILED' AND pr.kind='GALLERY' AND pr.content_type='APPLICATION' AND (p.custom_fields->'gallery_priority_urls') ? pr.url) AS gallery_priority_urls,
 p.custom_fields->'listing_content'->>'card_description_en' AS card_description_en,p.custom_fields->'listing_content'->>'card_description_ar' AS card_description_ar,
 (SELECT COUNT(*)::int FROM product_variants pv WHERE pv.product_id=p.id) AS variant_count,
 json_build_object('id',c.id,'slug',c.slug,'name_ar',c.name_ar,'name_en',c.name_en,'priority',c.priority) AS category,
 CASE WHEN featured_category.id IS NULL THEN NULL ELSE json_build_object('id',featured_category.id,'slug',featured_category.slug,'name_ar',featured_category.name_ar,'name_en',featured_category.name_en,'badge_ar',featured_category.badge_ar,'badge_en',featured_category.badge_en) END AS featured_category,
 CASE WHEN b.id IS NULL THEN NULL ELSE json_build_object('id',b.id,'name',b.name,'slug',b.slug,'image_url',b.image_url) END AS brand,
 CASE WHEN offer.id IS NULL THEN NULL ELSE json_build_object('id',offer.id,'title_en',offer.title_en,'title_ar',offer.title_ar,'discount_percent',offer.discount_percent) END AS offer,
 (SELECT json_build_object('url',COALESCE(pi.card_url,pi.webp_url,pi.local_path,pi.cloudinary_url),'width',pi.width,'height',pi.height,'alt_ar',pi.alt_ar,'alt_en',pi.alt_en) FROM product_images pi WHERE pi.product_id=p.id AND COALESCE(pi.webp_url,pi.local_path,pi.cloudinary_url) IS NOT NULL ORDER BY image_order,id LIMIT 1) AS primary_image,
 (SELECT COALESCE(json_agg(photo.url),'[]'::json) FROM (SELECT CASE WHEN url LIKE '/uploads/catalogue-refresh-20261021/%' THEN replace(url,'.webp','-card.webp') ELSE url END AS url FROM catalogue_photo_reviews WHERE parent_id=p.id AND status='APPROVED' AND COALESCE(qa_status,'UNREVIEWED')<>'FAILED' AND (kind='COLOUR' OR (kind='GALLERY' AND content_type IN ('GALLERY','MATERIAL_CLOSEUP','APPLICATION'))) AND (kind<>'COLOUR' OR colour<>COALESCE(p.custom_fields->>'gallery_default_colour','__none')) ORDER BY CASE WHEN kind='GALLERY' THEN 0 ELSE 1 END,sort_order,id LIMIT 5) photo) AS card_gallery
 FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id ${MEMBERSHIP_JOIN} ${OFFER_JOIN}`;
// Product grids do not need full descriptions or private custom fields from the database.
const DISCOVERY_CONTENT="json_build_object('specifications',p.custom_fields->'listing_content'->'specifications','applications_en',p.custom_fields->'listing_content'->>'applications_en','applications_ar',p.custom_fields->'listing_content'->>'applications_ar','search_terms',p.custom_fields->'listing_content'->'search_terms') AS listing_content,";
// Public discovery facts only: no source prices, audit notes or private custom fields.
const DISCOVERY_FACTS="(SELECT json_build_object('materials',COALESCE(json_agg(DISTINCT v.material) FILTER (WHERE v.material IS NOT NULL),'[]'::json),'constructions',COALESCE(json_agg(DISTINCT v.attributes->>'strand_construction') FILTER (WHERE v.attributes->>'strand_construction' IS NOT NULL),'[]'::json),'skus',COALESCE(json_agg(DISTINCT v.sku) FILTER (WHERE v.sku IS NOT NULL),'[]'::json)) FROM product_variants v WHERE v.product_id=p.id AND v.status='ACTIVE') AS discovery,";
const GRID_SELECT=SELECT.replace('p.short_description_ar,p.short_description_en,','').replace('p.details_ar,p.details_en,p.how_to_use_ar,p.how_to_use_en,p.custom_fields,','').replace('p.seo_title_ar,p.seo_title_en,p.seo_description_ar,p.seo_description_en,','').replace("p.custom_fields->'listing_content' AS listing_content,",DISCOVERY_CONTENT+DISCOVERY_FACTS);
const VISIBLE="p.deleted_at IS NULL AND p.status='ACTIVE' AND c.status='ACTIVE' AND (p.source_system IN ('NAJMI_MASTER_46','NAJMI_CLIENT_APPROVAL_20261023') OR NOT EXISTS(SELECT 1 FROM catalogue_import_batches WHERE batch_id='NAJMI46_20261017'))";
const SORT={featured:`${FEATURED_PRIORITY} DESC,p.priority DESC,p.id DESC`,newest:'p.id DESC',oldest:'p.id ASC','name-desc':"COALESCE(NULLIF(p.name_en,''),p.name_ar) DESC,p.id DESC",'quantity-asc':'p.inventory_quantity ASC NULLS LAST,p.id DESC','quantity-desc':'p.inventory_quantity DESC NULLS LAST,p.id DESC','price-asc':`${PRICE} ASC,p.id DESC`,'price-desc':`${PRICE} DESC,p.id DESC`,name:"COALESCE(NULLIF(p.name_en,''),p.name_ar) ASC,p.id DESC"};
function summary(p){const {details_ar,details_en,how_to_use_ar,how_to_use_en,custom_fields,short_description_ar,short_description_en,seo_title_ar,seo_title_en,seo_description_ar,seo_description_en,...rest}=p;return rest;}
function boundedInteger(value,fallback,max){if(value===undefined)return fallback;const n=Number(value);if(!Number.isInteger(n)||n<0||n>max)throw Object.assign(new Error('Invalid pagination'),{status:400});return n;}
async function listProducts(q={},admin=false,connection=db){
 const limit=Math.max(1,boundedInteger(q.limit,24,admin?200:60));
 let offset=boundedInteger(q.offset,0,100000);
 if(q.cursor){const decoded=Buffer.from(String(q.cursor),'base64url').toString();if(!/^offset:\d+$/.test(decoded))throw Object.assign(new Error('Invalid cursor'),{status:400});offset=boundedInteger(decoded.slice(7),0,100000);}
 const params=[],clauses=[admin?'p.deleted_at IS NULL':VISIBLE];const add=(sql,value)=>{params.push(value);clauses.push(sql.replace('?',`$${params.length}`));};
 const searchTerm=q.search||q.q;
 if(searchTerm){params.push('%'+String(searchTerm).slice(0,150)+'%');const n=params.length;clauses.push(`(p.name_ar ILIKE $${n} OR p.name_en ILIKE $${n} OR p.sku ILIKE $${n} OR p.source_id ILIKE $${n} OR b.name ILIKE $${n} OR c.name_en ILIKE $${n} OR c.name_ar ILIKE $${n}${admin?` OR EXISTS(SELECT 1 FROM product_variants sv WHERE sv.product_id=p.id AND (sv.original_inventory_code ILIKE $${n} OR sv.sku ILIKE $${n}))`:''})`);}
 if(q.category){params.push(q.category);const n=params.length;clauses.push(`(c.slug=$${n} OR EXISTS (SELECT 1 FROM product_category_memberships membership JOIN categories extra ON extra.id=membership.category_id WHERE membership.product_id=p.id AND extra.slug=$${n} ${admin?'':"AND extra.status='ACTIVE'"}))`);}
 if(q.category_id)add('p.category_id=?',Number(q.category_id));
 if(q.brand)add('b.slug=?',q.brand);
 if(q.brand_id)add('p.brand_id=?',Number(q.brand_id));
 if(q.catalogSource==='YUESHENG'||q.source==='YUESHENG')clauses.push("p.supplier_name ILIKE '%Yuesheng%'");
 if(q.catalogSource==='MASTER46')clauses.push("p.source_system IN ('NAJMI_MASTER_46','NAJMI_CLIENT_APPROVAL_20261023')");
 if(q.catalogSource==='CLIENT'||q.source==='CLIENT')clauses.push("p.supplier_name IS NULL");
 if(q.status&&admin)add('p.status=?',q.status);
 if(q.stock_status)add('p.stock_status=?',q.stock_status);
 for(const [key,op] of [['min_price','>='],['max_price','<=']]){if(q[key]!==undefined){const v=Number(q[key]);if(!Number.isFinite(v)||v<0)throw Object.assign(new Error('Invalid price range'),{status:400});add(`${PRICE}${op}?`,v);}}
 if(q.min_price!==undefined&&q.max_price!==undefined&&Number(q.min_price)>Number(q.max_price))throw Object.assign(new Error('Invalid price range'),{status:400});
 if(admin&&q.inventory==='low')clauses.push('p.inventory_quantity>0 AND p.inventory_quantity<=p.low_stock_threshold');
 if(admin&&q.inventory==='tracked')clauses.push('p.inventory_quantity IS NOT NULL');
 if(admin&&q.inventory==='untracked')clauses.push('p.inventory_quantity IS NULL');
 if(q.offers==='true')clauses.push('offer.id IS NOT NULL');
 const order=SORT[q.sort]||SORT.featured;params.push(limit+1,offset);
 const {rows}=await connection.query(`${admin?SELECT:GRID_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY ${order} LIMIT $${params.length-1} OFFSET $${params.length}`,params);
 const total=admin?Number((await connection.query(`SELECT COUNT(*)::int AS count FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN brands b ON b.id=p.brand_id ${OFFER_JOIN} WHERE ${clauses.join(' AND ')}`,params.slice(0,-2))).rows[0].count):undefined;
 const more=rows.length>limit;return {total,products:rows.slice(0,limit).map(p=>admin?p:summary(p)),next_cursor:more?Buffer.from('offset:'+(offset+limit)).toString('base64url'):null};
}
async function product(slug,admin=false,connection=db){
 const {rows}=await connection.query(`${SELECT} WHERE ${admin?'p.deleted_at IS NULL':VISIBLE} AND (p.slug=$1 OR p.id::text=$1) ORDER BY CASE WHEN p.slug=$1 THEN 0 ELSE 1 END LIMIT 1`,[slug]);
 if(!rows[0])return null;
 const images=await connection.query('SELECT COALESCE(webp_url,local_path,cloudinary_url) AS url,image_order AS "order",width,height,alt_ar,alt_en,card_url,thumbnail_url,variant_id,color_code FROM product_images WHERE product_id=$1 AND COALESCE(webp_url,local_path,cloudinary_url) IS NOT NULL ORDER BY image_order,id',[rows[0].id]);
 if(images.rows[0])images.rows[0].colour=rows[0].custom_fields?.gallery_default_colour;
 if(isManaged(rows[0].source_system))images.rows.push(...(await connection.query("SELECT url,colour,generated,kind,content_type,CASE WHEN url LIKE '/uploads/catalogue-refresh-20261021/%' THEN replace(url,'.webp','-thumb.webp') ELSE url END AS thumbnail_url FROM catalogue_photo_reviews WHERE parent_id=$1 AND status='APPROVED' AND COALESCE(qa_status,'UNREVIEWED')<>'FAILED' AND (kind='COLOUR' OR (kind='GALLERY' AND content_type IN ('GALLERY','MATERIAL_CLOSEUP','APPLICATION'))) AND (kind<>'COLOUR' OR colour<>$2) ORDER BY sort_order,id",[rows[0].id,rows[0].custom_fields?.gallery_default_colour||'__none'])).rows);
 const priority=rows[0].gallery_priority_urls||[];images.rows.sort((a,b)=>{const ai=priority.indexOf(a.url),bi=priority.indexOf(b.url);return (ai<0?9999:ai)-(bi<0?9999:bi)});
 const additional=(await connection.query("SELECT c.id,c.slug,c.name_en,c.name_ar,c.priority,c.status,c.badge_en,c.badge_ar FROM product_category_memberships m JOIN categories c ON c.id=m.category_id WHERE m.product_id=$1 AND ($2::boolean OR c.status='ACTIVE') ORDER BY c.priority DESC,c.id",[rows[0].id,admin])).rows;
 const result={...rows[0],images:images.rows,additional_categories:additional,content_sections:require('./product-content').contentSections(rows[0])};result.variants=admin||result.variants_enabled?(await connection.query("SELECT id,name_en,name_ar,color_hex,sku,image_url,stock_status,inventory_quantity,status,priority,diameter_mm,length_value,length_unit,selling_unit,color,color_ar,pack_weight_kg,material,material_ar,selling_price,price_approved,is_purchase_eligible,attributes FROM product_variants WHERE product_id=$1 AND ($2::boolean OR status='ACTIVE') ORDER BY priority DESC,id",[result.id,admin])).rows:[];if(!admin){result.custom_field_display=await require('./product-fields').display(result.custom_fields);delete result.custom_fields;}return result;
}
async function byIds(ids,connection=db){if(!ids.length)return [];const products=(await connection.query(`${SELECT} WHERE ${VISIBLE} AND p.id=ANY($1::int[])`,[ids])).rows.map(({custom_fields,...p})=>p);const variants=(await connection.query("SELECT id,product_id,name_en,name_ar,color_hex,image_url,stock_status,inventory_quantity,selling_price,diameter_mm,length_value,length_unit,color,material,price_approved,is_purchase_eligible FROM product_variants WHERE product_id=ANY($1::int[]) AND status='ACTIVE'",[products.filter(p=>p.variants_enabled).map(p=>p.id)])).rows;return products.map(p=>({...p,variants:variants.filter(v=>v.product_id===p.id)}));}
async function recommendations(ids,customerId,limit=8){
 const safeIds=[...new Set(ids.map(Number).filter(n=>Number.isInteger(n)&&n>0))].slice(0,20);
 // Complementary routine steps first, then same category, followed by configurable merchandising.
 const seeds=await byIds(safeIds);let categories=seeds.map(p=>p.category_id);
 if(customerId){const {rows}=await db.query("SELECT DISTINCT p.category_id FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE o.customer_id=$1 AND o.status IN ('CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED') LIMIT 12",[customerId]);categories.push(...rows.map(r=>r.category_id));}
 const pairs={cleanser:['toner','moisturizer','sunscreen'],toner:['serum','moisturizer'],serum:['moisturizer','sunscreen'],moisturizer:['cleanser','sunscreen'],foundation:['primer','concealer','setting'],lipstick:['lipliner'],mascara:['eyeliner'],sunscreen:['cleanser']};
 const steps=[...new Set(seeds.flatMap(p=>pairs[p.routine_step]||[]))];
 const {rows}=await db.query(`${GRID_SELECT} WHERE ${VISIBLE} AND (p.stock_status='IN_STOCK' OR p.selling_price IS NULL) AND NOT(p.id=ANY($1::int[])) ORDER BY CASE WHEN p.routine_step=ANY($2::text[]) THEN 0 WHEN p.category_id=ANY($3::int[]) THEN 1 ELSE 2 END,${FEATURED_PRIORITY} DESC,p.priority DESC,p.id DESC LIMIT $4`,[safeIds,steps,categories,limit]);
 return rows.map(summary);
}
module.exports={listProducts,product,byIds,recommendations,SELECT,VISIBLE,PRICE};
