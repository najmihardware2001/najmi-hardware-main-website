const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'frontend/dist'),data=require('../catalogue/public-catalogue.json');
test('complete catalogue, corrected photos and media are included',()=>{
 assert.equal(data.products.length,58);assert.equal(Object.values(data.configurations).reduce((n,c)=>n+c.specifications.length,0),398);
 const media=new Set();function scan(v){if(typeof v==='string'&&v.startsWith('/uploads/'))media.add(v);else if(Array.isArray(v))v.forEach(scan);else if(v&&typeof v==='object')Object.values(v).forEach(scan)}scan(data);
 for(const url of media)assert.ok(fs.existsSync(path.join(dist,url)),url);
 const photos=JSON.stringify(data.configurations[7849]);assert.ok(photos.includes('black-upright'));assert.ok(photos.includes('white-upright'));
 assert.ok(!data.products.some(p=>Number(p.id)===7847),'Removed polypropylene rope must stay removed');
});
test('all product HTML has unique metadata, product content, reciprocal languages and valid JSON-LD',()=>{
 const titles=new Set();
 for(const p of data.products)for(const base of ['','en']){
  const html=fs.readFileSync(path.join(dist,base,'product',String(p.id),'index.html'),'utf8');
  assert.ok(/<h1[\s>]/.test(html));assert.ok(html.includes(base?p.name_en:p.name_ar));
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title),'Duplicate title '+title);titles.add(title);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.ok(html.includes('https://najmihardware.com/'+(base?'en/':'')+'product/'+p.id));
  assert.ok(html.includes('hreflang="ar-KW"'));assert.ok(html.includes('hreflang="en-KW"'));
  const schema=JSON.parse(html.match(/<script id="seo-prerender-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const page=schema['@graph'].find(n=>n['@type']==='WebPage');assert.equal(page.name,base?p.name_en:p.name_ar);assert.equal(page.identifier,p.source_id);
  // Check every JSON-LD block, including React's A+ content, not only the head.
  for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)){
   const block=JSON.parse(match[1]),nodes=block['@graph']||[block];
   assert.ok(!nodes.some(n=>[].concat(n['@type']||[]).some(t=>['Product','ProductGroup','Offer','AggregateOffer','Review','AggregateRating'].includes(t))),'Quote-only page must not claim product rich-result eligibility');
  }
  assert.ok(schema['@graph'].some(n=>n['@type']==='BreadcrumbList'));
 }
});
test('sitemaps cover every language and product and exclude private routes',()=>{
 const pages=fs.readFileSync(path.join(dist,'sitemap-pages.xml'),'utf8'),products=fs.readFileSync(path.join(dist,'sitemap-products.xml'),'utf8');
 assert.equal((pages.match(/<url>/g)||[]).length,42);assert.equal((products.match(/<url>/g)||[]).length,116);
 for(const p of data.products)for(const prefix of ['','en/'])assert.ok(products.includes('<loc>https://najmihardware.com/'+prefix+'product/'+p.id+'</loc>'));
 assert.ok(!/\/(cart|admin|account|checkout|rfq-basket|quote|compare)[/<]/.test(pages+products));
 assert.ok(!products.includes('localhost'));assert.ok(!products.includes('#/'));assert.ok(fs.readFileSync(path.join(dist,'robots.txt'),'utf8').includes('Sitemap: https://najmihardware.com/sitemap.xml'));
});
test('private routes and real 404 fallback are configured',()=>{
 const redirects=fs.readFileSync(path.join(root,'netlify.toml'),'utf8');assert.ok(redirects.includes('to = "/404.html"'));assert.ok(redirects.includes('from = "/en/cart"'));assert.ok(redirects.indexOf('from = "/api/*"')<redirects.indexOf('to = "/404.html"'));
 assert.ok(fs.readFileSync(path.join(dist,'app.html'),'utf8').includes('noindex'));
 const home=fs.readFileSync(path.join(dist,'index.html'),'utf8');assert.ok(home.includes('2001'));assert.ok(!home.includes('1980'));
});
test('initial HTML contains completed storefronts rather than streamed loading placeholders',()=>{
 const pages=['','en','shop','en/shop','collections/ropes-kuwait','en/collections/ribbons-kuwait','en/product/7882'];
 for(const page of pages){const html=fs.readFileSync(path.join(dist,page,'index.html'),'utf8');assert.ok(html.includes('data-prerender="true"'),page);assert.ok(!html.includes('<!--$?-->'),page+' pending Suspense');assert.ok(!html.includes('<!--$!-->'),page+' fallback');assert.ok(!html.includes('hidden id="S:'),page+' hidden streamed content');}
});
test('function serves catalogue paths and explicitly gates stored orders and login',async()=>{
 const {handler}=require('../netlify/functions/api.js');
 const request=async(route,method='GET',body)=>handler({httpMethod:method,path:route,headers:{'content-type':'application/json'},queryStringParameters:null,body:body?JSON.stringify(body):null,isBase64Encoded:false},{});
 for(const route of ['/api/health','/.netlify/functions/api/health']){const res=await request(route);assert.equal(res.statusCode,200);assert.equal(JSON.parse(res.body).database,'not-configured')}
 const p=await request('/api/products/7849');assert.equal(p.statusCode,200);assert.equal(JSON.parse(p.body).product.id,7849);
 assert.equal((await request('/api/products/999999')).statusCode,404);
 assert.equal((await request('/api/admin/auth/login','POST',{email:'nobody@example.invalid',password:'not-a-credential'})).statusCode,503);
 assert.equal((await request('/api/checkout','POST',{})).statusCode,503);
 const c=data.configurations[7849],spec=c.specifications[0];
 const resolution=await request('/api/catalogue/resolve','POST',{parent_id:7849,criteria:{specification_id:spec.id,...spec.measurements,requested_colour:'Black'}});
 assert.equal(resolution.statusCode,200);assert.equal(JSON.parse(resolution.body).resolution.purchasable,false);
});
test('official source includes no synthetic customer/order seeds or environment files',()=>{
 const store=fs.readFileSync(path.join(root,'frontend/src/store.ts'),'utf8');for(const name of ['DEFAULT_CUSTOMERS','DEFAULT_ORDERS','DEFAULT_RFQS'])assert.ok(new RegExp('const '+name+': [A-Za-z]+\\[\\] = \\[\\];').test(store));
 for(const folder of [root,path.join(root,'backend'),path.join(root,'frontend')])assert.ok(!fs.existsSync(path.join(folder,'.env')));
 assert.ok(!/"(?:cost_price|password_hash|source_client_sales_price)"/.test(JSON.stringify(data)));
});
