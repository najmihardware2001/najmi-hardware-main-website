import { useStorefrontCopy } from '../i18n/useStorefrontCopy';
import { useStore } from '../StoreContext';

export default function LocationMap() {
  const copy = useStorefrontCopy();
  const { state } = useStore();
  
  // Default map URL using a search query if none is provided in settings
  const defaultMapUrl = 'https://www.google.com/maps?q=Al-Najm+Hardware+Establishment,Shop+No.+12,Al-Juwan+Commercial+Complex,Khalifa+Al-Jassem+Street,Shuwaikh+Industrial+Area,Kuwait&output=embed';
  const mapUrl = state.settings.mapUrl || defaultMapUrl;

  const handleCopyAddress = () => {
    const address = "Al-Najm Hardware Establishment / NAJMI Hardware\nShop No. 12, Al-Juwan Commercial Complex,\nKhalifa Al-Jassem Street,\nShuwaikh Industrial Area, Kuwait";
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  return (
    <section className="location-section" style={{ padding: '60px var(--margin-mobile)', background: 'var(--surface-container-low)', borderTop: '1px solid var(--outline-variant)' }}>
      <div className="container-app" style={{ maxWidth: 1440, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0b3d91' }}>{copy("Visit Our Store in Kuwait")}</h2>
          <p style={{ color: 'var(--on-surface-variant)', marginTop: 8, fontSize: '1.1rem' }}>{copy("Find us in Shuwaikh Industrial Area.")}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch' }}>
          
          {/* Left: Address Info */}
          <div style={{ flex: '1 1 350px', minWidth: 0, maxWidth: '100%', background: '#fff', padding: 'clamp(18px, 4vw, 40px)', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0b3d91', marginBottom: 24 }}>{copy("NAJMI Hardware")}</h3>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <span className="material-symbols-outlined" style={{ color: '#e31837', marginTop: 4 }}>location_on</span>
              <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                <p style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>{copy("Al-Najm Hardware Establishment")}</p>
                <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6 }}> {copy("Shop No. 12, Al-Juwan Commercial Complex,")}<br/> {copy("Khalifa Al-Jassem Street,")}<br/> {copy("Shuwaikh Industrial Area, Kuwait")} </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <span className="material-symbols-outlined" style={{ color: '#e31837', marginTop: 4 }}>call</span>
              <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                <p style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>{copy("Telephone")}</p>
                <a href="tel:+96524827860" style={{ color: '#0b3d91', textDecoration: 'none', fontWeight: 600 }}>+965 24827860</a>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=Al-Najm+Hardware+Establishment,Shuwaikh,Kuwait" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn" 
                style={{ background: '#e31837', color: '#fff', width: '100%', justifyContent: 'center', fontWeight: 700, border: 'none', padding: '16px' }}
              >
                <span className="material-symbols-outlined icon-sm">directions</span> {copy("Get Directions")} </a>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a 
                  href="tel:+96524827860" 
                  className="btn btn-outline" 
                  style={{ flex: 1, justifyContent: 'center', borderColor: '#0b3d91', color: '#0b3d91' }}
                >
                  <span className="material-symbols-outlined icon-sm">call</span> {copy("Call Store")} </a>
                <button 
                  onClick={handleCopyAddress} 
                  className="btn btn-outline" 
                  style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--outline)', color: 'var(--on-surface-variant)' }}
                >
                  <span className="material-symbols-outlined icon-sm">content_copy</span> {copy("Copy Address")} </button>
              </div>
            </div>
          </div>

          {/* Right: Embedded Map */}
          <div style={{ flex: '2 1 500px', minWidth: 0, maxWidth: '100%', minHeight: 350, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', background: '#e0e0e0' }}>
            <iframe 
              src={mapUrl}
              width="100%" 
              height="100%" 
              style={{ border: 0, display: 'block' }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title={copy("NAJMI Hardware Location")}
            ></iframe>
          </div>

        </div>
      </div>
    </section>
  );
}
