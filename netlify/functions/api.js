const serverless=require('serverless-http');
const {createCatalogueApp}=require('../../server/public-catalogue.cjs');
const handler=serverless(createCatalogueApp(require('../../catalogue/public-catalogue.json')));
exports.handler=(event,context)=>{
 // Netlify may expose the original path or the rewritten function path.
 const route=(event.path||'/').replace(/^\/\.netlify\/functions\/api(?=\/|$)/,'');
 const normalized=route.startsWith('/api/')?route:'/api'+(route.startsWith('/')?route:'/'+route);
 return handler({...event,path:normalized,rawPath:normalized},context);
};
