const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { db, request, app, setup } = require('./fixture.cjs');
let productId, token;
before(async () => {
  token = await setup();
  const category = (await db.query("INSERT INTO categories(name_en,name_ar,slug) VALUES('Selected ropes','حبال مختارة','selected-ropes') RETURNING id")).rows[0].id;
  productId = (await db.query(`INSERT INTO products(slug,name_en,name_ar,category_id,currency,selling_price,status,inventory_quantity,price_approved,is_purchase_eligible)
    VALUES('selected-inquiry-rope','Inquiry Rope','حبل للاستفسار',$1,'KWD',NULL,'ACTIVE',NULL,false,false) RETURNING id`, [category])).rows[0].id;
  await db.query("INSERT INTO products(slug,name_en,category_id,currency,selling_price,status) VALUES('held-rope','Held Rope',$1,'KWD',NULL,'DRAFT')", [category]);
});
after(async () => db.pool.end());
test('category counts exclude held drafts and slug filters list the published product', async () => {
  const categories = await request(app).get('/api/categories');
  assert.equal(categories.status, 200);
  assert.equal(categories.body.find(c => c.slug === 'selected-ropes').product_count, 1);
  const listing = await request(app).get('/api/products?category=selected-ropes');
  assert.equal(listing.status, 200);
  assert.deepEqual(listing.body.products.map(p => p.id), [productId]);
});
test('simple inquiry product opens by card ID and slug, has no invented variants, and cannot be purchased', async () => {
  const byId = await request(app).get('/api/products/' + productId);
  const bySlug = await request(app).get('/api/products/selected-inquiry-rope');
  assert.equal(byId.status, 200);
  assert.equal(bySlug.status, 200);
  assert.equal(byId.body.product.id, bySlug.body.product.id);
  assert.equal(byId.body.product.selling_price, null);
  assert.deepEqual(byId.body.product.variants, []);
  assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId,qty:1}]})).status, 409);
});
test('approved price does not permit checkout without purchase eligibility and known inventory', async () => {
  await db.query('UPDATE products SET selling_price=1.250,price_approved=true,is_purchase_eligible=false WHERE id=$1', [productId]);
  assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId,qty:1}]})).status, 409);
  await db.query('UPDATE products SET is_purchase_eligible=true WHERE id=$1', [productId]);
  assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId,qty:1}]})).status, 409);
});
test('admin partial edit persists for an unpriced draft without replacing images or other content', async () => {
  await db.query("UPDATE products SET selling_price=NULL,status='DRAFT',sku='CLIENT-REFERENCE',details_en='Preserved detailed copy',custom_fields=$2 WHERE id=$1", [productId,JSON.stringify({provenance:'client'})]);
  await db.query("INSERT INTO product_images(product_id,cloudinary_url,image_order,width,height,source_filename) VALUES($1,'https://media.example.invalid/selected.webp',1,640,640,'client-original.jfif')", [productId]);
  const originalImages = (await db.query('SELECT * FROM product_images WHERE product_id=$1',[productId])).rows;
  const update = await request(app).put('/api/admin/products/'+productId).set('Authorization','Bearer '+token).send({name_en:'Edited inquiry rope',short_description_en:'Updated short copy'});
  assert.equal(update.status,200,JSON.stringify(update.body));
  for(let refresh=0;refresh<2;refresh++) {
    const detail = await request(app).get('/api/admin/products/'+productId).set('Authorization','Bearer '+token);
    assert.equal(detail.status,200);
    const row=(await db.query('SELECT * FROM products WHERE id=$1',[productId])).rows[0];
    assert.equal(row.name_en,'Edited inquiry rope');
    assert.equal(row.selling_price,null);
    assert.equal(row.status,'DRAFT');
    assert.equal(row.sku,'CLIENT-REFERENCE');
    assert.equal(row.details_en,'Preserved detailed copy');
    assert.deepEqual(row.custom_fields,{provenance:'client'});
    assert.deepEqual((await db.query('SELECT * FROM product_images WHERE product_id=$1',[productId])).rows,originalImages);
  }
});
test('paused catalogue records are hidden from every public product path while admin retains access', async () => {
  const category=(await db.query('SELECT category_id FROM products WHERE id=$1',[productId])).rows[0].category_id;
  const old=(await db.query("INSERT INTO products(slug,name_en,name_ar,category_id,currency,selling_price,status) VALUES('paused-old-rope','Paused legacy rope','حبل قديم',$1,'KWD',NULL,'INACTIVE') RETURNING id",[category])).rows[0].id;
  await db.query("UPDATE products SET status='ACTIVE' WHERE id=$1",[productId]);
  const paths=['/api/products?limit=60','/api/products?category=selected-ropes','/api/search?q=legacy','/api/recommendations?ids='+productId];
  for(const url of paths){
    const result=await request(app).get(url);assert.equal(result.status,200,JSON.stringify(result.body));
    assert.ok(!result.body.products.some(p=>p.id===old));
  }
  assert.equal((await request(app).get('/api/products/'+old)).status,404);
  assert.equal((await request(app).get('/api/products/paused-old-rope')).status,404);
  assert.equal((await request(app).get('/api/admin/products/'+old).set('Authorization','Bearer '+token)).status,200);
  assert.deepEqual(await require('../src/services/catalog').byIds([old]),[]);
  assert.equal((await request(app).post('/api/cart/quote').send({items:[{productId:old,qty:1}]})).status,409);
  const visible=await request(app).get('/api/categories?populated=true');assert.equal(visible.body[0].product_count,1);
});
