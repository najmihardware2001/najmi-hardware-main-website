const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {createSiteApp}=require('../server/site-app.cjs');
const data=require('../catalogue/public-catalogue.json');
async function server(t,indexingEnabled){
 const listener=createSiteApp({indexingEnabled}).listen(0,'127.0.0.1');
 await new Promise(resolve=>listener.once('listening',resolve));
 t.after(()=>new Promise(resolve=>{listener.close(resolve);listener.closeAllConnections()}));
 const base='http://127.0.0.1:'+listener.address().port;
 return (route,options)=>fetch(base+route,options);
}
test('container serves both language routes, product content and specification requests',async t=>{
 const request=await server(t,false);
 for(const [route,content] of [['/','نجمي'],['/en/','Najmi Hardware'],['/en/shop','Ropes'],['/en/product/7849','Cotton Braided Rope']]){
  const r=await request(route);assert.equal(r.status,200,route);assert.ok((await r.text()).includes(content));assert.equal(r.headers.get('x-powered-by'),null);
 }
 const health=await (await request('/api/health')).json();assert.equal(health.database,'not-configured');assert.equal(health.products,65);
 const spec=data.configurations[7849].specifications[0];
 const resolved=await request('/api/catalogue/resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({parent_id:7849,criteria:{specification_id:spec.id,...spec.measurements,color:'White'}})});
 assert.equal(resolved.status,200);assert.equal((await resolved.json()).resolution.purchasable,false);
});
test('container previews are excluded from search until explicitly enabled',async t=>{
 const request=await server(t,false);
 assert.equal((await request('/en/product/7849')).headers.get('x-robots-tag'),'noindex, nofollow');
 assert.equal(await (await request('/robots.txt')).text(),'User-agent: *\nDisallow: /\n');
});
test('container production keeps sitemap, media caches, private routes and genuine 404s',async t=>{
 const request=await server(t,true),home=await request('/en/');
 assert.equal(home.headers.get('x-robots-tag'),null);assert.equal(home.status,200);
 const robots=await request('/robots.txt');assert.ok((await robots.text()).includes('Sitemap: https://najmihardware.com/sitemap.xml'));
 const sitemap=await request('/sitemap-products.xml');assert.ok(sitemap.headers.get('content-type').includes('xml'));assert.equal(((await sitemap.text()).match(/<url>/g)||[]).length,116);
 const photo=await request('/uploads/cotton-upright-20261028/ROP-003--black-upright.webp');assert.equal(photo.status,200);assert.ok(photo.headers.get('content-type').includes('image/webp'));assert.equal(photo.headers.get('cache-control'),'public, max-age=86400');
 for(const route of ['/cart','/en/cart','/admin/products','/en/quote/test']){
  const r=await request(route);assert.equal(r.status,200);assert.equal(r.headers.get('x-robots-tag'),'noindex, follow');assert.equal(r.headers.get('cache-control'),'private, no-store');
 }
 assert.equal((await request('/en/shop?q=rope')).headers.get('x-robots-tag'),'noindex, follow');
 for(const route of ['/not-a-real-page','/en/product/999999','/.env','/catalogue/public-catalogue.json','/server/start.cjs'])assert.equal((await request(route)).status,404,route);
 assert.equal((await request('/api/admin/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,503);
});
test('Aiven manifest builds one portable app without provisioning data services',()=>{
 const root=path.resolve(__dirname,'..'),compose=fs.readFileSync(path.join(root,'compose.aiven.yaml'),'utf8'),docker=fs.readFileSync(path.join(root,'Dockerfile'),'utf8');
 assert.ok(compose.includes('dockerfile: Dockerfile'));assert.ok(compose.includes('"8080:8080"'));assert.ok(!compose.includes('depends_on:'));assert.ok(!compose.includes('image: postgres'));
 assert.ok(docker.includes('USER node'));assert.ok(docker.includes('EXPOSE 8080'));assert.ok(docker.includes('CMD ["node", "server/start.cjs"]'));assert.ok(!docker.includes('COPY . .'));
 const ignore=fs.readFileSync(path.join(root,'.dockerignore'),'utf8');assert.ok(ignore.includes('**/.env'));assert.ok(ignore.includes('backend'));
});
