import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
const items=[
 {path:'/admin',icon:'dashboard',label:'Dashboard',exact:true},
 {path:'/admin/products',icon:'inventory_2',label:'Products'},
 {path:'/admin/orders',icon:'receipt_long',label:'Retail Orders'},
 {path:'/admin/rfqs',icon:'request_quote',label:'Wholesale RFQs'},
 {path:'/admin/inventory',icon:'warehouse',label:'Inventory'},
 {path:'/admin/customers',icon:'people',label:'Customers'},
 {path:'/admin/banners',icon:'view_carousel',label:'Banners'},
 {path:'/admin/categories',icon:'category',label:'Categories'},
 {path:'/admin/settings',icon:'settings',label:'Settings'},
];
export default function AdminShell(){
 const {user,loading,logout}=useAuth(),location=useLocation();
 const [open,setOpen]=useState(false);
 useEffect(()=>setOpen(false),[location.pathname]);
 if(loading)return <main className="admin-login" dir="ltr"><p role="status">Checking your admin session…</p></main>;
 if(!user)return <Navigate to="/account" replace/>;
 return <div className="admin-shell" dir="ltr" lang="en">
  <aside className={`admin-sidebar ${open?'open':''}`} aria-label="Admin navigation">
   <div className="admin-sidebar-brand"><span className="material-symbols-outlined" aria-hidden="true">admin_panel_settings</span><div><strong>NAJMI Console</strong><small>Merchant administration</small></div><button type="button" className="admin-sidebar-close" aria-label="Close navigation" onClick={()=>setOpen(false)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></div>
   <nav>{items.map(i=><Link key={i.path} to={i.path} className={`admin-sidebar-item ${(i.exact?location.pathname===i.path:location.pathname.startsWith(i.path))?'active':''}`}><span className="material-symbols-outlined" aria-hidden="true">{i.icon}</span><span>{i.label}</span></Link>)}</nav>
   <Link to="/" className="admin-sidebar-item admin-store-link"><span className="material-symbols-outlined" aria-hidden="true">storefront</span>View Storefront</Link>
  </aside>
  {open&&<button type="button" className="admin-nav-overlay" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
  <div className="admin-content">
   <header className="admin-topbar"><button type="button" className="admin-menu-toggle" aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)}><span className="material-symbols-outlined" aria-hidden="true">menu</span></button><strong className="admin-console-title">NAJMI Merchant Console</strong><div className="admin-account"><span title={user.email}>{user.fullName}<small>{user.role.replaceAll('_',' ')}</small></span><button type="button" title="Sign Out" aria-label="Sign Out" onClick={()=>logout()}><span className="material-symbols-outlined" aria-hidden="true">logout</span><span className="admin-signout-label">Sign Out</span></button></div></header>
   <main className="admin-page"><Outlet/></main>
  </div>
 </div>;
}
