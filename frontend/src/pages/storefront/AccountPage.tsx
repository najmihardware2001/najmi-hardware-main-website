import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import { KUWAIT_GOVERNORATES_LIST } from './CheckoutPage';

export default function AccountPage() {
  const copy = useStorefrontCopy();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar-KW';
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const [customerToken, setCustomerToken] = useState<string | null>(() => localStorage.getItem('najmi_customer_token'));
  const [customer, setCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('+965 ');
  const [authCompany, setAuthCompany] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Address modal states
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newGovernorate, setNewGovernorate] = useState(KUWAIT_GOVERNORATES_LIST[0].nameEn);
  const [newArea, setNewArea] = useState(KUWAIT_GOVERNORATES_LIST[0].areas[0]);
  const [newBlock, setNewBlock] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newApartment, setNewApartment] = useState('');
  const [newLabel, setNewLabel] = useState('Office / Site');

  // Return request modal states
  const [returnOrderNumber, setReturnOrderNumber] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  const selectedGovObj = KUWAIT_GOVERNORATES_LIST.find(g => g.nameEn === newGovernorate) || KUWAIT_GOVERNORATES_LIST[0];

  useEffect(() => {
    if (customerToken) {
      loadCustomerData();
    }
  }, [customerToken]);

  const loadCustomerData = async () => {
    setLoadingData(true);
    try {
      const [profileData, ordersData, addressesData] = await Promise.all([
        api.getCustomerProfile(customerToken || undefined).catch(() => null),
        api.getCustomerOrders(customerToken || undefined).catch(() => []),
        api.getCustomerAddresses(customerToken || undefined).catch(() => []),
      ]);

      if (profileData) {
        setCustomer(profileData);
      }
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
    } catch (err: any) {
      console.warn('Load customer data error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.signIn(authEmail.trim(), authPassword);
      if (res?.account_type === 'admin') {
        await refresh();
        setAuthPassword('');
        navigate('/admin', { replace: true });
        return;
      }
      if (res && res.token) {
        localStorage.setItem('najmi_customer_token', res.token);
        setCustomerToken(res.token);
        setCustomer(res.customer);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.customerRegister({
        name: authName.trim(),
        email: authEmail.trim(),
        phone: authPhone.trim(),
        password: authPassword,
        companyName: authCompany.trim() || undefined,
      });
      if (res && res.token) {
        localStorage.setItem('najmi_customer_token', res.token);
        setCustomerToken(res.token);
        setCustomer(res.customer);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('najmi_customer_token');
    setCustomerToken(null);
    setCustomer(null);
    setOrders([]);
    setAddresses([]);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addCustomerAddress({
        governorate: newGovernorate,
        area: newArea,
        block: newBlock,
        street: newStreet,
        building: newBuilding,
        floor: newFloor,
        apartment: newApartment,
        label: newLabel,
        isDefault: addresses.length === 0,
      }, customerToken || undefined);

      setShowAddAddress(false);
      setNewBlock('');
      setNewStreet('');
      setNewBuilding('');
      loadCustomerData();
    } catch (err: any) {
      alert(`Error saving address: ${err.message}`);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا العنوان؟' : 'Delete this saved Kuwait address?')) return;
    try {
      await api.deleteCustomerAddress(id, customerToken || undefined);
      loadCustomerData();
    } catch (err: any) {
      alert(`Error deleting address: ${err.message}`);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderNumber) return;
    try {
      const res = await api.submitReturnRequest(
        returnOrderNumber,
        { reason: returnReason, items: [] },
        customerToken || undefined
      );
      setReturnSuccessMsg(isAr
        ? `تم تسجيل طلب الإرجاع برقم: ${res.returnRequest.returnNumber}`
        : `Return request registered: ${res.returnRequest.returnNumber}`);
      setReturnReason('');
      loadCustomerData();
    } catch (err: any) {
      alert(`Error submitting return request: ${err.message}`);
    }
  };

  // ── Unauthenticated State: Login / Registration ──
  if (!customerToken) {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 20px', width: '100%' }}>
        <div className="card" style={{ padding: 28, borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>person</span>
            </div>
            <h1 className="text-headline-md" style={{ color: 'var(--primary)', fontWeight: 800 }}>
              {authMode === 'login'
                ? (isAr ? 'تسجيل الدخول' : 'Sign In')
                : (isAr ? 'إنشاء حساب عميل جديد' : 'Create Customer Account')}
            </h1>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
              {isAr ? 'إدارة عناوين التوصيل، تتبع الطلبات، وطلبات الإرجاع' : 'Manage Kuwait delivery addresses, track orders, and request returns.'}
            </p>
          </div>

          {authError && (
            <div style={{
              background: '#ffebee', border: '1px solid #ef5350', color: '#c62828',
              padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem'
            }}>
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="signin-email" className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <input
                  id="signin-email" type="email"
                  className="input"
                  required
                  placeholder="name@example.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="signin-password" className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  id="signin-password" type="password"
                  className="input"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={authLoading} style={{ marginTop: 8, padding: 12 }}>
                {authLoading ? (isAr ? 'جاري التحقق...' : 'Signing in...') : (isAr ? 'تسجيل الدخول' : 'Sign In')}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  {isAr ? 'إنشاء حساب جديد' : 'Register Here'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder={copy("e.g. Bader Al-Mutawa")}
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  className="input"
                  required
                  placeholder={copy("bader@company.com")}
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'رقم الهاتف (الكويت) *' : 'Kuwait Phone *'}
                </label>
                <input
                  type="tel"
                  className="input"
                  required
                  placeholder="+965 9988 7766"
                  value={authPhone}
                  onChange={e => setAuthPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'اسم الشركة أو المقاولات (اختياري)' : 'Company / Contractor Name (Optional)'}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={copy("e.g. Al-Mutawa Contracting Co.")}
                  value={authCompany}
                  onChange={e => setAuthCompany(e.target.value)}
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'كلمة المرور (6 خانات على الأقل) *' : 'Password (min 6 characters) *'}
                </label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={authLoading} style={{ marginTop: 8, padding: 12 }}>
                {authLoading ? (isAr ? 'جاري التسجيل...' : 'Creating Account...') : (isAr ? 'إنشاء الحساب' : 'Create Account')}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Authenticated Customer Account View ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto', width: '100%', padding: '0 20px 40px' }}>
      {/* Header Profile Card */}
      <div className="card" style={{
        marginTop: 24, padding: 24, background: 'linear-gradient(135deg, var(--primary) 0%, #1a365d 100%)',
        color: '#fff', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>person</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="text-headline-sm" style={{ fontWeight: 800, margin: 0, color: '#fff' }}>
                {customer?.name || 'Customer Account'}
              </h1>
              <span className="badge" style={{
                background: '#ffd54f', color: '#000', fontWeight: 700, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4
              }}>
                {customer?.customerClass || 'STANDARD'}
              </span>
            </div>
            <p className="text-body-sm" style={{ opacity: 0.9, marginTop: 4 }}>
              {customer?.email} • {customer?.phone}
              {customer?.companyName ? ` • ${customer.companyName}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          {isAr ? 'تسجيل الخروج' : 'Log Out'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24, borderBottom: '1px solid var(--surface-container-high)', paddingBottom: 8 }}>
        <button
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
          {isAr ? 'سجل الطلبات' : 'My Orders'} ({orders.length})
        </button>
        <button
          className={`btn ${activeTab === 'addresses' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('addresses')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home_pin</span>
          {isAr ? 'عناوين التوصيل في الكويت' : 'Kuwait Addresses'} ({addresses.length})
        </button>
      </div>

      {/* ── Tab 1: Orders History ── */}
      {activeTab === 'orders' && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {returnSuccessMsg && (
            <div style={{ background: '#e8f5e9', border: '1px solid #81c784', color: '#1b5e20', padding: 12, borderRadius: 8 }}>
              {returnSuccessMsg}
            </div>
          )}

          {loadingData ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--outline)' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              <p style={{ marginTop: 8 }}>{isAr ? 'جاري تحميل البيانات...' : 'Loading account data...'}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--outline)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--outline-variant)' }}>shopping_bag</span>
              <p style={{ marginTop: 8 }}>{isAr ? 'لم تقم بتقديم أي طلبات بعد.' : 'No orders placed yet.'}</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="card" style={{ padding: 20, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </span>
                      <span className="badge" style={{
                        background: order.orderStatus === 'DELIVERED' ? '#e8f5e9' : '#fff3e0',
                        color: order.orderStatus === 'DELIVERED' ? '#2e7d32' : '#e65100',
                        fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem'
                      }}>
                        {order.orderStatus}
                      </span>
                      <span className="badge" style={{
                        background: order.paymentStatus === 'COLLECTED' ? '#e8f5e9' : '#f5f5f5',
                        color: order.paymentStatus === 'COLLECTED' ? '#2e7d32' : '#616161',
                        fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem'
                      }}> {copy("COD:")} {order.paymentStatus}
                      </span>
                    </div>
                    <span className="text-body-sm" style={{ color: 'var(--outline)', display: 'block', marginTop: 4 }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                      {Number(order.grandTotal).toFixed(3)} {copy("KWD")} </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}> {copy("Cash on Delivery (COD)")} </span>
                  </div>
                </div>

                {/* Items preview */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--surface-container-high)' }}>
                  {order.lines && order.lines.map((l: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                      <span>{l.quantity}{copy("x")} {l.productName} ({l.sku})</span>
                      <span style={{ fontWeight: 600 }}>{Number(l.subtotal).toFixed(3)} {copy("KWD")}</span>
                    </div>
                  ))}
                </div>

                {/* Return Request Button */}
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  {order.orderStatus === 'DELIVERED' && (
                    <button
                      className="btn btn-outline"
                      onClick={() => { setReturnOrderNumber(order.orderNumber); setReturnSuccessMsg(null); }}
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>keyboard_return</span>
                      {isAr ? 'طلب إرجاع صنف' : 'Request Item Return'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab 2: Saved Addresses ── */}
      {activeTab === 'addresses' && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>
              {isAr ? 'العناوين المسجلة في الكويت' : 'Saved Kuwait Delivery Addresses'}
            </h2>
            <button className="btn btn-primary" onClick={() => setShowAddAddress(!showAddAddress)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_location</span>
              {isAr ? 'إضافة عنوان جديد' : 'Add New Address'}
            </button>
          </div>

          {/* Add Address Form */}
          {showAddAddress && (
            <form onSubmit={handleSaveAddress} className="card" style={{ padding: 20, background: '#fafbfc', borderRadius: 12 }}>
              <h3 className="text-body-lg" style={{ fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>
                {isAr ? 'تفاصيل العنوان الكويتي' : 'New Kuwait Address Details'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Label (e.g. Office, Site, Home)")}</label>
                  <input className="input" required value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Kuwait Governorate *")}</label>
                  <select
                    className="input"
                    value={newGovernorate}
                    onChange={e => {
                      const g = e.target.value;
                      setNewGovernorate(g);
                      const gObj = KUWAIT_GOVERNORATES_LIST.find(x => x.nameEn === g) || KUWAIT_GOVERNORATES_LIST[0];
                      setNewArea(gObj.areas[0]);
                    }}
                    required
                  >
                    {KUWAIT_GOVERNORATES_LIST.map(g => (
                      <option key={g.id} value={g.nameEn}>{g.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Area / District *")}</label>
                  <select className="input" value={newArea} onChange={e => setNewArea(e.target.value)} required>
                    {selectedGovObj.areas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Block *")}</label>
                  <input className="input" required placeholder={copy("Block 3")} value={newBlock} onChange={e => setNewBlock(e.target.value)} />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Street *")}</label>
                  <input className="input" required placeholder={copy("Street 15")} value={newStreet} onChange={e => setNewStreet(e.target.value)} />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Building / Workshop *")}</label>
                  <input className="input" required placeholder={copy("Building 4")} value={newBuilding} onChange={e => setNewBuilding(e.target.value)} />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Floor")}</label>
                  <input className="input" placeholder={copy("Floor 2 (optional)")} value={newFloor} onChange={e => setNewFloor(e.target.value)} />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Apartment / Unit")}</label>
                  <input className="input" placeholder={copy("Apt 5 (optional)")} value={newApartment} onChange={e => setNewApartment(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddAddress(false)}>{copy("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{copy("Save Address")}</button>
              </div>
            </form>
          )}

          {/* List of addresses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {addresses.map(addr => (
              <div key={addr.id} className="card" style={{ padding: 18, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {addr.label || 'Delivery Address'}
                  </span>
                  {addr.isDefault && (
                    <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4 }}> {copy("DEFAULT")} </span>
                  )}
                </div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                  <div><strong>{addr.governorate}</strong> • {addr.area}</div>
                  <div>{copy("Block")} {addr.block}{copy(", Street")} {addr.street}{copy(", Building")} {addr.building}</div>
                  {addr.floor && <div>{copy("Floor")} {addr.floor}{copy(", Apt")} {addr.apartment}</div>}
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> {copy("Remove")} </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnOrderNumber && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, borderRadius: 14 }}>
            <h3 className="text-headline-sm" style={{ fontWeight: 700, marginBottom: 8 }}> {copy("Request Return for Order")} {returnOrderNumber}
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 14 }}> {copy("Items must be unused in original manufacturer packaging. A courier will collect the items and confirm authorized cash refund.")} </p>
            <form onSubmit={handleReturnSubmit}>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>{copy("Reason for Return *")}</label>
              <textarea
                className="input"
                required
                rows={3}
                placeholder={copy("e.g. Ordered incorrect diameter specification for construction project.")}
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                style={{ width: '100%', marginBottom: 16 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setReturnOrderNumber(null)}>{copy("Cancel")}</button>
                <button type="submit" className="btn btn-primary">{copy("Submit Return Request")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
