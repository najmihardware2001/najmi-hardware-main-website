const path=require('node:path'),fs=require('node:fs'),express=require('express');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'frontend/dist'),app=express();
app.use(require('../server/public-catalogue.cjs').createCatalogueApp(require('../catalogue/public-catalogue.json')));
app.get(/.*/,(req,res,next)=>{
 const file=path.resolve(dist,'.'+decodeURIComponent(req.path),'index.html');
 if(file.startsWith(dist+path.sep)&&fs.existsSync(file))return res.sendFile(file);
 next();
});
app.use(express.static(dist,{redirect:false}));
app.get(/.*/,(req,res)=>{
 const clean=req.path.replace(/^\/en(?=\/|$)/,'')||'/';
 const appRoute=/^\/(cart|checkout|account|compare|rfq-basket|admin|quote|order-confirmation)(\/|$)/.test(clean)||clean.startsWith('/shop/');
 res.status(appRoute?200:404).sendFile(path.join(dist,appRoute?'app.html':'404.html'));
});
app.listen(Number(process.env.PORT||5180),'0.0.0.0',()=>console.log('Built Netlify catalogue preview: http://localhost:'+(process.env.PORT||5180)));
