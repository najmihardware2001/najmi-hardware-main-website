const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=require('../catalogue/public-catalogue.json'),dist=path.resolve(__dirname,'../frontend/dist');
async function worker(){return (await import('../cloudflare/worker.mjs')).default}
function assets(){return {async fetch(request){const pathname=new URL(request.url).pathname,filename=path.resolve(dist,'.'+decodeURIComponent(pathname));
 if(!filename.startsWith(dist+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile())return new Response('Not found',{status:404});
 const type=filename.endsWith('.html')?'text/html; charset=utf-8':filename.endsWith('.xml')?'application/xml':'text/plain';
 return new Response(request.method==='HEAD'?null:fs.readFileSync(filename),{headers:{'Content-Type':type}});
}}}
async function request(route,{host='najmihardware.com',method='GET',body,indexing='true'}={}){
 const r=new Request('https://'+host+route,{method,...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body),headers:{'content-type':'application/json'}})});
 return (await worker()).fetch(r,{ASSETS:assets(),INDEXING_ENABLED:indexing});
}
test('Cloudflare Worker serves the public catalogue API and preserves every product',async()=>{
 const health=await request('/api/health');assert.equal(health.status,200);assert.equal((await health.json()).products,58);
 for(const p of data.products){const response=await request('/api/products/'+p.id);assert.equal(response.status,200);assert.deepEqual((await response.json()).product,p)}
 const first=await (await request('/api/products?limit=24')).json();assert.equal(first.products.length,24);assert.equal(first.total,58);
 const second=await (await request('/api/products?limit=24&cursor='+encodeURIComponent(first.next_cursor))).json();assert.equal(second.products[0].id,data.products[24].id);
});
test('Cloudflare Worker resolves actual size/length/colour options and gates private writes',async()=>{
 for(const id of ['7849','7882','7895']){
  const config=data.configurations[id],spec=config.specifications[0];
  const response=await request('/api/catalogue/resolve',{method:'POST',body:{parent_id:id,criteria:{specification_id:spec.id,...spec.measurements,requested_colour:'Black'}}});
  assert.equal(response.status,200);const value=await response.json();assert.equal(value.resolution.purchasable,false);assert.equal(value.requested_colour,'Black');
 }
 assert.equal((await request('/api/admin/auth/login',{method:'POST',body:{}})).status,503);
 assert.equal((await request('/api/checkout',{method:'POST',body:{}})).status,503);
 assert.equal((await request('/api/catalogue/resolve',{method:'POST',body:'not JSON'})).status,400);
 assert.equal((await request('/api/catalogue/resolve',{method:'POST',body:{parent_id:'__proto__'}})).status,404);
 assert.equal((await request('/api/catalogue/resolve',{method:'POST',body:JSON.stringify({x:'a'.repeat(66000)})})).status,413);
});
test('Cloudflare Worker serves initial English/Arabic SEO HTML and refreshable cart routes',async()=>{
 for(const route of ['/','/en/','/shop','/en/shop','/product/7849','/en/product/7849']){
  const response=await request(route);assert.equal(response.status,200,route);const html=await response.text();assert.ok(html.includes('najmihardware.com'));assert.ok(html.includes('rel="canonical"'));assert.ok(/<h1[\s>]/.test(html));assert.equal(response.headers.get('x-robots-tag'),null);
 }
 const head=await request('/en/product/7849',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const route of ['/cart','/en/cart','/rfq-basket','/en/admin/products']){const r=await request(route);assert.equal(r.status,200);assert.equal(r.headers.get('x-robots-tag'),'noindex, follow');assert.ok((await r.text()).includes('noindex'))}
 assert.equal((await request('/made-up-page')).status,404);assert.equal((await request('/en/product/999999')).status,404);
});
test('Cloudflare Worker avoids hostname duplication and keeps temporary URLs out of Google',async()=>{
 const http=await (await worker()).fetch(new Request('http://najmihardware.com/en/shop?q=rope'),{ASSETS:assets(),INDEXING_ENABLED:'true'});assert.equal(http.status,301);assert.equal(http.headers.get('location'),'https://najmihardware.com/en/shop?q=rope');
 const redirect=await request('/en/product/7849?q=a',{host:'www.najmihardware.com'});assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),'https://najmihardware.com/en/product/7849?q=a');
 const slash=await request('/en');assert.equal(slash.status,301);assert.equal(slash.headers.get('location'),'https://najmihardware.com/en/');
 const preview=await request('/en/shop',{host:'najmi-hardware-main-website.najmihardware2001.workers.dev'});assert.equal(preview.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.equal(await (await request('/robots.txt',{host:'najmi-hardware-main-website.najmihardware2001.workers.dev'})).text(),'User-agent: *\nDisallow: /\n');
 assert.ok((await (await request('/robots.txt')).text()).includes('https://najmihardware.com/sitemap.xml'));
 assert.equal((await request('/shop?q=rope')).headers.get('x-robots-tag'),'noindex, follow');
});
