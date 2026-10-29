const router=require('express').Router(),db=require('../db'),bcrypt=require('bcryptjs'),auth=require('../middleware/auth'),limit=require('../middleware/rate-limit'),{fail}=require('../services/commerce-quote');
const email=v=>{const e=String(v||'').trim().toLowerCase();if(e.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))fail('Valid email required');return e};
const password=v=>{if(typeof v!=='string'||v.length<12||Buffer.byteLength(v)>72)fail('Password must be at least 12 characters and at most 72 UTF-8 bytes');return v};
const cookie=(res,t)=>res.cookie('ecommerce_customer',t,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.COOKIE_SAME_SITE||'lax',maxAge:7*86400000,path:'/api'});
const signInLimit=limit(10,600000);
// One storefront sign-in form; the server chooses the authenticated account type.
router.post('/auth/sign-in',signInLimit,async(req,res)=>{
 const input=email(req.body.email);
 if(typeof req.body.password!=='string'||Buffer.byteLength(req.body.password)>72)fail('Invalid credentials',401);
 const administrator=(await db.query("SELECT * FROM admin_users WHERE email=$1 AND status='ACTIVE'",[input])).rows[0];
 const customer=administrator?null:(await db.query("SELECT * FROM customers WHERE email=$1 AND status='ACTIVE'",[input])).rows[0];
 const user=administrator||customer,kind=administrator?'admin':'customer';
 const ok=await bcrypt.compare(req.body.password,user?.password_hash||'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxEBdPKblSxeisOlfb3hDnhGYl2');
 if(!user||!ok)fail('Invalid credentials',401);
 const token=auth.issue(user,kind);if(kind==='customer')cookie(res,token);
 res.json({account_type:kind,token,[kind]:{id:user.id,name:user.name,email:user.email,...(kind==='admin'?{role:user.role}:{phone:user.phone})}});
});
router.post('/auth/register',limit(8,600000),async(req,res)=>{const settings=await require('../services/commerce-settings').getSettings('accounts');if(settings.registration_enabled===false)fail('Registration unavailable',403);const name=String(req.body.name||'').trim();if(!name||name.length>150)fail('Name required');const hash=await bcrypt.hash(password(req.body.password),12);const user=(await db.query('INSERT INTO customers(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,phone,token_version',[name,email(req.body.email),hash])).rows[0];const token=auth.issue(user,'customer');cookie(res,token);res.status(201).json({customer:{id:user.id,name:user.name,email:user.email},token});});
for(const kind of ['customer','admin'])router.post(kind==='admin'?'/admin/auth/login':'/auth/login',signInLimit,async(req,res)=>{const input=email(req.body.email);if(typeof req.body.password!=='string'||Buffer.byteLength(req.body.password)>72)fail('Invalid credentials',401);const user=(await db.query(`SELECT * FROM ${kind==='admin'?'admin_users':'customers'} WHERE email=$1 AND status='ACTIVE'`,[input])).rows[0];const ok=await bcrypt.compare(req.body.password,user?.password_hash||'$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxEBdPKblSxeisOlfb3hDnhGYl2');if(!user||!ok)fail('Invalid credentials',401);const token=auth.issue(user,kind);if(kind==='customer')cookie(res,token);res.json({token,[kind]:{id:user.id,name:user.name,email:user.email,...(kind==='admin'?{role:user.role}:{phone:user.phone})}});});
router.get('/admin/auth/me',auth.admin,(req,res)=>res.json({admin:req.admin}));
router.post('/admin/auth/logout',auth.admin,async(req,res)=>{await db.query('UPDATE admin_users SET token_version=token_version+1 WHERE id=$1',[req.admin.id]);res.json({success:true});});
router.post('/auth/logout',auth.customer,async(req,res)=>{await db.query('UPDATE customers SET token_version=token_version+1 WHERE id=$1',[req.customer.id]);res.clearCookie('ecommerce_customer',{path:'/api',secure:process.env.NODE_ENV==='production',sameSite:process.env.COOKIE_SAME_SITE||'lax'});res.json({success:true});});
module.exports={router,email,password};
