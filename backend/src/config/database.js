require('./env');
let pool;
if((process.env.DATABASE_URL||'').startsWith('pglite:')){
 if(process.env.NODE_ENV==='production')throw Error('Embedded test databases are forbidden in production.');
 const {PGlite}=require('@electric-sql/pglite'),path=require('node:path');const location=process.env.DATABASE_URL.slice(7);const pg=new PGlite(location==='memory'?undefined:path.resolve(location));
 let tail=Promise.resolve();async function lock(){let release;const next=new Promise(r=>release=r),prior=tail;tail=next;await prior;return release;}
 const raw=async(sql,params)=>{if(/pg_advisory/.test(sql))return {rows:[],rowCount:0};const r=await pg.query(sql,params);return {...r,rowCount:r.affectedRows??r.rows.length};};
 pool={query:async(sql,params)=>{const release=await lock();try{return await raw(sql,params)}finally{release()}},connect:async()=>{const release=await lock();return {query:raw,exec:sql=>pg.exec(sql),release}},end:()=>pg.close(),exec:sql=>pg.exec(sql)};
}else{
 pool=new(require('pg').Pool)({connectionString:process.env.DATABASE_URL,max:10,application_name:'reusable-ecommerce-backend',...(process.env.DATABASE_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
}
module.exports={pool,query:(sql,params)=>pool.query(sql,params)};
