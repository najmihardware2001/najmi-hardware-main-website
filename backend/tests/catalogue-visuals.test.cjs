const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {db,app,request,setup}=require('./fixture.cjs');
const service=require('../src/services/master-catalogue');
let token,parent,other,first,second,failed,foreign,colour;
const admin=(method,url)=>request(app)[method](url).set('Authorization','Bearer '+token);
const base=()=>`/api/admin/products/${parent}`;
async function photo(p,name,extra={}){return (await db.query(`INSERT INTO catalogue_photo_reviews(parent_id,url,kind,generated,status,file_hash,content_type,qa_status,colour) VALUES($1,$2,$3,true,$4,$5,$6,$7,$8) RETURNING id`,[p,'/uploads/test/'+name+'.webp',extra.kind||'GALLERY',extra.status||'PENDING_APPROVAL','a'.repeat(64),extra.role||'MATERIAL_CLOSEUP',extra.qa||'REVIEW_REQUIRED',extra.colour||''])).rows[0].id;}
before(async()=>{
 token=await setup();const cat=(await db.query("INSERT INTO categories(name_en,slug) VALUES('Visual test','visual-test') RETURNING id")).rows[0].id;
 for(const [key,slug]of [['ROP-VISUAL','visual-parent'],['ROP-OTHER','visual-other']]){const p=(await db.query("INSERT INTO products(name_en,slug,category_id,currency,status,source_system,source_id,custom_fields) VALUES($1,$2,$3,'KWD','ACTIVE',$4,$5,'{}') RETURNING id",[key,slug,cat,service.SYSTEM,key])).rows[0].id;if(key==='ROP-VISUAL')parent=p;else other=p;}
 await db.query("INSERT INTO product_images(product_id,local_path,image_order) VALUES($1,'/uploads/old.webp',1)",[parent]);
 await db.query("INSERT INTO catalogue_evidence(batch,kind,parent_id,source_row,raw) VALUES('TEST','colours',$1,1,$2)",[parent,JSON.stringify({colour_or_pattern:'Black'})]);
 first=await photo(parent,'first');second=await photo(parent,'second',{role:'APPLICATION'});failed=await photo(parent,'bad',{qa:'FAILED'});foreign=await photo(other,'foreign');colour=await photo(parent,'colour',{kind:'COLOUR',role:'COLOUR',colour:'Black'});
});
after(async()=>db.pool.end());

test('priority bag views require same-parent approved application photos and keep commercial data intact',async()=>{
 const p=(await db.query("INSERT INTO products(name_en,slug,category_id,currency,status,source_system,source_id,custom_fields) SELECT 'TEST Polybag handles','priority-polybag',category_id,'KWD','ACTIVE',source_system,'TEST-PRIORITY','{}' FROM products WHERE id=$1 RETURNING id",[other])).rows[0].id;
 await db.query("INSERT INTO product_images(product_id,local_path,image_order) VALUES($1,'/uploads/normal-handle.webp',1)",[p]);
 const ids=[];for(let i=1;i<=3;i++){const id=await photo(p,'bag-view-'+i,{role:'APPLICATION',status:'APPROVED'});await db.query('UPDATE catalogue_photo_reviews SET sort_order=$2 WHERE id=$1',[id,i]);ids.push(id)}
 const pending=await photo(p,'pending-bag',{role:'APPLICATION'}),foreignApproved=await photo(other,'foreign-approved-bag',{role:'APPLICATION',status:'APPROVED'});await photo(p,'failed-bag',{role:'APPLICATION',status:'APPROVED',qa:'FAILED'});
 const urls=(await db.query('SELECT url FROM catalogue_photo_reviews WHERE id=ANY($1::int[]) ORDER BY sort_order,id',[ids])).rows.map(r=>r.url);
 await db.query('UPDATE products SET custom_fields=$2 WHERE id=$1',[p,JSON.stringify({gallery_priority_urls:[...urls,'/uploads/test/pending-bag.webp','/uploads/test/foreign-approved-bag.webp','/uploads/test/failed-bag.webp']})]);
 const before=(await db.query('SELECT selling_price,inventory_quantity,verified_stock,price_approved,is_purchase_eligible FROM products WHERE id=$1',[p])).rows[0];
 const product=(await request(app).get('/api/products/'+p)).body.product;assert.deepEqual(product.gallery_priority_urls,urls);assert.deepEqual(product.images.slice(0,3).map(i=>i.url),urls);assert.equal(product.images[3].url,'/uploads/normal-handle.webp');assert.equal(product.primary_image.url,'/uploads/normal-handle.webp');
 const grid=(await request(app).get('/api/products?limit=60')).body.products.find(x=>x.id===p);assert.deepEqual(grid.gallery_priority_urls,urls);
 assert.deepEqual((await db.query('SELECT selling_price,inventory_quantity,verified_stock,price_approved,is_purchase_eligible FROM products WHERE id=$1',[p])).rows[0],before);assert.ok(pending&&foreignApproved);
});

test('approved colour imagery adds an enquiry preference without a source price or purchase approval; failed imagery stays hidden',async()=>{
 const mixed=await photo(other,'mixed-enquiry',{kind:'COLOUR',role:'COLOUR',colour:'Black + Yellow',status:'APPROVED'});
 await photo(other,'failed-approved-legacy',{kind:'COLOUR',role:'COLOUR',colour:'Incorrect colour',status:'APPROVED',qa:'FAILED'});
 const config=(await request(app).get(`/api/products/${other}/configuration`)).body;
 assert.ok(config.colour_preferences.includes('Black + Yellow'));assert.ok(!config.colour_preferences.includes('Incorrect colour'));assert.deepEqual(config.colour_photos.map(p=>p.url),['/uploads/test/mixed-enquiry.webp']);
 const enquiry=await request(app).post('/api/catalogue/resolve').send({parent_id:other,criteria:{requested_colour:'Black + Yellow'}});assert.equal(enquiry.status,200);assert.equal(enquiry.body.resolution.state,'PREFERENCE_ENQUIRY');assert.equal(enquiry.body.resolution.purchasable,false);assert.equal(enquiry.body.resolution.retail_price,null);
 assert.equal((await request(app).post('/api/catalogue/resolve').send({parent_id:other,criteria:{requested_colour:'Incorrect colour'}})).status,400);assert.ok(mixed);
});
test('visual review endpoints require an authenticated administrator; pending drafts stay private',async()=>{
 assert.equal((await request(app).post(base()+'/visual-review').send({})).status,401);
 const pub=await request(app).get(`/api/products/${parent}/visuals`);assert.equal(pub.status,200);assert.deepEqual(pub.body.assets,[]);
});
test('batch requires individual comparison, meaningful reason, unique same-parent images and valid files',async()=>{
 const valid={ids:[first,second],status:'APPROVED',reason:'Compared construction and colour to supplied source',individually_compared:true};
 for(const b of [{...valid,individually_compared:false},{...valid,reason:''},{...valid,ids:[first,first]},{...valid,ids:[first,foreign]},{...valid,ids:[failed]}]){const r=await admin('post',base()+'/visual-review').send(b);assert.equal(r.status,400,JSON.stringify(r.body));}
 assert.equal((await admin('patch',base()+`/catalogue-photos/${failed}`).send({status:'APPROVED'})).status,400);
 const approved=await admin('post',base()+'/visual-review').send(valid);assert.equal(approved.status,200,JSON.stringify(approved.body));assert.equal(approved.body.reviewed,2);
 const visible=(await request(app).get(`/api/products/${parent}/visuals`)).body.assets;assert.deepEqual(visible.map(v=>v.id),[first,second]);
 const product=(await request(app).get(`/api/products/${parent}`)).body.product;
 assert.ok(visible.every(asset=>product.images.some(image=>image.url===asset.url)),'Approved same-parent photos are available to the slideshow');
 assert.ok(product.images.every(image=>!image.url.includes('failed')&&!image.url.includes('foreign')),'Failed and foreign photographs stay private');
 const grid=(await request(app).get('/api/products?limit=60')).body.products.find(p=>p.id===parent);
 assert.ok(visible.every(asset=>grid.card_gallery.includes(asset.url)),'Shop cards receive approved same-parent slideshow photos');
 assert.equal((await db.query('SELECT status FROM catalogue_photo_reviews WHERE id=$1',[foreign])).rows[0].status,'PENDING_APPROVAL');
});
test('gallery order is persisted; changing visual identity resets approval and invalid colours are rejected',async()=>{
 let r=await admin('patch',base()+`/visuals/${second}`).send({sort_order:2});assert.equal(r.status,200);assert.equal(r.body.approval_reset,false);
 assert.equal((await request(app).get(`/api/products/${parent}/visuals`)).body.assets[0].id,second);
 for(const b of [{content_type:'INVALID'},{sort_order:-1},{content_type:'COLOUR',colour:'Invented blue'}])assert.equal((await admin('patch',base()+`/visuals/${first}`).send(b)).status,400);
 r=await admin('patch',base()+`/visuals/${first}`).send({content_type:'COLOUR',colour:'Black'});assert.equal(r.status,200);assert.equal(r.body.approval_reset,true);
 const stored=(await db.query('SELECT * FROM catalogue_photo_reviews WHERE id=$1',[first])).rows[0];assert.equal(stored.status,'PENDING_APPROVAL');assert.equal(stored.reviewed_by,null);assert.equal(stored.kind,'COLOUR');
 assert.equal((await request(app).get(`/api/products/${parent}/configuration`)).body.colour_photos.length,0);
 await admin('patch',base()+`/catalogue-photos/${first}`).send({status:'APPROVED'});
 assert.equal((await request(app).get(`/api/products/${parent}/configuration`)).body.colour_photos[0].url,'/uploads/test/first.webp');
});
test('main image requires same-parent approval and cannot be modified through a batch or role reassignment',async()=>{
 for(const id of [failed,foreign,colour])assert.equal((await admin('post',base()+`/visuals/${id}/main`).send({})).status,400);
 const before=(await db.query('SELECT custom_fields,inventory_quantity,price_approved,is_purchase_eligible FROM products WHERE id=$1',[parent])).rows[0];
 let r=await admin('post',base()+`/visuals/${second}/main`).send({});assert.equal(r.status,200,JSON.stringify(r.body));
 assert.equal((await db.query('SELECT webp_url FROM product_images WHERE product_id=$1',[parent])).rows[0].webp_url,'/uploads/test/second.webp');
 assert.equal((await admin('post',base()+'/visual-review').send({ids:[second],status:'REJECTED',reason:'Compared each original reference photograph',individually_compared:true})).status,400);
 assert.equal((await admin('patch',base()+`/visuals/${second}`).send({content_type:'COLOUR',colour:'Black'})).status,400);
 const after=(await db.query('SELECT inventory_quantity,price_approved,is_purchase_eligible FROM products WHERE id=$1',[parent])).rows[0];for(const k of Object.keys(after))assert.equal(after[k],before[k]);
 await admin('patch',base()+`/catalogue-photos/${second}`).send({status:'REJECTED'});
 assert.equal((await db.query('SELECT webp_url FROM product_images WHERE product_id=$1',[parent])).rows[0].webp_url,'/uploads/selected-category/photo-coming-soon.webp');
 assert.ok(!(await request(app).get(`/api/products/${parent}/visuals`)).body.assets.some(p=>p.id===second));
});
