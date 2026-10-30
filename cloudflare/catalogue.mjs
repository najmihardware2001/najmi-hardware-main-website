// Public, immutable catalogue only. No Node server, credentials or private DB.
export function createCatalogueHandler(data){
 const byId=new Map(data.products.map(p=>[String(p.id),p]));
 const bySlug=new Map(data.products.map(p=>[p.slug,p]));
 const own=(object,key)=>Object.hasOwn(object,String(key))?object[String(key)]:undefined;
 return function catalogueReply(path,params,method='GET',body={}){
  const reply=(json,status=200,cache='no-store')=>({json,status,headers:{'Cache-Control':cache,'X-Robots-Tag':'noindex'}});
  if(method==='GET'){
   if(path==='/api/health')return reply({ok:true,service:'najmi-public-catalogue',mode:'catalogue',database:'not-configured',products:data.total});
   if(path==='/api/categories')return reply(data.categories);
   if(path==='/api/brands')return reply(data.brands);
   if(path==='/api/orders/cod-settings')return reply({enabled:false});
   if(path==='/api/products'||path==='/api/search'){
    const q=(params.get('q')||params.get('search')||'').toLocaleLowerCase(),category=params.get('category'),categoryId=params.get('category_id'),brandId=params.get('brand_id');
    const products=data.products.filter(p=>(!q||[p.name_en,p.name_ar,p.source_id,p.category?.name_en,p.category?.name_ar,p.discovery?.skus?.join(' ')].join(' ').toLocaleLowerCase().includes(q))&&(!category||p.category?.slug===category)&&(!categoryId||String(p.category_id)===categoryId)&&(!brandId||String(p.brand_id)===brandId));
    let offset=Number(params.get('offset')||0);if(params.get('cursor'))try{offset=Number(atob(params.get('cursor')).split(':')[1])}catch{}
    offset=Number.isFinite(offset)?Math.max(0,offset):0;const limit=Math.max(1,Math.min(100,Number(params.get('limit'))||24));
    return reply({products:products.slice(offset,offset+limit),total:products.length,next_cursor:offset+limit<products.length?btoa('offset:'+(offset+limit)):null},200,'public,max-age=300');
   }
   const config=path.match(/^\/api\/products\/(\d+)\/configuration$/);if(config){const value=own(data.configurations,config[1]);return value?reply(value):reply({message:'Product not found'},404)}
   const visuals=path.match(/^\/api\/products\/(\d+)\/visuals$/);if(visuals){const value=own(data.visuals,visuals[1]);return value?reply(value):reply({message:'Product not found'},404)}
   const product=path.match(/^\/api\/products\/([^/]+)$/);if(product){let id;try{id=decodeURIComponent(product[1])}catch{return reply({message:'Invalid product URL'},400)}const p=byId.get(id)||bySlug.get(id);return p?reply({product:p}):reply({message:'Product not found'},404)}
  }
  if(method==='POST'&&path==='/api/catalogue/resolve'){
   const config=own(data.configurations,body.parent_id),c=body.criteria||{};if(!config)return reply({message:'Product not found'},404);
   const matches=config.specifications.filter(s=>(c.specification_id==null||String(s.id)===String(c.specification_id))&&['size_value','size_unit','length_value','length_unit'].every(k=>c[k]==null||String(c[k])===String(s.measurements[k])));
   const spec=matches.length===1?matches[0]:null,selected=spec?data.spec_configurations[body.parent_id]?.[spec.id]:null;
   if(!selected)return reply({...config,resolution:{state:'INCOMPLETE',matches:0,purchasable:false,blocked_reasons:['SELECT_SPECIFICATION']}});
   let resolution=data.resolutions[body.parent_id]?.[spec.id+'|'+(c.unknown_colour?'__unknown':c.color)]||selected.resolution;
   if(c.requested_colour)resolution={state:'PREFERENCE_ENQUIRY',matches:0,purchasable:false,retail_price:null,blocked_reasons:['COLOUR_PREFERENCE_REQUIRES_CONFIRMATION']};
   return reply({...selected,requested_colour:c.requested_colour||'',resolution:{...resolution,purchasable:false,availability:'CONFIRMATION_REQUIRED'}});
  }
  return reply({error:{code:'HOSTED_DATABASE_REQUIRED',message:'Online sign-in and stored orders need the hosted database. Please send your requirements to Najmuddin using WhatsApp.'}},503);
 };
}
