import { useState, useEffect } from 'react';
import { useStore } from '../../StoreContext';
import { api, type CodSettings } from '../../services/api';

export default function AdminSettings() {
  const { state, dispatch, showToast } = useStore();
  const [storeData, setStoreData] = useState(state.settings);

  // COD Settings State
  const [codSettings, setCodSettings] = useState<CodSettings>({
    enabled: true,
    allowedAreas: [
      'Capital / Kuwait City',
      'Shuwaikh Industrial',
      'Dasma',
      'Sharq',
      'Hawally',
      'Salmiya',
      'Farwaniya',
      'Ahmadi',
      'Jahra',
      'Mubarak Al-Kabeer',
      'Al Rai',
      'Sabhan Industrial',
      'Fahaheel'
    ],
    minOrderAmount: null,
    maxOrderAmount: null,
    handlingFee: null,
    standardDeliveryFee: 1.500,
    instructionsEn: 'Pay with cash when your order is delivered.',
    instructionsAr: 'ادفع نقدًا عند استلام طلبك.',
    internalOrderConfirmation: true,
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cod' | 'store'>('cod');

  useEffect(() => {
    api.getAdminCodSettings()
      .then(settings => {
        if (settings) setCodSettings(settings);
      })
      .catch(() => {});
  }, []);

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_SETTINGS', payload: storeData });
    showToast('Store identity settings saved', 'check_circle');
  };

  const handleCodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateAdminCodSettings(codSettings);
      setCodSettings(res.settings);
      showToast('Cash on Delivery settings saved to PostgreSQL!', 'check_circle');
    } catch (err: any) {
      showToast(`Error saving COD settings: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'var(--primary)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 26 }}>tune</span>
        </div>
        <div>
          <h1 className="text-headline-md" style={{ color: 'var(--primary)', fontWeight: 800 }}>
            E-Commerce Store & Payment Settings
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Configure Cash on Delivery (COD) parameters, Kuwait zones, and customer instructions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--surface-container-high)', paddingBottom: 8 }}>
        <button
          className={`btn ${activeTab === 'cod' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('cod')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
          Cash on Delivery (COD) Settings
        </button>
        <button
          className={`btn ${activeTab === 'store' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('store')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>store</span>
          Store Identity & Contact
        </button>
      </div>

      {/* ── COD Settings Form ── */}
      {activeTab === 'cod' && (
        <form onSubmit={handleCodSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Activation Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="text-headline-sm" style={{ fontWeight: 700 }}>Enable Cash on Delivery</h2>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  When enabled, customers can select Cash on Delivery as the payment method at checkout.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={codSettings.enabled}
                  onChange={e => setCodSettings({ ...codSettings, enabled: e.target.checked })}
                  style={{ width: 22, height: 22, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: 700, color: codSettings.enabled ? '#2e7d32' : 'var(--outline)' }}>
                  {codSettings.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </label>
            </div>
          </div>

          {/* Business Delivery Pricing Approval Notice (Section 2 Requirement) */}
          <div className="card" style={{
            padding: 20,
            borderLeft: codSettings.deliveryPricingApproved ? '4px solid #2e7d32' : '4px solid #ed6c02',
            background: codSettings.deliveryPricingApproved ? 'rgba(46, 125, 50, 0.04)' : 'rgba(237, 108, 2, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: codSettings.deliveryPricingApproved ? '#2e7d32' : '#ed6c02' }}>
                    {codSettings.deliveryPricingApproved ? 'verified' : 'pending_actions'}
                  </span>
                  <h2 className="text-headline-sm" style={{ fontWeight: 800, margin: 0, color: codSettings.deliveryPricingApproved ? '#2e7d32' : '#c25700' }}>
                    {codSettings.deliveryPricingApproved ? 'Delivery Pricing Officially Approved' : 'Test Delivery Pricing Notice (Pending Approval)'}
                  </h2>
                </div>
                <p className="text-body-sm" style={{ marginTop: 8, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                  {codSettings.deliveryPricingApproved
                    ? 'The delivery fee rates across Kuwait Governorates have been verified and approved for live operations.'
                    : 'The current 1.500 KWD charge is a localhost sample fee for testing only. Business sign-off is required before real customer orders can be dispatched under confirmed pricing.'}
                </p>
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--outline)', fontStyle: 'italic' }}>
                  Notice shown to customers: "{codSettings.sampleNoticeEn || 'Sample delivery fee for localhost testing. Official delivery rate pending business sign-off.'}"
                </div>
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 8,
                background: '#fff',
                border: '1px solid var(--surface-container-high)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={Boolean(codSettings.deliveryPricingApproved)}
                  onChange={e => setCodSettings({
                    ...codSettings,
                    deliveryPricingApproved: e.target.checked,
                    isTestMode: !e.target.checked
                  })}
                  style={{ width: 20, height: 20, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: codSettings.deliveryPricingApproved ? '#2e7d32' : 'var(--on-surface)' }}>
                  Approve Official Business Pricing
                </span>
              </label>
            </div>
          </div>

          {/* Delivery Fee & Limits */}
          <div className="card" style={{ padding: 20 }}>
            <h2 className="text-headline-sm" style={{ fontWeight: 700, marginBottom: 16 }}>
              Standard Delivery Fees & Order Thresholds
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  Default Delivery Fee (KWD) *
                </label>
                <input
                  type="number"
                  step="0.050"
                  className="input"
                  value={codSettings.standardDeliveryFee}
                  onChange={e => setCodSettings({ ...codSettings, standardDeliveryFee: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>
                  Base rate applied across standard Kuwait zones
                </span>
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  Optional COD Handling Fee (KWD)
                </label>
                <input
                  type="number"
                  step="0.050"
                  className="input"
                  placeholder="Leave 0 or empty (Unset)"
                  value={codSettings.handlingFee ?? ''}
                  onChange={e => setCodSettings({
                    ...codSettings,
                    handlingFee: e.target.value === '' ? null : parseFloat(e.target.value),
                  })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Unset by default per business rules</span>
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  Minimum Order Amount (KWD, Optional)
                </label>
                <input
                  type="number"
                  step="0.100"
                  className="input"
                  placeholder="No minimum (Leave unset)"
                  value={codSettings.minOrderAmount ?? ''}
                  onChange={e => setCodSettings({
                    ...codSettings,
                    minOrderAmount: e.target.value === '' ? null : parseFloat(e.target.value),
                  })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Leave unset until business approves</span>
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  Maximum COD Amount (KWD, Optional)
                </label>
                <input
                  type="number"
                  step="1.000"
                  className="input"
                  placeholder="No maximum (Leave unset)"
                  value={codSettings.maxOrderAmount ?? ''}
                  onChange={e => setCodSettings({
                    ...codSettings,
                    maxOrderAmount: e.target.value === '' ? null : parseFloat(e.target.value),
                  })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Leave unset until business approves</span>
              </div>
            </div>
          </div>

          {/* Kuwait 6 Official Governorates & Areas Hierarchy */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h2 className="text-headline-sm" style={{ fontWeight: 700 }}>
                  Kuwait's 6 Official Governorates & Delivery Areas
                </h2>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  Proper governorate/area relationships. Each governorate has its configured delivery fee and mapped residential & industrial areas.
                </p>
              </div>
              <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
                6 Governorates Configured
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {[
                { id: 'CAPITAL', nameEn: 'Capital Governorate (Al Asimah)', nameAr: 'محافظة العاصمة', fee: 1.500, areas: ['Kuwait City / Sharq', 'Shuwaikh Industrial', 'Dasma', 'Mirgab', 'Jibla', 'Bneid Al-Qar', 'Rawda', 'Adailiya'] },
                { id: 'HAWALLI', nameEn: 'Hawalli Governorate', nameAr: 'محافظة حولي', fee: 1.500, areas: ['Hawalli', 'Salmiya', 'Rumaithiya', 'Jabriya', 'Bayan', 'Mishref', 'Salwa', 'Shaab'] },
                { id: 'FARWANIYA', nameEn: 'Farwaniya Governorate', nameAr: 'محافظة الفروانية', fee: 1.500, areas: ['Farwaniya', 'Al-Rai Industrial', 'Khaitan', 'Ardiya', 'Ardiya Industrial', 'Dajeej'] },
                { id: 'AHMADI', nameEn: 'Ahmadi Governorate', nameAr: 'محافظة الأحمدي', fee: 2.000, areas: ['Ahmadi', 'Fahaheel', 'Mangaf', 'Mahboula', 'Abu Halifa', 'Shuaiba Industrial', 'Mina Abdulla', 'Wafra'] },
                { id: 'JAHRA', nameEn: 'Jahra Governorate', nameAr: 'محافظة الجهراء', fee: 2.000, areas: ['Jahra', 'Sulaibiya', 'Sulaibiya Industrial', 'Amghara Industrial', 'Saad Al-Abdullah', 'Mutlaa'] },
                { id: 'MUBARAK_AL_KABEER', nameEn: 'Mubarak Al-Kabeer Governorate', nameAr: 'محافظة مبارك الكبير', fee: 1.500, areas: ['Mubarak Al-Kabeer', 'Qurain', 'Adan', 'Sabah Al-Salem', 'Subhan Industrial'] }
              ].map(gov => (
                <div key={gov.id} style={{
                  border: '1px solid var(--surface-container-high)',
                  borderRadius: 10,
                  padding: 14,
                  background: '#fafbfc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                      {gov.nameEn}
                    </div>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {gov.fee.toFixed(3)} KWD
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--outline)', marginBottom: 8 }} dir="rtl">
                    {gov.nameAr}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {gov.areas.map(area => (
                      <span key={area} style={{
                        fontSize: '0.72rem',
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: 4,
                        padding: '2px 6px',
                        color: 'var(--on-surface)'
                      }}>
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer-Facing Instructions */}
          <div className="card" style={{ padding: 20 }}>
            <h2 className="text-headline-sm" style={{ fontWeight: 700, marginBottom: 16 }}>
              Customer-Facing COD Instructions (Bilingual)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  English Instruction Notice
                </label>
                <input
                  type="text"
                  className="input"
                  value={codSettings.instructionsEn}
                  onChange={e => setCodSettings({ ...codSettings, instructionsEn: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  Arabic Instruction Notice (تعليمات الاستلام باللغة العربية)
                </label>
                <input
                  type="text"
                  className="input"
                  dir="rtl"
                  value={codSettings.instructionsAr}
                  onChange={e => setCodSettings({ ...codSettings, instructionsAr: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginTop: 8, padding: 12, background: 'var(--surface-container-low)', borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={codSettings.internalOrderConfirmation}
                    onChange={e => setCodSettings({ ...codSettings, internalOrderConfirmation: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    Require internal staff confirmation before packaging/dispatch
                  </span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ padding: '16px', fontSize: '1rem', fontWeight: 700 }}
          >
            {saving ? 'Saving to Database...' : 'Save Cash on Delivery Settings'}
          </button>
        </form>
      )}

      {/* ── Store Identity Form ── */}
      {activeTab === 'store' && (
        <form onSubmit={handleStoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 16 }}>Store Identity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Store Name</label>
                <input type="text" className="input" value={storeData.storeName} onChange={e => setStoreData({ ...storeData, storeName: e.target.value })} />
              </div>
              <div>
                <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Tagline</label>
                <input type="text" className="input" value={storeData.tagline} onChange={e => setStoreData({ ...storeData, tagline: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 16 }}>Contact Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Phone</label>
                <input type="text" className="input" value={storeData.phone} onChange={e => setStoreData({ ...storeData, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Email</label>
                <input type="text" className="input" value={storeData.email} onChange={e => setStoreData({ ...storeData, email: e.target.value })} />
              </div>
              <div>
                <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Address</label>
                <textarea className="input" style={{ height: 'auto', paddingTop: 8 }} rows={3} value={storeData.address} onChange={e => setStoreData({ ...storeData, address: e.target.value })}></textarea>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: 16 }}>Save Store Identity Settings</button>
        </form>
      )}
    </div>
  );
}
