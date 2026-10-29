import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../StoreContext';
import { api, type CodSettings } from '../../services/api';

export const KUWAIT_GOVERNORATES_LIST = [
  {
    id: 'CAPITAL',
    nameEn: 'Capital Governorate (Al Asimah)',
    nameAr: 'محافظة العاصمة',
    fee: 1.500,
    areas: ['Shuwaikh Industrial', 'Kuwait City / Sharq', 'Dasma', 'Mirgab', 'Jibla', 'Bneid Al-Qar', 'Shuwaikh Residential', 'Rawda', 'Adailiya']
  },
  {
    id: 'HAWALLI',
    nameEn: 'Hawalli Governorate',
    nameAr: 'محافظة حولي',
    fee: 1.500,
    areas: ['Hawalli', 'Salmiya', 'Rumaithiya', 'Jabriya', 'Bayan', 'Mishref', 'Salwa', 'Shaab', 'Hateen', 'Al-Zahra']
  },
  {
    id: 'FARWANIYA',
    nameEn: 'Farwaniya Governorate',
    nameAr: 'محافظة الفروانية',
    fee: 1.500,
    areas: ['Farwaniya', 'Al-Rai Industrial', 'Khaitan', 'Ardiya', 'Ardiya Industrial', 'Jleeb Al-Shuyoukh', 'Andalus', 'Dajeej']
  },
  {
    id: 'AHMADI',
    nameEn: 'Ahmadi Governorate',
    nameAr: 'محافظة الأحمدي',
    fee: 2.000,
    areas: ['Ahmadi', 'Fahaheel', 'Mangaf', 'Mahboula', 'Abu Halifa', 'Egaila', 'Shuaiba Industrial', 'Mina Abdulla', 'Wafra', 'Khiran']
  },
  {
    id: 'JAHRA',
    nameEn: 'Jahra Governorate',
    nameAr: 'محافظة الجهراء',
    fee: 2.000,
    areas: ['Jahra', 'Sulaibiya', 'Sulaibiya Industrial', 'Amghara Industrial', 'Saad Al-Abdullah', 'Mutlaa', 'Abdali']
  },
  {
    id: 'MUBARAK_AL_KABEER',
    nameEn: 'Mubarak Al-Kabeer Governorate',
    nameAr: 'محافظة مبارك الكبير',
    fee: 1.500,
    areas: ['Mubarak Al-Kabeer', 'Qurain', 'Adan', 'Qusoor', 'Sabah Al-Salem', 'Messila', 'Abu Ftaira', 'Fintas', 'Subhan Industrial']
  }
];

export default function CheckoutPage() {
  const copy = useStorefrontCopy();
  const { i18n } = useTranslation(['common', 'navigation', 'products', 'checkout', 'wholesale', 'account']);
  const isAr = i18n.language === 'ar-KW';
  const { state, dispatch, showToast } = useStore();
  const navigate = useNavigate();

  const [codSettings, setCodSettings] = useState<CodSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: 'Tariq Al-Mansoor',
    email: 'tariq@email.com',
    phone: '+965 98765432',
    governorate: 'Capital Governorate (Al Asimah)',
    area: 'Shuwaikh Industrial',
    block: 'Block 3',
    street: 'Street 5',
    building: 'Building 12, Workshop 4',
    floor: '',
    apartment: '',
    notes: 'Please call upon arrival before delivery.',
    method: 'delivery' as 'delivery' | 'pickup'
  });

  useEffect(() => {
    api.getCodSettings()
      .then(settings => {
        setCodSettings(settings);
      })
      .catch(() => {
        // Fallback default COD settings
        setCodSettings({
          enabled: true,
          allowedAreas: KUWAIT_GOVERNORATES_LIST.flatMap(g => g.areas),
          minOrderAmount: null,
          maxOrderAmount: null,
          handlingFee: 0,
          standardDeliveryFee: 1.500,
          instructionsEn: 'Pay with cash when your order is delivered.',
          instructionsAr: 'ادفع نقدًا عند استلام طلبك.',
          internalOrderConfirmation: true,
          deliveryPricingApproved: false,
          isTestMode: true,
        });
      });
  }, []);

  const [serverQuote,setServerQuote]=useState<any>(null);
  const [quoteError,setQuoteError]=useState('');
  useEffect(()=>{let current=true;setServerQuote(null);setQuoteError('');if(!state.cart.length)return;api.catalogue('/cart/quote',{method:'POST',body:JSON.stringify({items:state.cart.map(i=>({productId:Number(i.productId),variantId:i.variantId?Number(i.variantId):undefined,qty:i.quantity})),area:formData.area})}).then(q=>{if(current)setServerQuote(q)}).catch(e=>{if(current)setQuoteError(e.message)});return()=>{current=false}},[state.cart,formData.area]);

  const currentGov = KUWAIT_GOVERNORATES_LIST.find(g => g.nameEn === formData.governorate) || KUWAIT_GOVERNORATES_LIST[0];

  const subtotal=Number(serverQuote?.subtotal||0);
  const delivery=Number(serverQuote?.delivery_fee||0);
  const handlingFee=0;
  const total=Number(serverQuote?.total||0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.cart.length === 0) {
      setErrorMessage(isAr ? 'سلة التسوق فارغة' : 'Your cart is empty');
      return;
    }

    if(!serverQuote?.delivery_available||serverQuote.total==null){setErrorMessage(quoteError||'A verified server quote is required');return;}
    setSubmitting(true);
    setErrorMessage(null);

    // Generate unique idempotency key for duplicate submission prevention
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      showToast(isAr ? 'جاري تأكيد طلبك...' : 'Confirming order...', 'hourglass_top');

      const payload = {
        items: state.cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
        },
        address: {
          governorate: formData.governorate,
          area: formData.area,
          block: formData.block,
          street: formData.street,
          building: formData.building,
          floor: formData.floor,
          apartment: formData.apartment,
          notes: formData.notes,
        },
        deliveryMethod: (formData.method === 'delivery' ? 'DELIVERY' : 'PICKUP') as 'DELIVERY' | 'PICKUP',
        paymentMethod: 'COD',
        idempotencyKey,
        notes: formData.notes,
      };

      const result = await api.createCodOrder(payload);

      // Clear shopping cart on successful placement
      dispatch({ type: 'CLEAR_CART' });

      showToast(
        isAr ? 'تم تقديم الطلب بنجاح — الدفع عند الاستلام.' : 'Order Placed Successfully — Payment Due on Delivery.',
        'check_circle'
      );

      // Navigate to order confirmation and tracking view
      navigate(`/order-confirmation/${result.order.orderNumber}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || (isAr ? 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'Order submission failed. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <section style={{ padding: 'var(--space-md) var(--margin-mobile)' }}>
        <h1 className="text-headline-lg-mobile" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          {isAr ? 'إتمام الطلب — الدفع عند الاستلام' : 'Checkout — Cash on Delivery'}
        </h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          {isAr ? 'ادفع نقدًا عند استلام طلبك. لا حاجة لبطاقة ائتمان.' : 'Pay in cash directly to our delivery courier. No card required.'}
        </p>

        {/* Prominent COD Guarantee Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
          border: '1px solid #81c784',
          padding: 16,
          borderRadius: 12,
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#2e7d32' }}>payments</span>
          <div>
            <div style={{ fontWeight: 700, color: '#1b5e20', fontSize: '1rem' }}>
              {isAr ? 'الدفع نقدًا عند الاستلام فقط' : 'Cash on Delivery (COD) Only'}
            </div>
            <div style={{ color: '#2e7d32', fontSize: '0.875rem', marginTop: 2 }}>
              {isAr ? 'ادفع نقدًا عند استلام طلبك.' : 'Pay with cash when your order is delivered.'}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div style={{
            background: '#ffebee',
            border: '1px solid #ef5350',
            color: '#c62828',
            padding: 12,
            borderRadius: 8,
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span className="material-symbols-outlined">error</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{errorMessage}</span>
          </div>
        )}
      </section>

      <section style={{ padding: '0 var(--margin-mobile)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {quoteError&&<p role="alert">{quoteError}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer Contact */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>person</span>
              <h2 className="text-headline-sm">{isAr ? 'بيانات العميل' : 'Customer Details'}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={copy("e.g. Tariq Al-Mansoor")}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'رقم الهاتف (الكويت) *' : 'Kuwait Phone Number *'}
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+965 98765432"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'البريد الإلكتروني (اختياري للإشعارات)' : 'Email (Optional for tracking)'}
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder={copy("tariq@email.com")}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>local_shipping</span>
              <h2 className="text-headline-sm">{isAr ? 'طريقة وعنوان التوصيل في الكويت' : 'Kuwait Delivery Address'}</h2>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                className={`btn ${formData.method === 'delivery' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setFormData({ ...formData, method: 'delivery' })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>local_shipping</span>
                {isAr ? 'توصيل إلى الموقع' : 'Delivery to Address'}
              </button>
              <button
                type="button"
                className={`btn ${formData.method === 'pickup' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setFormData({ ...formData, method: 'pickup' })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6 }}>store</span>
                {isAr ? 'استلام من الشويخ' : 'Showroom Pickup (Shuwaikh)'}
              </button>
            </div>

            {formData.method === 'delivery' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
                {/* Governorate Select */}
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'المحافظة في الكويت *' : 'Kuwait Governorate *'}
                  </label>
                  <select
                    className="input"
                    value={formData.governorate}
                    onChange={e => {
                      const newGovName = e.target.value;
                      const gObj = KUWAIT_GOVERNORATES_LIST.find(g => g.nameEn === newGovName) || KUWAIT_GOVERNORATES_LIST[0];
                      setFormData(prev => ({
                        ...prev,
                        governorate: newGovName,
                        area: gObj.areas[0]
                      }));
                    }}
                    required
                  >
                    {KUWAIT_GOVERNORATES_LIST.map(g => (
                      <option key={g.id} value={g.nameEn}>
                        {isAr ? g.nameAr : g.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Select */}
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'المنطقة التابعة للمحافظة *' : 'Delivery Area / District *'}
                  </label>
                  <select
                    className="input"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    required
                  >
                    {currentGov.areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Test Mode Fee Notice */}
                {!codSettings?.deliveryPricingApproved && (
                  <div style={{
                    gridColumn: '1 / -1',
                    background: '#fff8e1',
                    border: '1px solid #ffe082',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    color: '#e65100',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#f57c00' }}>info</span>
                    <span>
                      {isAr
                        ? 'تنبيه اختبار محلي: رسوم التوصيل الحالية تجريبية للاختبار المحلي فقط وقيد الاعتماد الرسمي من الإدارة.'
                        : 'Localhost Test Notice: The delivery charge is a sample fee for testing only. Official pricing pending business sign-off.'}
                    </span>
                  </div>
                )}
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'القطعة (Block) *' : 'Block *'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder={copy("e.g. Block 3")}
                    value={formData.block}
                    onChange={e => setFormData({ ...formData, block: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'الشارع *' : 'Street *'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder={copy("e.g. Street 5")}
                    value={formData.street}
                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'المبنى / القسيمة *' : 'Building / Workshop *'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder={copy("e.g. Plot 12")}
                    value={formData.building}
                    onChange={e => setFormData({ ...formData, building: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'الدور / الشقة (اختياري)' : 'Floor / Unit (Optional)'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder={copy("e.g. Floor 2")}
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
                    {isAr ? 'ملاحظات وتوجيهات السائق' : 'Special Delivery Instructions'}
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    style={{ height: 'auto', paddingTop: 8 }}
                    placeholder={copy("e.g. Near Shuwaikh wholesale market gate...")}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method: Strictly Cash on Delivery */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>account_balance_wallet</span>
              <h2 className="text-headline-sm">{isAr ? 'طريقة الدفع' : 'Payment Method'}</h2>
            </div>

            <div style={{
              border: '2px solid var(--primary)',
              borderRadius: 10,
              padding: 16,
              background: 'var(--surface-container-low)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked
                  readOnly
                  style={{ width: 20, height: 20, accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
                    {isAr ? 'الدفع نقدًا عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>
                    {isAr ? 'ادفع نقدًا عند استلام طلبك.' : 'Pay with cash when your order is delivered.'}
                  </div>
                </div>
              </div>
              <span className="badge" style={{ background: '#e6f4ea', color: '#137333', fontWeight: 600, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem' }}>
                {isAr ? 'مفعل ومعتمد' : 'Approved'}
              </span>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1e88e5' }}>verified_user</span>
              <span>
                {isAr
                  ? 'لا نطلب بيانات بطاقتك البنكية. تسليم آمن ونقد باليد مباشرة.'
                  : 'No bank card required. Safe delivery with direct cash receipt on arrival.'}
              </span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card" style={{ padding: 20 }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 16 }}>{isAr ? 'ملخص الحساب الإجمالي' : 'Order Summary'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-body-md">
                <span>{isAr ? 'مجموع المنتجات' : 'Products Subtotal'} ({state.cart.reduce((a, b) => a + b.quantity, 0)} {isAr ? 'قطعة' : 'items'})</span>
                <span style={{ fontWeight: 600 }}>{serverQuote?subtotal.toFixed(3):'—'} {copy("KWD")}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-body-md">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{isAr ? 'رسوم التوصيل في الكويت' : 'Kuwait Delivery Charge'}</span>
                  {!codSettings?.deliveryPricingApproved && (
                    <span style={{ fontSize: '0.72rem', background: '#ffe0b2', color: '#b78103', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                      {isAr ? 'تجريبي — للاختبار' : 'SAMPLE / TEST FEE'}
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 600 }}>{serverQuote?delivery.toFixed(3):'—'} {copy("KWD")}</span>
              </div>

              {handlingFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-body-md">
                  <span>{isAr ? 'رسوم معالجة الدفع نقدًا' : 'COD Handling Fee'}</span>
                  <span>{handlingFee.toFixed(3)} {copy("KWD")}</span>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 16,
                marginTop: 8,
                borderTop: '2px solid var(--surface-container-high)'
              }} className="text-headline-sm">
                <div>
                  <span style={{ fontWeight: 700 }}>{isAr ? 'المبلغ المستحق عند الاستلام' : 'Total Payable on Delivery'}</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 400 }}>
                    {isAr ? 'شامل رسوم التوصيل' : 'Includes Kuwait delivery charge'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.4rem' }}>
                    {serverQuote?total.toFixed(3):'—'}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginLeft: 4, fontWeight: 700 }}>{copy("KWD")}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 24,
                padding: '16px',
                fontSize: '1.05rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 10
              }}
              disabled={state.cart.length === 0 || submitting || !serverQuote?.delivery_available || !!quoteError}
            >
              <span className="material-symbols-outlined">shopping_cart_checkout</span>
              {submitting
                ? (isAr ? 'جاري تأكيد الطلب...' : 'Confirming COD Order...')
                : (isAr ? `تأكيد الطلب — ادفع ${serverQuote?total.toFixed(3):'—'} د.ك عند الاستلام` : `Confirm Order — Pay ${serverQuote?total.toFixed(3):'—'} KWD on Delivery`)}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
