const {createSiteApp}=require('./site-app.cjs');
const port=Number(process.env.PORT||8080),host=process.env.HOST||'0.0.0.0';
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be between 1 and 65535');
const app=createSiteApp({indexingEnabled:process.env.INDEXING_ENABLED==='true'});
const server=app.listen(port,host,()=>console.log('Najmi website listening on port '+port+' (catalogue/WhatsApp mode)'));
server.on('error',()=>{console.error('Website could not start on the configured address.');process.exitCode=1});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{
 const deadline=setTimeout(()=>process.exit(1),10000);deadline.unref();
 server.close(()=>{clearTimeout(deadline);process.exit(0)});
 server.closeIdleConnections?.();
});
