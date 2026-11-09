import { useStorefrontCopy } from '../i18n/useStorefrontCopy';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import { getCartItemCount, getRfqItemCount } from '../store';
import BusinessContacts from '../components/BusinessContacts';
import { BUSINESS_CONTACTS, BUSINESS_EMAILS, generalQuoteUrl, whatsappUrl } from '../services/businessContacts';
import CatalogueSearch from '../components/CatalogueSearch';
import RouteMetadata from '../components/RouteMetadata';
import RouteScrollReset from '../components/RouteScrollReset';
import {responsiveImage} from '../services/responsiveImages';
import searchPages from '../content/search-pages.json';

export default function StorefrontLayout() {
  const copy = useStorefrontCopy();
  const { state } = useStore();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate=useNavigate(),ar=i18n.language==='ar-KW',say=(en:string,arabic:string)=>ar?arabic:en;
  const cartCount = getCartItemCount(state);
  const rfqCount = getRfqItemCount(state);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [canGoBack,setCanGoBack]=useState(false);
  useEffect(()=>setCanGoBack(Number(window.history.state?.idx)>0),[location.key]);

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
      <header className="sticky-header im-header">
       <div className="im-utility"><div className="im-wrap"><span className="im-utility-long">{say('KUWAIT ROPE & CORDAGE SPECIALIST / EST. 2001','متخصصون في الحبال بالكويت / منذ ٢٠٠١')}</span><span className="im-utility-short">{say('Shuwaikh, Kuwait','الشويخ، الكويت')}</span><a href={'tel:'+BUSINESS_CONTACTS.owner.phone}><span className="material-symbols-outlined" aria-hidden="true">call</span><bdi dir="ltr">{BUSINESS_CONTACTS.owner.displayPhone}</bdi></a></div></div>
       <div className="storefront-nav im-header-main im-wrap">
        <div className="storefront-brand-group"><button type="button" aria-label={copy('Open menu')} aria-haspopup="dialog" aria-expanded={mobileMenuOpen} className="im-icon-button im-menu-button" onClick={()=>setMobileMenuOpen(true)}><span className="material-symbols-outlined" aria-hidden="true">menu</span></button><Link to="/" className="storefront-brand"><img {...responsiveImage('/images/branding/najmi-logo.jpg','40px')} alt={say('Najmi Hardware logo','شعار نجمي هاردوير')} width="40" height="40"/><div><span className="im-brand-name">NAJMI</span><small>{copy('HARDWARE')}</small></div></Link></div>
        <CatalogueSearch/>
        <div className="storefront-actions"><button className="im-language-button" type="button" aria-label={ar?'EN — Switch to English':'عربي — التبديل إلى العربية'} onClick={()=>i18n.changeLanguage(ar?'en':'ar-KW')}>{ar?'EN':'عربي'}</button>{[{path:'/rfq-basket',icon:'request_quote',label:copy('Wholesale RFQ Basket'),count:rfqCount},{path:'/cart',icon:'shopping_cart',label:ar?'السلة':'Cart',count:cartCount}].map(item=><Link key={item.path} to={item.path} aria-label={item.label} className="im-icon-button im-basket-link"><span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span><span className="im-basket-count">{item.count}</span></Link>)}<Link className="im-icon-button im-account-link" to="/account" aria-label={copy('Sign In')}><span className="material-symbols-outlined" aria-hidden="true">person</span></Link></div>
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
      <main id="storefront-content" tabIndex={-1} className="storefront-main" style={{ flexGrow: 1, paddingBottom: 80, background: 'var(--surface)' }}>
        {location.pathname!=='/'&&<div className="im-wrap im-route-back">{canGoBack?<button type="button" data-testid="route-back" onClick={()=>navigate(-1)}><span className="material-symbols-outlined im-direction" aria-hidden="true">arrow_back</span>{say('Back','رجوع')}</button>:<Link to={location.pathname==='/shop'?'/':'/shop'}>{location.pathname==='/shop'?say('Home','الرئيسية'):say('Catalogue','الكتالوج')}</Link>}</div>}
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
            <h2 className="text-label-lg" style={{ color: 'var(--pure-white)', marginBottom: 24, fontWeight: 700 }}>{copy("Company")}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/about" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("About Us")}</Link>
              <Link to="/manufacturing" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Manufacturing")}</Link>
              <Link to="/brands/star-rope" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("STAR ROPE")}</Link>
              <Link to="/contact" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Contact")}</Link>
            </div>
          </div>
          <div>
            <h2 className="text-label-lg" style={{ color: 'var(--pure-white)', marginBottom: 24, fontWeight: 700 }}>{copy("Sales")}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/shop" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Retail Shop")}</Link>
              <Link to="/wholesale" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Wholesale Supply")}</Link>
              <Link to="/bulk-quote" style={{ color: 'var(--on-primary-container)', textDecoration: 'none' }}>{copy("Request Quotation")}</Link>
            </div>
          </div>
          <div>
            <h2 className="text-label-lg" style={{ color: 'var(--pure-white)', marginBottom: 24, fontWeight: 700 }}>{copy("Contact")}</h2>
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

      <nav className="im-wrap seo-directory" aria-label={say('Browse product categories','تصفح فئات المنتجات')}><nav>{searchPages.collections.map(c=><Link key={c.slug} to={'/collections/'+c.slug}>{ar?c.ar:c.en}</Link>)}</nav></nav>
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
      <a
        className="im-whatsapp-float"
        href={whatsappUrl(BUSINESS_CONTACTS.owner.phone, ar
          ? 'مرحباً ناظم الدين،\n\nأرغب بالتواصل مع نجمي هاردوير.\n\nشكراً.'
          : 'Hello Nazmuddin,\n\nI would like to contact Najmi Hardware.\n\nThank you.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={say('Contact Nazmuddin on WhatsApp at +965 9965 2718','تواصل مع ناظم الدين عبر واتساب على الرقم +965 9965 2718')}
        title={say('Contact us on WhatsApp','تواصل معنا عبر واتساب')}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16 3.25A12.45 12.45 0 0 0 5.3 22.05L3.7 28.1l6.2-1.62A12.45 12.45 0 1 0 16 3.25Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12.18 10.1c-.28-.62-.58-.63-.85-.64h-.72c-.25 0-.65.1-.99.48-.34.37-1.3 1.27-1.3 3.1 0 1.82 1.33 3.58 1.52 3.82.19.25 2.57 4.11 6.35 5.6 3.14 1.24 3.78 1 4.46.94.68-.06 2.2-.9 2.51-1.77.31-.86.31-1.6.22-1.76-.1-.15-.34-.25-.71-.43-.37-.18-2.2-1.08-2.54-1.2-.34-.13-.59-.19-.83.18-.25.37-.96 1.2-1.17 1.45-.21.25-.43.28-.8.1-.37-.19-1.56-.58-2.98-1.85-1.1-.98-1.85-2.2-2.07-2.57-.21-.37-.02-.57.16-.75.16-.16.37-.43.55-.64.19-.22.25-.37.37-.62.12-.24.06-.46-.03-.64-.09-.19-.82-2.03-1.15-2.78Z" fill="currentColor"/>
        </svg>
        <span className="im-whatsapp-float-label">{say('Contact us','تواصل معنا')}</span>
      </a>
    </div>
  );
}
