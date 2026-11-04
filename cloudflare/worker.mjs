import data from '../catalogue/public-catalogue.json' with {type:'json'};
import {createCatalogueHandler} from './catalogue.mjs';
import searchPages from '../frontend/src/content/search-pages.json' with {type:'json'};
const catalogue=createCatalogueHandler(data);
const publicPages=new Set(['/','/shop','/about','/contact','/brands/star-rope','/manufacturing','/industries','/wholesale','/bulk-quote','/find',...data.products.map(p=>'/product/'+p.id),...searchPages.collections.map(c=>'/collections/'+c.slug),...searchPages.guides.map(g=>'/guides/'+g.slug)]);
const appPage=path=>/^\/(cart|checkout|account|compare|rfq-basket|admin|quote|order-confirmation)(\/|$)/.test(path)||path.startsWith('/shop/');
async function jsonBody(request){
 if(Number(request.headers.get('content-length')||0)>65536)throw Object.assign(Error('Request is too large'),{status:413});
 const reader=request.body?.getReader();let bytes=0,chunks=[];
 if(reader){while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>65536){await reader.cancel();throw Object.assign(Error('Request is too large'),{status:413})}chunks.push(value)}}
 const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length}
 let body;try{body=JSON.parse(new TextDecoder().decode(buffer)||'{}')}catch{throw Object.assign(Error('JSON object required'),{status:400})}
 if(!body||typeof body!=='object'||Array.isArray(body))throw Object.assign(Error('JSON object required'),{status:400});
 return body;
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),production=['najmihardware.com','www.najmihardware.com'].includes(url.hostname)&&env.INDEXING_ENABLED==='true';
  const secure=response=>{
   const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
   if(!production)headers.set('X-Robots-Tag','noindex, nofollow');
   return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
  };
  try{
   if(url.hostname==='najmihardware.com'&&url.protocol==='http:'){url.protocol='https:';return secure(Response.redirect(url.href,301))}
   if(url.hostname==='www.najmihardware.com'){url.hostname='najmihardware.com';url.protocol='https:';return secure(Response.redirect(url.href,301))}
   if(url.pathname==='/api'||url.pathname.startsWith('/api/')){
    const body=request.method==='POST'?await jsonBody(request):{};
    const result=catalogue(url.pathname,url.searchParams,request.method==='HEAD'?'GET':request.method,body);
    return secure(Response.json(result.json,{status:result.status,headers:result.headers}));
   }
   if(url.pathname==='/robots.txt'&&!production)return secure(new Response('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}}));
   const english=/^\/en(?:\/|$)/.test(url.pathname),prefix=english?'/en':'';
   let path=url.pathname.slice(prefix.length)||'/';if(path!=='/')path=path.replace(/\/$/,'');
   const known=publicPages.has(path),interactive=appPage(path);
   if(request.method==='GET'||request.method==='HEAD'){
    if(known){
     const canonicalPath=prefix+(path==='/'?'/':path);
     if(url.pathname!==canonicalPath){url.pathname=canonicalPath;return secure(Response.redirect(url.href,301))}
     const target=new URL(url);target.pathname=prefix+(path==='/'?'':path)+'/index.html';
     const response=await env.ASSETS.fetch(new Request(target,{method:request.method,headers:request.headers}));
     const headers=new Headers(response.headers);headers.set('Cache-Control','public, max-age=0, must-revalidate');
     if((path==='/shop'||path.startsWith('/collections/'))&&url.search)headers.set('X-Robots-Tag','noindex, follow');
     return secure(new Response(response.body,{status:response.status,headers}));
    }
    if(interactive){
     const target=new URL(url);target.pathname='/app.html';
     const response=await env.ASSETS.fetch(new Request(target,{method:request.method,headers:request.headers}));
     const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Robots-Tag','noindex, follow');
     return secure(new Response(response.body,{status:response.status,headers}));
    }
   }
   const response=await env.ASSETS.fetch(request);
   if(response.status===404){const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex');return secure(new Response(response.body,{status:404,headers}))}
   return secure(response);
  }catch(error){return secure(Response.json({message:error.status?error.message:'Request could not be completed'},{status:error.status||500,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}}))}
 }
};
