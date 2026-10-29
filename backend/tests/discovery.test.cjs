const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {db,app,request,setup}=require('./fixture.cjs');
let parent;
before(async()=>{
 await setup();const category=(await db.query("INSERT INTO categories(name_en,slug) VALUES('Discovery','discovery-test') RETURNING id")).rows[0].id;
 parent=(await db.query("INSERT INTO products(name_en,slug,category_id,currency,status,custom_fields) VALUES('Discovery rope','discovery-rope',$1,'KWD','ACTIVE',$2) RETURNING id",[category,JSON.stringify({private_supplier_note:'NEVER EXPOSE',listing_content:{specifications:[{key:'diameter',en:'6 mm, 8 mm',ar:'6 مم، 8 مم'}],applications_en:'Packaging',applications_ar:'التغليف',search_terms:['cotton'],sources:{private:'NEVER EXPOSE'},faq_en:[{q:'private draft',a:'NEVER EXPOSE'}]}})])).rows[0].id;
 for(const [sku,status]of [['PUBLIC-6','ACTIVE'],['PRIVATE-DRAFT','DRAFT']])await db.query("INSERT INTO product_variants(product_id,sku,name_en,status,material,attributes,cost_price) VALUES($1,$2,'Test variant',$3,'Cotton',$4,1.234)",[parent,sku,status,JSON.stringify({strand_construction:'Braided',internal_note:'NEVER EXPOSE'})]);
});
after(async()=>db.pool.end());
test('grid discovery exposes recorded public specifications without private supplier or variant fields',async()=>{
 const response=await request(app).get('/api/products?limit=60');assert.equal(response.status,200);
 const product=response.body.products.find(p=>p.id===parent);assert.ok(product);
 assert.equal(product.listing_content.specifications[0].en,'6 mm, 8 mm');
 assert.equal(product.listing_content.applications_ar,'التغليف');
 assert.deepEqual(product.discovery.materials,['Cotton']);assert.deepEqual(product.discovery.constructions,['Braided']);assert.deepEqual(product.discovery.skus,['PUBLIC-6']);
 assert.equal(product.custom_fields,undefined);assert.equal(product.listing_content.sources,undefined);assert.equal(product.listing_content.faq_en,undefined);
 assert.ok(!JSON.stringify(product).includes('NEVER EXPOSE'));assert.ok(!JSON.stringify(product).includes('PRIVATE-DRAFT'));assert.ok(!JSON.stringify(product).includes('cost_price'));
});
