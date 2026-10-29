const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {db,app,request,setup,checkout}=require('./fixture.cjs');
const service=require('../src/services/master-catalogue');
let token,parent,variant,rfq,quote;
const criteria={size_value:10,size_unit:'mm',length_value:100,length_unit:'yard',color:'Black'};
const admin=(method,url)=>request(app)[method](url).set('Authorization','Bearer '+token);
before(async()=>{
 token=await setup();const category=(await db.query("INSERT INTO categories(name_en,name_ar,slug) VALUES('TEST ropes','حبال','test-master') RETURNING id")).rows[0].id;
 parent=(await db.query("INSERT INTO products(name_en,name_ar,slug,category_id,currency,status,source_system,source_id,variants_enabled,stock_status,inventory_quantity,selling_price,price_approved,is_purchase_eligible) VALUES('TEST rope','حبل','master-test',$1,'KWD','ACTIVE',$2,'ROP-TEST',true,'OUT_OF_STOCK',NULL,NULL,false,false) RETURNING id",[category,service.SYSTEM])).rows[0].id;
 variant=(await db.query(`INSERT INTO product_variants(product_id,name_en,sku,original_inventory_code,original_parent_id,size_value,size_unit,length_value,length_unit,color,selling_unit,source_client_sales_price,computed_retail_price,selling_price,price_approved,is_purchase_eligible,media_approved,inventory_quantity,status,stock_status,mapping_status,attributes) VALUES($1,'TEST source','', 'EXACT-001','ROP-TEST',10,'mm',100,'yard','Black','ROLL',1,1.6,1.6,false,false,false,NULL,'DRAFT','OUT_OF_STOCK','PENDING',$2) RETURNING id`,[parent,JSON.stringify({size_parse_status:'SINGLE_EXPLICIT',length_parse_status:'SINGLE_EXPLICIT',raw:'preserved'})])).rows[0].id;
 await db.query("INSERT INTO catalogue_evidence(batch,kind,parent_id,source_row,raw) VALUES('TEST','pairs',$1,1,$2)",[parent,JSON.stringify({pair_option_status:'SOURCE_OBSERVED_SINGLE_PAIR',original_inventory_codes:'EXACT-001'})]);
});
after(async()=>db.pool.end());
test('retail arithmetic preserves missing values, uses 60 percent and rounds half-up in integer fils',()=>{
 assert.equal(service.retailPrice('3.5'),'5.600');assert.equal(service.retailPrice('1.005'),'1.608');assert.equal(service.retailPrice('0.025'),'0.040');assert.equal(service.retailPrice(''),null);assert.equal(service.retailPrice(null),null);assert.throws(()=>service.retailPrice('bad'));
});
test('exact resolution preserves unknowns, patterns, dimensions and units without Cartesian combinations',()=>{
 const row={...criteria,mapping_status:'PENDING',color:'White, Red'};
 assert.equal(service.matching([row],{color:'Red'}).length,0);
 assert.equal(service.matching([{...row,color:null}],{color:'White, Red'}).length,0);
 assert.equal(service.matching([row],{length_unit:'m'}).length,0);
 assert.equal(service.resolve([row],{...criteria,color:'White, Red'}).state,'INQUIRY_ONLY');
 assert.equal(service.resolve([row,row],{...criteria,color:'White, Red'}).state,'AMBIGUOUS');
 assert.equal(service.resolve([{...row,color:null}],{...criteria,color:undefined,unknown_colour:true}).purchasable,false);
});
test('source options are shown as provisional; unapproved imported source prices remain independently visible without retail approval',async()=>{
 const r=await request(app).post('/api/catalogue/resolve').send({parent_id:parent,criteria});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.rows.length,1);assert.equal(r.body.rows[0].selling_price,null);assert.equal(r.body.resolution.state,'INQUIRY_ONLY');
 assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:parent,variantId:variant,qty:1}]})).status,409);
});
test('RFQ rejects prices, invented combinations and incorrect supply units, then stores a price-free exact specification',async()=>{
 const body={parent_id:parent,configuration:criteria,unit:'ROLL',quantity:5,customer:{name:'TEST buyer',phone:'+96555551234'}};
 for(const bad of [{...body,price:9},{...body,configuration:{...criteria,length_unit:'m'}},{...body,unit:'PCS'}])assert.equal((await request(app).post('/api/catalogue/rfq').send(bad)).status,400);
 const r=await request(app).post('/api/catalogue/rfq').send(body);assert.equal(r.status,201,JSON.stringify(r.body));
 rfq={...r.body,...(await db.query('SELECT id FROM rfqs WHERE rfq_number=$1',[r.body.rfqNumber])).rows[0]};
 const item=(await db.query('SELECT * FROM rfq_items WHERE rfq_id=$1',[rfq.id])).rows[0];assert.equal(item.target_price,null);assert.equal(item.target_unit_price,null);assert.equal(item.variant_id,variant);assert.equal(item.unit,'ROLL');
 assert.equal((await db.query('SELECT configuration FROM catalogue_rfq_configs WHERE rfq_id=$1',[rfq.id])).rows[0].configuration.color,'Black');
});
test('admin sees exact source specification, must enter wholesale price manually, and guest view is access protected',async()=>{
 const detail=await admin('get','/api/admin/rfq/'+rfq.id);assert.equal(detail.status,200);assert.equal(detail.body.lines[0].customSpecs.length_unit,'yard');assert.equal(detail.body.lines[0].unit,'ROLL');
 assert.equal((await admin('post',`/api/admin/rfq/${rfq.id}/quote`).send({lines:[{productNameEn:'TEST rope',quantity:5,unitPrice:''}]})).status,400);
 const r=await admin('post',`/api/admin/rfq/${rfq.id}/quote`).send({lines:[{productNameEn:'TEST rope',quantity:5,unitPrice:'2.125'}],deliveryFee:0});assert.equal(r.status,201,JSON.stringify(r.body));quote=r.body.quotation;
 assert.equal(Number(quote.total_amount),10.625);
 assert.equal((await request(app).get('/api/rfq/view/'+rfq.rfqNumber)).status,403);
 const view=await request(app).get('/api/rfq/view/'+rfq.rfqNumber+'?key='+rfq.accessKey);assert.equal(view.body.quotations[0].lines[0].unitPrice,2.125);
 assert.equal((await request(app).get('/api/rfq/view/'+rfq.rfqNumber+'/pdf?key='+rfq.accessKey)).status,200);
});
test('quotation acceptance never creates an order or bypasses exact stock validation',async()=>{
 const before=Number((await db.query('SELECT count(*) n FROM orders')).rows[0].n);
 const r=await request(app).post(`/api/rfq/${rfq.rfqNumber}/respond?key=${rfq.accessKey}`).send({action:'ACCEPT'});assert.equal(r.status,200,JSON.stringify(r.body));
 assert.equal((await admin('post',`/api/admin/rfq/${rfq.id}/quote/${quote.id}/convert-to-order`).send({})).status,409);
 assert.equal(Number((await db.query('SELECT count(*) n FROM orders')).rows[0].n),before);
 assert.equal((await request(app).post('/api/checkout').send(checkout(parent,{items:[{productId:parent,variantId:variant,qty:1}]}))).status,409);
});
test('generated colour and gallery images are private to the review set until approval; rejection removes them',async()=>{
 const url='https://media.example.invalid/test-colour.webp';
 const created=await admin('post',`/api/admin/products/${parent}/catalogue-photos`).send({url,kind:'COLOUR',colour:'Black',generated:true});assert.equal(created.status,200,JSON.stringify(created.body));
 assert.equal((await request(app).get(`/api/products/${parent}/configuration`)).body.colour_photos.length,0);
 const path=`/api/admin/products/${parent}/catalogue-photos/${created.body.id}`;
 assert.equal((await admin('patch',path).send({status:'APPROVED'})).status,200);
 assert.equal((await request(app).get(`/api/products/${parent}/configuration`)).body.colour_photos[0].url,url);
 await admin('patch',path).send({status:'REJECTED'});assert.equal((await request(app).get(`/api/products/${parent}/configuration`)).body.colour_photos.length,0);
 const gallery=await admin('post',`/api/admin/products/${parent}/catalogue-photos`).send({url:url.replace('colour','gallery'),kind:'GALLERY'});await admin('patch',`/api/admin/products/${parent}/catalogue-photos/${gallery.body.id}`).send({status:'APPROVED'});
 assert.equal((await request(app).get('/api/products/'+parent)).body.product.images.length,1);
});
test('purchase approval requires every gate; review persists and preserves original source',async()=>{
 const path=`/api/admin/products/${parent}/catalogue/${variant}`;
 assert.equal((await admin('patch',path).send({mapping_status:'APPROVED',price_approved:true,is_purchase_eligible:true})).status,400);
 const r=await admin('patch',path).send({mapping_status:'APPROVED',price_approved:true,media_approved:true,is_purchase_eligible:true,inventory_quantity:10});assert.equal(r.status,200,JSON.stringify(r.body));
 const stored=(await admin('get',`/api/admin/products/${parent}/catalogue`)).body.variants[0];assert.equal(stored.original_inventory_code,'EXACT-001');assert.equal(stored.attributes.raw,'preserved');assert.equal(Number(stored.source_client_sales_price),1);assert.equal(stored.inventory_quantity,10);
 assert.equal((await request(app).post('/api/catalogue/resolve').send({parent_id:parent,criteria})).body.resolution.purchasable,true);
});
test('approved retail COD uses server price and verified stock; direct parent purchase and overselling fail',async()=>{
 assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:parent,qty:1}]})).status,409);
 const r=await request(app).post('/api/checkout').send(checkout(parent,{items:[{productId:parent,variantId:variant,qty:2,price:0.001}]}));assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal(Number((await db.query('SELECT price_at_purchase FROM order_items WHERE variant_id=$1',[variant])).rows[0].price_at_purchase),1.6);
 assert.equal((await db.query('SELECT inventory_quantity FROM product_variants WHERE id=$1',[variant])).rows[0].inventory_quantity,8);
 assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:parent,variantId:variant,qty:9}]})).status,409);
});
test('a duplicate ledger code association or unverified stock blocks purchase even after other approvals',async()=>{
 await db.query("INSERT INTO product_variants(product_id,name_en,sku,original_inventory_code,size_value,size_unit,length_value,length_unit,color,mapping_status,status) VALUES($1,'TEST duplicate','','EXACT-002',10,'mm',100,'yard','Black','PENDING','DRAFT')",[parent]);
 assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:parent,variantId:variant,qty:1}]})).status,409);
 await db.query("UPDATE product_variants SET mapping_status='REJECTED' WHERE original_inventory_code='EXACT-002'");
 await db.query('UPDATE product_variants SET inventory_quantity=NULL WHERE id=$1',[variant]);
 assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:parent,variantId:variant,qty:1}]})).status,409);
});
test('legacy edit routes cannot replace source evidence or publish an unapproved catalogue photograph',async()=>{
 const edit=await admin('put',`/api/admin/products/${parent}/variants/${variant}`).send({name_en:'Overwrite',attributes:{}});assert.equal(edit.status,409);
 const url='https://media.example.invalid/pending-main.webp';await admin('post',`/api/admin/products/${parent}/catalogue-photos`).send({url,kind:'MAIN',generated:true});
 assert.equal((await admin('put',`/api/admin/products/${parent}`).send({images:[{url}]})).status,409);
 assert.equal((await db.query('SELECT attributes FROM product_variants WHERE id=$1',[variant])).rows[0].attributes.raw,'preserved');
});
test('selected collection scope hides legacy rows even if an old product is made active',async()=>{
 const cat=(await db.query('SELECT category_id FROM products WHERE id=$1',[parent])).rows[0].category_id;
 const old=(await db.query("INSERT INTO products(name_en,slug,category_id,currency,status,stock_status,selling_price,price_approved,is_purchase_eligible,inventory_quantity) VALUES('Legacy reactivated','legacy-reactivated',$1,'KWD','ACTIVE','IN_STOCK',1,true,true,10) RETURNING id",[cat])).rows[0].id;
 assert.equal((await request(app).get('/api/products/'+old)).status,200);
 await db.query("INSERT INTO catalogue_import_batches(batch_id,source_file,parents_imported,variants_imported,status,metadata) VALUES('NAJMI46_20261017','TEST',46,951,'PUBLISHED_INQUIRY_ONLY','{}')");
 assert.equal((await request(app).get('/api/products/'+old)).status,404);
 assert.equal((await request(app).get('/api/search?q=reactivated')).body.products.length,0);
 assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:old,qty:1}]})).status,409);
 assert.equal((await request(app).get('/api/categories?populated=true')).body.find(c=>c.id===cat).product_count,1);
});
test('admin catalogue summary counts real records and selected collection independently of filters',async()=>{
 const r=await admin('get','/api/admin/products/summary');assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.total,2);assert.equal(r.body.selected,1);assert.equal(r.body.published,1);
 assert.equal((await request(app).get('/api/admin/products/summary')).status,401);
 const selected=await admin('get','/api/admin/products?catalogSource=MASTER46');assert.equal(selected.body.total,1);assert.equal(selected.body.products[0].id,parent);
});
test('future generated main photos require approval, retain AI disclosure and revoke every rendition on rejection',async()=>{
 const before=(await db.query('SELECT mapping_status,inventory_quantity,price_approved,media_approved,is_purchase_eligible FROM product_variants WHERE id=$1',[variant])).rows[0];
 const placeholder='/uploads/selected-category/photo-coming-soon.webp',url='https://media.example.invalid/illustration-main.webp';
 await db.query('INSERT INTO product_images(product_id,local_path,image_order) VALUES($1,$2,1)',[parent,placeholder]);
 const upload=await admin('post',`/api/admin/products/${parent}/catalogue-photos`).send({url,kind:'MAIN',generated:true});assert.equal(upload.status,200);assert.equal(upload.body.status,'PENDING_APPROVAL');
 assert.equal((await request(app).get('/api/products/'+parent)).body.product.primary_image.url,placeholder);
 const endpoint=`/api/admin/products/${parent}/catalogue-photos/${upload.body.id}`;assert.equal((await admin('patch',endpoint).send({status:'APPROVED'})).status,200);
 const live=(await request(app).get('/api/products/'+parent)).body.product;assert.equal(live.photo_status,'AI_ILLUSTRATION');assert.equal(live.primary_image.url,url);assert.equal(live.images[0].card_url,url);
 assert.equal((await admin('patch',endpoint).send({status:'REJECTED'})).status,200);
 const rejected=(await request(app).get('/api/products/'+parent)).body.product;assert.equal(rejected.primary_image.url,placeholder);assert.equal(rejected.images[0].url,placeholder);assert.equal(rejected.images[0].card_url,placeholder);assert.equal(rejected.images[0].thumbnail_url,placeholder);
 assert.deepEqual((await db.query('SELECT mapping_status,inventory_quantity,price_approved,media_approved,is_purchase_eligible FROM product_variants WHERE id=$1',[variant])).rows[0],before);
});
test('inventory shows unknown quantities separately and a verified adjustment persists without approving identity or price',async()=>{
 const inventory=await admin('get','/api/admin/inventory?stock=UNKNOWN');assert.equal(inventory.status,200,JSON.stringify(inventory.body));assert.equal(inventory.body.total,2);assert.ok(inventory.body.items.every(v=>v.inventory_quantity===null));
 assert.equal((await request(app).get('/api/admin/inventory')).status,401);
 const pending=inventory.body.items.find(v=>v.original_inventory_code==='EXACT-002');assert.ok(pending);
 assert.equal((await admin('patch',`/api/admin/inventory/${pending.id}`).send({quantity:7,reason:''})).status,400);
 const result=await admin('patch',`/api/admin/inventory/${pending.id}`).send({quantity:7,reason:'TEST physical count reference 17 October'});assert.equal(result.status,200,JSON.stringify(result.body));
 const after=(await db.query('SELECT * FROM product_variants WHERE id=$1',[pending.id])).rows[0];assert.equal(after.inventory_quantity,7);assert.equal(after.mapping_status,'REJECTED');assert.equal(after.price_approved,false);assert.equal(after.is_purchase_eligible,false);
 assert.equal((await db.query("SELECT count(*)::int n FROM admin_audit_log WHERE action='inventory.verified_adjustment' AND entity_id=$1",[String(pending.id)])).rows[0].n,1);
 assert.equal((await admin('get','/api/admin/inventory?stock=IN_STOCK')).body.total,1);
});
