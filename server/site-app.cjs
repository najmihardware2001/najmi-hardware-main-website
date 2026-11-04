const path=require('node:path'),fs=require('node:fs'),express=require('express');
const {createCatalogueApp}=require('./public-catalogue.cjs');

// Shared HTTP entry point for container hosts and local release verification.
function createSiteApp({dist=path.resolve(__dirname,'../frontend/dist'),data=require('../catalogue/public-catalogue.json'),indexingEnabled=false}={}){
 if(!fs.existsSync(path.join(dist,'index.html'))||!fs.existsSync(path.join(dist,'app.html')))throw Error('Build the storefront before starting the server.');
 const app=express();app.disable('x-powered-by');
 app.use(require('compression')());
 app.use((req,res,next)=>{
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});
  if(!indexingEnabled)res.set('X-Robots-Tag','noindex, nofollow');
  if(req.path==='/robots.txt'&&!indexingEnabled)return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  const route=req.path.replace(/^\/en(?=\/|$)/,'')||'/';
  if(/^\/(cart|checkout|account|compare|rfq-basket|admin|quote|order-confirmation)(\/|$)/.test(route)||route==='/app.html'){
   res.set({'X-Robots-Tag':indexingEnabled?'noindex, follow':'noindex, nofollow','Cache-Control':'private, no-store'});
  }else if(req.query&&Object.keys(req.query).length&&route==='/shop')res.set('X-Robots-Tag','noindex, follow');
  next();
 });
 app.use(createCatalogueApp(data));
 app.get(/.*/,(req,res,next)=>{
  let decoded;try{decoded=decodeURIComponent(req.path);if(decoded.includes('\0'))throw Error()}catch{return res.status(400).type('text').send('Invalid URL')}
  const file=path.resolve(dist,'.'+decoded,'index.html');
  if(file.startsWith(dist+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()){
   res.set('Cache-Control','public, max-age=0, must-revalidate');return res.sendFile(file);
  }
  next();
 });
 app.use(express.static(dist,{redirect:false,dotfiles:'deny',setHeaders(res,file){
  if(file.includes(path.sep+'assets'+path.sep))res.set('Cache-Control','public, max-age=31536000, immutable');
  else if(file.includes(path.sep+'uploads'+path.sep))res.set('Cache-Control','public, max-age=86400');
  else res.set('Cache-Control','public, max-age=0, must-revalidate');
 }}));
 app.get(/.*/,(req,res)=>{
  const route=req.path.replace(/^\/en(?=\/|$)/,'')||'/';
  const appRoute=/^\/(cart|checkout|account|compare|rfq-basket|admin|quote|order-confirmation)(\/|$)/.test(route)||route.startsWith('/shop/');
  if(appRoute)res.set({'X-Robots-Tag':indexingEnabled?'noindex, follow':'noindex, nofollow','Cache-Control':'private, no-store'});
  else res.set('X-Robots-Tag','noindex');
  res.status(appRoute?200:404).sendFile(path.join(dist,appRoute?'app.html':'404.html'));
 });
 return app;
}
module.exports={createSiteApp};
