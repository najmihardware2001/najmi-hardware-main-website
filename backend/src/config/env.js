const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),envFile=path.join(root,'.env');
// Never search upward for another project's .env file.
if(process.env.NODE_ENV!=='test'&&fs.existsSync(envFile))require('dotenv').config({path:envFile,override:true,quiet:true});
function validate({databaseOnly=false}={}){
 if(process.env.ECOMMERCE_CONFIG_ACK!=='true')throw Error('Set ECOMMERCE_CONFIG_ACK=true after configuring this standalone project.');
 const url=process.env.DATABASE_URL||'';if(!url)throw Error('DATABASE_URL is required.');
 if(url.startsWith('pglite:')){if(process.env.NODE_ENV==='production')throw Error('Embedded test database cannot run in production.');}
 else{const u=new URL(url);if(!['postgres:','postgresql:'].includes(u.protocol))throw Error('Use a PostgreSQL database URL.');}
 const decimals=Number(process.env.CURRENCY_DECIMALS??3);if(!Number.isInteger(decimals)||decimals<0||decimals>3)throw Error('CURRENCY_DECIMALS must be 0–3.');
 if(!/^[A-Z]{3}$/.test(process.env.STORE_CURRENCY||'KWD'))throw Error('STORE_CURRENCY must be a three-letter code.');
 if(databaseOnly)return;
 const origins=String(process.env.ALLOWED_ORIGINS||process.env.FRONTEND_URL||'').split(',').filter(Boolean);for(const origin of origins){const u=new URL(origin.trim());if(!['http:','https:'].includes(u.protocol)||u.origin!==origin.trim()||u.username||u.password)throw Error('Use exact frontend origins without paths or wildcards.');}if(process.env.NODE_ENV==='production'&&!origins.length)throw Error('Production requires configured frontend origins.');
 if(!['cloudinary','mock','local'].includes(process.env.MEDIA_PROVIDER||'cloudinary'))throw Error('Media adapter is not installed.');if(process.env.NODE_ENV==='production'&&process.env.MEDIA_PROVIDER==='mock')throw Error('Mock media cannot run in production.');
 if(!/^[a-zA-Z0-9_-]{1,30}$/.test(process.env.ORDER_PREFIX||'ORD-'))throw Error('Invalid order prefix');if(!Number.isInteger(Number(process.env.ORDER_DIGITS||6))||Number(process.env.ORDER_DIGITS||6)<1||Number(process.env.ORDER_DIGITS||6)>12)throw Error('ORDER_DIGITS must be 1–12');
 for(const key of ['FREE_DELIVERY_THRESHOLD','DELIVERY_FEE'])if(!Number.isFinite(Number(process.env[key]||0))||Number(process.env[key]||0)<0)throw Error('Delivery configuration must be nonnegative.');
 if(process.env.COOKIE_SAME_SITE==='none'&&process.env.NODE_ENV!=='production')throw Error('SameSite none requires production HTTPS cookies.');

 for(const key of ['ADMIN_JWT_SECRET','CUSTOMER_JWT_SECRET','ORDER_TRACKING_SECRET'])if((process.env[key]||'').length<32)throw Error(key+' must contain at least 32 random characters.');
 if(process.env.ADMIN_JWT_SECRET===process.env.CUSTOMER_JWT_SECRET)throw Error('Admin and customer secrets must differ.');
 if(!['mock','myfatoorah'].includes(process.env.PAYMENT_PROVIDER||'mock'))throw Error('Payment adapter is not installed.');
 if(process.env.PAYMENT_PROVIDER==='mock'&&process.env.NODE_ENV==='production')throw Error('Mock payments are for development/test only.');
 if(process.env.PAYMENT_PROVIDER==='myfatoorah'&&(!process.env.MYFATOORAH_API_KEY||!process.env.MYFATOORAH_WEBHOOK_SECRET))throw Error('Configure provider API and webhook credentials.');
 if(process.env.NODE_ENV==='test'&&process.env.PAYMENT_PROVIDER!=='mock')throw Error('Tests require MockPaymentProvider.');
}
module.exports={root,validate};
