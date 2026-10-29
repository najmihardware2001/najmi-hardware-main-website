import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useStore } from '../../StoreContext';
import LocationMap from '../../components/LocationMap';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BusinessContacts from '../../components/BusinessContacts';

export default function ContactPage() {
  const copy = useStorefrontCopy();
  const { state } = useStore();
  const [params] = useSearchParams();
  const product = params.get('product');
  const { i18n } = useTranslation();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <section style={{ padding: '60px var(--margin-mobile)', background: 'var(--primary)', color: '#fff', textAlign: 'center' }}>
        <h1 className="text-display-lg-mobile" style={{ fontWeight: 800 }}>{copy("Contact Us")}</h1>
        <p className="text-body-lg" style={{ color: 'var(--on-primary-container)', marginTop: 8, maxWidth: 600, margin: '8px auto 0' }}> {copy("Get in touch with Kuwait's premier rope and cordage specialists.")} </p>
      </section>

      {/* Main Content */}
      <section style={{ padding: '60px var(--margin-mobile)', background: 'var(--surface)' }}>
        <div className="container-app" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0b3d91', marginBottom: 24 }}>{copy("How can we help?")}</h2>
          {product && <p data-testid="enquiry-product" style={{ padding: 20, background: '#fff', borderRadius: 8 }}>
            {i18n.language === 'ar-KW' ? 'طلب عرض سعر: ' : 'Quotation enquiry: '}{product}
          </p>}
          <p style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)', marginBottom: 40 }}> {copy("Whether you have a technical question, need a bulk quotation, or want to learn more about our manufacturing capabilities, our dedicated sales team is here to assist you.")} </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', marginBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', padding: '16px 32px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: 400 }}>
              <span className="material-symbols-outlined" style={{ color: '#e31837', fontSize: 32 }}>call</span>
              <div style={{ textAlign: 'start', minWidth: 0, overflowWrap: 'anywhere' }}>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>{copy("Call Us")}</p>
                <a dir="ltr" href={`tel:${state.settings.phone.replace(/\s+/g, '')}`} style={{ color: '#0b3d91', textDecoration: 'none', fontWeight: 600 }}>{state.settings.phone}</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', padding: '16px 32px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: 400 }}>
              <span className="material-symbols-outlined" style={{ color: '#e31837', fontSize: 32 }}>mail</span>
              <div style={{ textAlign: 'start', minWidth: 0, overflowWrap: 'anywhere' }}>
                <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>{copy("Email Us")}</p>
                <a dir="ltr" href={`mailto:${state.settings.email}${product ? `?subject=${encodeURIComponent('Quotation enquiry: '+product)}` : ''}`} style={{ color: '#0b3d91', textDecoration: 'none', fontWeight: 600 }}>{state.settings.email}</a>
              </div>
            </div>
            
            <BusinessContacts cards product={product} />
          </div>
        </div>
      </section>

      {/* Section K: Location Map */}
      <LocationMap />
      
    </div>
  );
}
