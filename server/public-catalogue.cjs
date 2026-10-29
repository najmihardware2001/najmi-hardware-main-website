const express=require('express');
function createCatalogueApp(data){
 const app=express();app.disable('x-powered-by');
 // serverless-http 3 supplies a pre-read Buffer on Express 5. Parse it before
 // express.json(), which otherwise treats the completed stream as already read.
 app.use((req,res,next)=>{
  if(!Buffer.isBuffer(req.body))return next();
  if(req.body.length>65536)return res.status(413).json({message:'Request is too large'});
  if(!req.body.length){req.body={};return next()}
  try{req.body=JSON.parse(req.body.toString('utf8'));if(!req.body||typeof req.body!=='object'||Array.isArray(req.body))throw Error();next()}
  catch{return res.status(400).json({message:'JSON object required'})}
 });
 app.use(express.json({limit:'64kb'}));
 app.use('/api',(req,res,next)=>{res.set('X-Robots-Tag','noindex');next()});
 app.get('/api/health',(req,res)=>res.json({ok:true,service:'najmi-public-catalogue',mode:'catalogue',database:'not-configured',products:data.total}));
 app.get('/api/categories',(req,res)=>res.json(data.categories));app.get('/api/brands',(req,res)=>res.json(data.brands));
 app.get('/api/orders/cod-settings',(req,res)=>res.json({enabled:false}));
 app.get(['/api/products','/api/search'],(req,res)=>{
  const q=String(req.query.q||req.query.search||'').toLocaleLowerCase();
  const products=data.products.filter(p=>(!q||[p.name_en,p.name_ar,p.source_id,p.category?.name_en,p.category?.name_ar,p.discovery?.skus?.join(' ')].join(' ').toLocaleLowerCase().includes(q))&&(!req.query.category||p.category?.slug===req.query.category)&&(!req.query.category_id||String(p.category_id)===req.query.category_id)&&(!req.query.brand_id||String(p.brand_id)===req.query.brand_id));
  let offset=Number(req.query.offset||0);if(req.query.cursor)try{offset=Number(Buffer.from(String(req.query.cursor),'base64').toString().split(':')[1])}catch{}
  offset=Number.isFinite(offset)?Math.max(0,offset):0;const limit=Math.max(1,Math.min(100,Number(req.query.limit)||24));
  res.set('Cache-Control','public,max-age=300').json({products:products.slice(offset,offset+limit),total:products.length,next_cursor:offset+limit<products.length?Buffer.from('offset:'+(offset+limit)).toString('base64'):null});
 });
 app.get('/api/products/:id/configuration',(req,res)=>{const c=data.configurations[req.params.id];if(!c)return res.status(404).json({message:'Product not found'});res.json(c)});
 app.get('/api/products/:id/visuals',(req,res)=>{const c=data.visuals[req.params.id];if(!c)return res.status(404).json({message:'Product not found'});res.json(c)});
 app.get('/api/products/:id',(req,res)=>{const p=data.products.find(p=>String(p.id)===req.params.id||p.slug===req.params.id);if(!p)return res.status(404).json({message:'Product not found'});res.json({product:p})});
 app.post('/api/catalogue/resolve',(req,res)=>{
  const config=data.configurations[req.body.parent_id],c=req.body.criteria||{};if(!config)return res.status(404).json({message:'Product not found'});
  const matches=config.specifications.filter(s=>(c.specification_id==null||String(s.id)===String(c.specification_id))&&['size_value','size_unit','length_value','length_unit'].every(k=>c[k]==null||String(c[k])===String(s.measurements[k])));
  const spec=matches.length===1?matches[0]:null,selected=spec?data.spec_configurations[req.body.parent_id]?.[spec.id]:null;
  if(!selected)return res.json({...config,resolution:{state:'INCOMPLETE',matches:0,purchasable:false,blocked_reasons:['SELECT_SPECIFICATION']}});
  let resolution=data.resolutions[req.body.parent_id]?.[spec.id+'|'+(c.unknown_colour?'__unknown':c.color)]||selected.resolution;
  if(c.requested_colour)resolution={state:'PREFERENCE_ENQUIRY',matches:0,purchasable:false,retail_price:null,blocked_reasons:['COLOUR_PREFERENCE_REQUIRES_CONFIRMATION']};
  res.set('Cache-Control','no-store').json({...selected,requested_colour:c.requested_colour||'',resolution:{...resolution,purchasable:false,availability:'CONFIRMATION_REQUIRED'}});
 });
 app.use('/api',(req,res)=>res.status(503).set('Cache-Control','no-store').json({error:{code:'HOSTED_DATABASE_REQUIRED',message:'Online sign-in and stored orders need the hosted database. Please send your requirements to Najmuddin using WhatsApp.'}}));
 app.use((err,req,res,next)=>{if(res.headersSent)return next(err);res.status(err.status||400).json({message:'Invalid request'})});
 return app;
}
module.exports={createCatalogueApp};
