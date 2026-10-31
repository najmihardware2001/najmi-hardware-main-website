import { useStorefrontCopy } from '../i18n/useStorefrontCopy';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import { getCartItemCount, getRfqItemCount } from '../store';
import BusinessContacts from '../components/BusinessContacts';
import { BUSINESS_CONTACTS, BUSINESS_EMAILS, generalQuoteUrl } from '../services/businessContacts';
import CatalogueSearch from '../components/CatalogueSearch';
import RouteMetadata from '../components/RouteMetadata';
import RouteScrollReset from '../components/RouteScrollReset';

export default function StorefrontLayout() {
  const copy = useStorefrontCopy();
  const { state } = useStore();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate=useNavigate(),ar=i18n.language==='ar-KW',say=(en:string,arabic:string)=>ar?arabic:en;
  const cartCount = getCartItemCount(state);
  const rfqCount = getRfqItemCount(state);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty('--storefront-top', `${header.getBoundingClientRect().bottom}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  useLayoutEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousFocus=document.activeElement as HTMLElement|null;
    const focusFirst=requestAnimationFrame(()=>document.querySelector<HTMLElement>('.storefront-drawer button')?.focus());
    const close = (event: KeyboardEvent) => {
      if(event.key==='Escape')setMobileMenuOpen(false);
      if(event.key==='Tab'){
        const controls=[...document.querySelectorAll<HTMLElement>('.storefront-drawer :is(a,button,input)')];
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    };
    window.addEventListener('keydown', close);
    return () => { cancelAnimationFrame(focusFirst);document.body.style.overflow = previous; window.removeEventListener('keydown', close);previousFocus?.focus(); };
  }, [mobileMenuOpen]);

  const desktopNavItems = [
    { path: '/shop', label: 'Shop' },
    { path: '/brands/star-rope', label: 'STAR ROPE' },
    { path: '/manufacturing', label: 'Manufacturing' },
    { path: '/industries', label: 'Industries' },
    { path: '/wholesale', label: 'Wholesale' },
    { path: '/bulk-quote', label: ar?'عرض سعر بالجملة':'Bulk Quote' },
    { path: '/find', label: ar?'اختيار الحبل':'Rope Finder' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  const bottomNavItems = [
    { path: '/', icon: 'home', label: 'Home' },
    { path: '/shop', icon: 'category', label: 'Shop' },
    { path: '/cart', icon: 'shopping_cart', label: 'Cart', badge: cartCount },
    { path: '/rfq-basket', icon: 'request_quote', label: 'Quotes', badge: rfqCount },
    { path: '/account', icon: 'person', label: 'Account' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="storefront-shell im-storefront" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <RouteScrollReset /><RouteMetadata />
      <a className="im-skip-link" href="#storefront-content" onClick={event=>{event.preventDefault();document.getElementById('storefront-content')?.focus()}}>{say('Skip to content','انتقل إلى المحتوى')}</a>
      <header ref={headerRef} className="sticky-header im-header">
       <div className="im-utility"><div className="im-wrap"><span className="im-utility-long">{say('KUWAIT ROPE & CORDAGE SPECIALIST / EST. 2001','متخصصون في الحبال بالكويت / منذ ٢٠٠١')}</span><span className="im-utility-short">{say('Shuwaikh, Kuwait','الشويخ، الكويت')}</span><a href={'tel:'+BUSINESS_CONTACTS.owner.phone}><span className="material-symbols-outlined" aria-hidden="true">call</span><bdi dir="ltr">{BUSINESS_CONTACTS.owner.displayPhone}</bdi></a></div></div>
       <div className="storefront-nav im-header-main im-wrap">
        <div className="storefront-brand-group"><button type="button" aria-label={copy('Open menu')} aria-haspopup="dialog" aria-expanded={mobileMenuOpen} className="im-icon-button im-menu-button" onClick={()=>setMobileMenuOpen(true)}><span className="material-symbols-outlined" aria-hidden="true">menu</span></button><Link to="/" className="storefront-brand"><img src="/images/branding/najmi-logo.jpg" alt={say('Najmi Hardware logo','شعار نجمي هاردوير')} width="40" height="40"/><div><span className="im-brand-name">NAJMI</span><small>{copy('HARDWARE')}</small></div></Link></div>
        <CatalogueSearch/>
        <div className="storefront-actions"><button className="im-language-button" type="button" aria-label={ar?'Switch to English':'التبديل إلى العربية'} onClick={()=>i18n.changeLanguage(ar?'en':'ar-KW')}>{ar?'EN':'عربي'}</button>{[{path:'/rfq-basket',icon:'request_quote',label:copy('Wholesale RFQ Basket'),count:rfqCount},{path:'/cart',icon:'shopping_cart',label:ar?'السلة':'Cart',count:cartCount}].map(item=><Link key={item.path} to={item.path} aria-label={item.label} className="im-icon-button im-basket-link"><span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span><span className="im-basket-count">{item.count}</span></Link>)}<Link className="im-icon-button im-account-link" to="/account" aria-label={copy('Sign In')}><span className="material-symbols-outlined" aria-hidden="true">person</span></Link></div>
       </div>
       <div className="im-header-nav-row"><div className="im-wrap"><nav className="storefront-desktop-nav" aria-label={say('Main navigation','القائمة الرئيسية')}>{desktopNavItems.map(item=><Link to={item.path} key={item.path} aria-current={isActive(item.path)?'page':undefined}>{copy(item.label)}</Link>)}</nav><a href={generalQuoteUrl(ar)} target="_blank" rel="noopener noreferrer" className="im-header-quote btn btn-primary">{say('Request a quote','اطلب عرض سعر')}<span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span></a></div></div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="hide-desktop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setMobileMenuOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={copy("Open menu")} className="storefront-drawer" style={{ width: '280px', height: '100%', background: 'var(--surface-bright)', padding: '24px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span className="text-headline-md" style={{ color: 'var(--primary)', fontWeight: 800 }}>{copy("NAJMI")}</span>
              <button aria-label={i18n.language === 'ar-KW' ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {desktopNavItems.map(item => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} style={{
                  textDecoration: 'none', color: 'var(--on-surface)', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  {copy(item.label)}
                  {item.label === 'STAR ROPE' && <span className="badge" style={{ background: 'var(--tertiary)', color: '#fff' }}>{copy("OWN BRAND")}</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="storefront-content" tabIndex={-1} className="storefront-main" style={{ flexGrow: 1, paddingTop: 'var(--storefront-top, 108px)', paddingBottom: 80, background: 'var(--surface)' }}>
        {location.pathname!=='/'&&<div className="im-wrap im-route-back">{Number(window.history.state?.idx)>0?<button type="button" data-testid="route-back" onClick={()=>navigate(-1)}><span className="material-symbols-outlined im-direction" aria-hidden="true">arrow_back</span>{say('Back','رجوع')}</button>:<Link to={location.pathname==='/shop'?'/':'/shop'}>{location.pathname==='/shop'?say('Home','الرئيسية'):say('Catalogue','الكتالوج')}</Link>}</div>}
        <div className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="storefront-footer" style={{
        background: 'var(--primary)',
        color: 'var(--on-primary)',
        padding: '64px var(--margin-mobile) 32px',
        marginTop: 'auto'
      }}>
        <div className="storefront-footer-grid" style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24 }}>
              <span className="text-headline-md" style={{ color: 'var(--secondary)', letterSpacing: '-0.02em', lineHeight: 1, textTransform: 'uppercase', fontWeight: 800 }}>{copy("NAJMI")}</span>
            </div>
            <p className="text-body-sm" style={{ color: 'var(--on-primary-container)', marginBottom: 24 }}> {copy("Kuwait's premier industrial rope manufacturer and supplier. Serving commercial, marine, and retail requirements since 2001.")} </p>
            <p className="text-body-sm" style={{ color: 'var(--on-primary-container)', marginBottom: 8 }}>{state.settings.address}</p>
            <p className="text-body-sm" style={{ color: 'var(--on-primary-container)' }}>{copy("C.R.")} {state.settings.crNumber}</p>
          </div>
          <div>
            <h4 className="text-label-lg" style={{ color: 'var(--pure-white)', marginBottom: 24, fontWeight: 700 }}>{copy("Company")}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/about" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("About Us")}</Link>
              <Link to="/manufacturing" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Manufacturing")}</Link>
              <Link to="/brands/star-rope" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("STAR ROPE")}</Link>
              <Link to="/contact" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Contact")}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-label-lg" style={{ color: 'var(--pure-white)', marginBottom: 24, fontWeight: 700 }}>{copy("Sales")}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/shop" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Retail Shop")}</Link>
              <Link to="/wholesale" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Wholesale Supply")}</Link>
              <Link to="/bulk-quote" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Request Quotation")}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-label-lg" style={{ color: 'var(--pure-white)', marginBottom: 24, fontWeight: 700 }}>{copy("Contact")}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span style={{ color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', gap: 8 }}><span className="material-symbols-outlined icon-sm">call</span> <bdi dir="ltr">{BUSINESS_CONTACTS.owner.displayPhone}</bdi></span>
              <div style={{ color: 'var(--on-primary-container)' }}><BusinessContacts /></div>
              {BUSINESS_EMAILS.map(email => <a key={email} href={'mailto:'+email} style={{ color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><span className="material-symbols-outlined icon-sm" aria-hidden="true">mail</span><bdi dir="ltr">{email}</bdi></a>)}
            </div>
          </div>
        </div>
        <div className="storefront-footer-bottom" style={{ maxWidth: 1440, margin: '64px auto 0', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span className="text-label-sm" style={{ color: 'var(--on-primary-container)' }}>{copy("© 2026 Najmi Hardware. All rights reserved.")}</span>

        </div>
      </footer>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="bottom-nav hide-desktop im-mobile-nav" aria-label={say('Quick navigation','التنقل السريع')}>
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          height: 64, padding: '0 4px', margin: '0 auto'
        }}>
          {bottomNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
              style={{ textDecoration: 'none', position: 'relative' }}
            >
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, marginBottom: 2 }}>{item.icon}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span style={{
                    position: 'absolute', top: -4, right: -10,
                    minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 999, background: item.path === '/cart' ? 'var(--primary)' : 'var(--tertiary)',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-label-sm" style={{ fontSize: 10 }}>{copy(item.label)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
