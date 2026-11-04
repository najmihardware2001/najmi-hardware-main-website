import fs from 'node:fs';
import {createStorefrontRenderer} from './storefront-renderer.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'frontend/dist'),publicDir=path.join(root,'frontend/public');
const data=JSON.parse(fs.readFileSync(path.join(root,'catalogue/public-catalogue.json'),'utf8'));
const origin='https://najmihardware.com';
const searchPages=JSON.parse(fs.readFileSync(path.join(root,'frontend/src/content/search-pages.json'),'utf8'));
const renderStorefront=await createStorefrontRenderer(data);
const indexable=!process.env.CONTEXT||process.env.CONTEXT==='production';
const pages={
 '/': ['Rope Supplier in Kuwait | Najmi Hardware — Since 2001','مورد حبال في الكويت | نجمي هاردوير منذ 2001','Ropes, cordage and industrial supplies in Shuwaikh, Kuwait. Established in 2001. Explore sizes, lengths and colours, then request a quote from Najmuddin.','الحبال والخيوط والمستلزمات الصناعية في الشويخ، الكويت، منذ 2001. استكشف المقاسات والأطوال والألوان واطلب عرض سعر من نجم الدين.'],
 '/shop':['Ropes, Cords & Ribbons in Kuwait | Najmi Hardware','الحبال والخيوط والشرائط في الكويت | نجمي هاردوير','Browse ropes, cordage, ribbon, bag handles and packaging supplies. Choose specifications and add items to your quotation basket.','تصفح الحبال والخيوط والشرائط ومقابض الأكياس ومستلزمات التعبئة. اختر المواصفات وأضف المنتجات إلى سلة طلب عرض السعر.'],
 '/about':['About Najmi Hardware | Established 2001 in Kuwait','عن نجمي هاردوير | تأسست في الكويت عام 2001','Najmi Hardware has served retail and trade customers in Kuwait since 2001. Our Shuwaikh team helps you specify rope, cordage and associated supplies.','تخدم نجمي هاردوير عملاء التجزئة والتجارة في الكويت منذ عام 2001. يساعدك فريق الشويخ في تحديد مواصفات الحبال والخيوط ومستلزماتها.'],
 '/contact':['Contact Najmi Hardware | Shuwaikh, Kuwait','تواصل مع نجمي هاردوير | الشويخ، الكويت','Contact Najmi Hardware in Shuwaikh, Kuwait. Call Najmuddin on +965 9965 2718 or Yusuf on +965 9746 5572 for product and bulk quotation enquiries.','تواصل مع نجمي هاردوير في الشويخ، الكويت. اتصل بنجم الدين على +965 9965 2718 أو يوسف على +965 9746 5572 لاستفسارات المنتجات وعروض أسعار الجملة.'],
 '/brands/star-rope':['STAR ROPE Cordage in Kuwait | Najmi Hardware','حبال ستار روب في الكويت | نجمي هاردوير','Explore the STAR ROPE cordage range at Najmi Hardware Kuwait. Compare rope construction, recorded diameters and lengths, and ask our team about your requirements.','استكشف مجموعة حبال ستار روب لدى نجمي هاردوير الكويت. قارن بنية الحبل والأقطار والأطوال المسجلة وناقش متطلباتك مع فريقنا.'],
 '/manufacturing':['Rope Materials & Construction | Najmi Hardware Kuwait','خامات الحبال وبنيتها | نجمي هاردوير الكويت','Understand rope materials and construction. Compare recorded specifications in the catalogue and confirm the exact product and intended use with our team.','تعرف على خامات الحبال وبنيتها. قارن المواصفات المسجلة في الكتالوج وأكد المنتج المطلوب والاستخدام المقصود مع فريقنا.'],
 '/industries':['Rope & Cordage Applications | Najmi Hardware Kuwait','استخدامات الحبال والخيوط | نجمي هاردوير الكويت','Find cordage for packaging, decoration, bag handles, workshop and marine enquiries. Exact product suitability is confirmed for each requirement.','ابحث عن الحبال للتعبئة والزينة ومقابض الأكياس والورش والاستفسارات البحرية. تؤكد ملاءمة المنتج لكل متطلب بشكل منفصل.'],
 '/wholesale':['Wholesale Ropes & Supplies in Kuwait | Najmi Hardware','الحبال والمستلزمات بالجملة في الكويت | نجمي هاردوير','Source ropes, twine, ribbons and packaging supplies in bulk. Select the product, dimensions, colour, quantity and selling unit for a tailored quotation.','اطلب الحبال والخيوط والشرائط ومستلزمات التعبئة بالجملة. حدد المنتج والأبعاد واللون والكمية ووحدة البيع للحصول على عرض سعر مناسب.'],
 '/bulk-quote':['Bulk Rope & Hardware Quotes | Najmi Hardware Kuwait','عروض أسعار الحبال والمعدات بالجملة | نجمي هاردوير الكويت','Build a multi-product bulk requirement and send an organized quotation request to Najmuddin on WhatsApp. Prices and availability are confirmed before purchase.','أعد قائمة متطلبات لعدة منتجات وأرسل طلب عرض سعر منظم إلى نجم الدين عبر واتساب. تؤكد الأسعار والتوفر قبل الشراء.'],
 '/find':['Find Rope by Diameter & Length | Najmi Hardware Kuwait','اختيار الحبل حسب القطر والطول | نجمي هاردوير الكويت','Find rope by the dimensions and options recorded in our Kuwait catalogue. Choose diameter, length and colour, then confirm your exact requirements with Najmi Hardware.','اختر الحبل حسب الأبعاد والخيارات المسجلة في كتالوجنا في الكويت. حدد القطر والطول واللون وأكد متطلباتك مع نجمي هاردوير.']
};
for(const c of searchPages.collections)pages['/collections/'+c.slug]=[c.titleEn,c.titleAr,c.introEn,c.introAr];
for(const g of searchPages.guides)pages['/guides/'+g.slug]=[g.en+' | Najmi Hardware Kuwait',g.ar+' | نجمي هاردوير الكويت',g.descriptionEn,g.descriptionAr];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=v=>JSON.stringify(v).replaceAll('<','\\u003c');
const url=(route,ar)=>origin+(ar?'':'/en')+(route==='/'?'/':route);
const routePath=(route,ar)=>(ar?'':'/en')+(route==='/'?'/':route);
const business={'@type':'HardwareStore','@id':origin+'/#business',name:'Najmi Hardware',alternateName:['NAJMI HARDWARE EST.','مؤسسة النجم للمعدات'],url:origin+'/',foundingDate:'2001',email:['sales@najmihardware.com','info@najmihardware.com','yusuf@najmihardware.com'],telephone:'+96599652718',logo:origin+'/favicon.png',image:origin+'/images/branding/najmi-social.jpg',address:{'@type':'PostalAddress',addressLocality:'Shuwaikh',addressCountry:'KW'},areaServed:{'@type':'Country',name:'Kuwait'},sameAs:['https://www.najmihardware.net/','https://share.google/gRD2drGbOUItmFHs6']};
const imageOf=p=>p.primary_image?.url||p.images?.[0]?.url||'/favicon.png';
const builtIndex=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const template=builtIndex.includes('data-prerender="true"')?fs.readFileSync(path.join(dist,'app.html'),'utf8'):builtIndex;
assert.ok(!template.includes('data-prerender="true"'),'Build the frontend before prerendering: the app shell must be empty.');
const scriptTags=(template.match(/<script\b[^>]*src=[^>]+><\/script>/g)||[]).join('\n');
const styles=fs.readdirSync(path.join(dist,'assets')).filter(f=>f.endsWith('.css')).map(f=>'<style data-storefront-css="'+f+'">'+fs.readFileSync(path.join(dist,'assets',f),'utf8').replaceAll('</style','<\\/style')+'</style>').join('\n');
assert.ok(scriptTags.includes('/assets/'),'Vite assets missing');
async function render(route,ar,p){
 const name=p?(ar?p.name_ar:p.name_en):pages[route][ar?1:0];
 const rawTitle=p?((ar?p.seo_title_ar:p.seo_title_en)||name):name;
 const title=/najmi hardware|نجمي/i.test(rawTitle)?rawTitle:rawTitle+(ar?' | نجمي هاردوير الكويت':' | Najmi Hardware Kuwait');
 const description=p?((ar?p.seo_description_ar:p.seo_description_en)||(ar?p.short_description_ar:p.short_description_en)||name):pages[route][ar?3:2];
 const canonical=url(route,ar),image=new URL(p?imageOf(p):'/images/branding/najmi-social.jpg',origin).href;
 const graph=[business,{'@type':'WebSite','@id':origin+'/#website',name:'Najmi Hardware',url:url('/',ar),inLanguage:ar?'ar-KW':'en-KW',publisher:{'@id':origin+'/#business'}}];
 const crumbs=[{'@type':'ListItem',position:1,name:ar?'الرئيسية':'Home',item:url('/',ar)}];if(route!=='/')crumbs.push({'@type':'ListItem',position:2,name:p?(ar?'المنتجات':'Products'):name,item:p?url('/shop',ar):canonical});if(p)crumbs.push({'@type':'ListItem',position:3,name,item:canonical});
 if(crumbs.length>1)graph.push({'@type':'BreadcrumbList',itemListElement:crumbs});
 const category=searchPages.collections.find(c=>route==='/collections/'+c.slug);
 if(category)graph.push({'@type':'CollectionPage',name:ar?category.ar:category.en,url:canonical,mainEntity:{'@type':'ItemList',itemListElement:data.products.filter(p=>category.refs.includes(p.source_id)).map((p,i)=>({'@type':'ListItem',position:i+1,url:url('/product/'+p.id,ar)}))}});
 if(p)graph.push({'@type':'Product','@id':canonical+'#product',name,description:ar?p.short_description_ar:p.short_description_en,productID:p.source_id,image:[image],url:canonical});
 const robots=indexable?'index,follow,max-image-preview:large':'noindex,nofollow';
 const rendered=await renderStorefront(route,ar);
 const imagePreloads=(rendered.html.match(/<link[^>]+rel="preload"[^>]+as="image"[^>]*>/g)||[]).join('');
 const doc=`<!doctype html><html lang="${ar?'ar-KW':'en-KW'}" dir="${ar?'rtl':'ltr'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}">${[['ar-KW',true],['en-KW',false],['x-default',true]].map(([lang,alt])=>`<link rel="alternate" hreflang="${lang}" href="${url(route,alt)}">`).join('')}<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="${p?'product':'website'}"><meta property="og:site_name" content="Najmi Hardware"><meta property="og:locale" content="${ar?'ar_KW':'en_KW'}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#10233d"><script id="seo-prerender-schema" type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script><link rel="preload" as="font" href="/fonts/${ar?'Qw3CZRtWPQCuHme67tEYUIx3Kh0PHR9N6bs6':'xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F'}.woff2" type="font/woff2" crossorigin><link rel="preload" as="font" href="/fonts/${ar?'Qw3NZRtWPQCuHme67tEYUIx3Kh0PHR9N6YOG-dCT':'xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4aE-_F'}.woff2" type="font/woff2" crossorigin>${imagePreloads}${styles}</head><body><div id="root" data-prerender="true">${rendered.html}</div><script id="najmi-initial-catalogue" type="application/json">${rendered.bootstrap}</script>${scriptTags}</body></html>`;
 return doc;
}

function write(route,ar,html){const target=path.join(dist,routePath(route,ar),'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html)}
for(const ar of [true,false]){for(const route of Object.keys(pages))write(route,ar,await render(route,ar));for(const p of data.products)write('/product/'+p.id,ar,await render('/product/'+p.id,ar,p));}
// Explicit app-only routes work on refresh. Unknown URLs return a real HTTP 404.
const appHtml=template.replace('<head>','<head><meta name="robots" content="noindex,follow">');fs.writeFileSync(path.join(dist,'app.html'),appHtml);
fs.writeFileSync(path.join(dist,'404.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Page not found | Najmi Hardware</title><h1>Page not found / الصفحة غير موجودة</h1><p><a href="/">Najmi Hardware</a> · <a href="/en/shop">Browse products</a></p></html>');
// Redirect ordering lives entirely in root netlify.toml. A generated catch-all
// _redirects file would take precedence over its API proxy and break the API.
const altXml=route=>[['ar-KW',true],['en-KW',false],['x-default',true]].map(([lang,ar])=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${url(route,ar)}"/>`).join('');
const namespace='xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
const xml=entries=>'<?xml version="1.0" encoding="UTF-8"?>\n<urlset '+namespace+'>'+entries.join('\n')+'</urlset>\n';
const pageMap=xml(Object.keys(pages).flatMap(route=>[true,false].map(ar=>`<url><loc>${url(route,ar)}</loc>${altXml(route)}</url>`)));
const productMap=xml(data.products.flatMap(p=>[true,false].map(ar=>{const route='/product/'+p.id;const modified=p.updated_at?new Date(p.updated_at).toISOString().slice(0,10):null;const images=[...new Set([imageOf(p),...(p.images||[]).map(m=>m.url||m.webp_url)].filter(Boolean))].slice(0,5);return `<url><loc>${url(route,ar)}</loc>${modified?'<lastmod>'+modified+'</lastmod>':''}${altXml(route)}${images.map(src=>'<image:image><image:loc>'+esc(new URL(src,origin).href)+'</image:loc></image:image>').join('')}</url>`})));
const files={
 'robots.txt':indexable?'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /en/admin\n\nSitemap: '+origin+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n',
 'sitemap.xml':'<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>'+origin+'/sitemap-pages.xml</loc></sitemap><sitemap><loc>'+origin+'/sitemap-products.xml</loc></sitemap></sitemapindex>\n',
 'sitemap-pages.xml':pageMap,'sitemap-products.xml':productMap,
 'site.webmanifest':JSON.stringify({name:'Najmi Hardware Kuwait',short_name:'Najmi Hardware',start_url:'/',display:'browser',background_color:'#f7f7f3',theme_color:'#10233d',icons:[{src:'/images/branding/najmi-icon-512.png',sizes:'512x512',type:'image/png'}]})
};
for(const [name,content]of Object.entries(files)){fs.writeFileSync(path.join(dist,name),content);if(indexable)fs.writeFileSync(path.join(publicDir,name),content);}
let headers=fs.existsSync(path.join(publicDir,'_headers'))?fs.readFileSync(path.join(publicDir,'_headers'),'utf8'):'';
if(!indexable)headers+='\n/*\n  X-Robots-Tag: noindex, nofollow\n';
for(const lang of ['','/en'])for(const route of ['/cart','/checkout','/account','/compare','/rfq-basket','/admin','/admin/*','/quote/*','/order-confirmation/*'])headers+=`\n${lang}${route}\n  X-Robots-Tag: noindex, follow\n  Cache-Control: private, no-store\n`;
fs.writeFileSync(path.join(dist,'_headers'),headers);
fs.writeFileSync(path.join(dist,'seo-build.json'),JSON.stringify({canonicalOrigin:origin,products:data.total,publicPages:Object.keys(pages).length*2+data.products.length*2,indexable,languages:['ar-KW','en-KW'],catalogueExport:data.exported_at}));
console.log(JSON.stringify({products:data.total,prerenderedPages:Object.keys(pages).length*2+data.products.length*2,indexable}));

// Vite SSR may keep worker handles alive after all files are written.
process.exit(0);
