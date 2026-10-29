import { useStorefrontCopy } from '../../i18n/useStorefrontCopy';
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

export default function OrderConfirmation() {
  const copy = useStorefrontCopy();
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar-KW';

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');

  const loadOrder = (orderNum: string) => {
    setLoading(true);
    setError(null);
    api.trackOrder(orderNum)
      .then(res => {
        setOrder(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || (isAr ? 'لم يتم العثور على الطلب' : 'Order not found'));
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id && id !== 'latest') {
      loadOrder(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      loadOrder(searchOrderNumber.trim());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px var(--margin-mobile)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {/* Success Badge */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#e8f5e9',
        color: '#2e7d32',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 38 }}>payments</span>
      </div>

      {/* Mandatory Notification: Never "Payment Successful" */}
      <h1 className="text-headline-lg-mobile" style={{ color: 'var(--primary)', fontWeight: 800, textAlign: 'center' }}>
        {isAr ? 'تم تقديم الطلب بنجاح — الدفع عند الاستلام' : 'Order Placed Successfully — Payment Due on Delivery.'}
      </h1>

      <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 8, textAlign: 'center', maxWidth: 500 }}>
        {isAr
          ? 'شكرًا لاختيارك شركة النجمي. يرجى تجهيز المبلغ نقدًا عند استلام طلبك من مندوب التوصيل.'
          : 'Thank you for choosing Najmi Hardware. Please prepare exact cash for the courier upon delivery.'}
      </p>

      {/* Prominent COD Instructions Box */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%)',
        border: '1px solid #aed581',
        borderRadius: 12,
        padding: '16px 20px',
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span className="material-symbols-outlined" style={{ color: '#33691e', fontSize: 28 }}>info</span>
        <div>
          <div style={{ fontWeight: 700, color: '#33691e', fontSize: '0.95rem' }}>
            {isAr ? 'تعليمات الدفع المعتمدة:' : 'Cash Payment Instructions:'}
          </div>
          <div style={{ color: '#1b5e20', fontSize: '0.9rem', marginTop: 2 }}>
            {isAr ? 'ادفع نقدًا عند استلام طلبك.' : 'Pay with cash when your order is delivered.'}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>hourglass_top</span>
          <div style={{ marginTop: 8 }}>{isAr ? 'جاري تحميل تفاصيل الطلب...' : 'Loading order details...'}</div>
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ width: '100%', padding: 24, marginTop: 20, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--error)' }}>warning</span>
          <p style={{ marginTop: 8, color: 'var(--error)', fontWeight: 600 }}>{error}</p>
          <div style={{ marginTop: 16 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '0 auto' }}>
              <input
                type="text"
                className="input"
                placeholder={isAr ? 'أدخل رقم الطلب...' : 'Enter Order # (e.g. ORD-2026-10001)'}
                value={searchOrderNumber}
                onChange={e => setSearchOrderNumber(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">{isAr ? 'تتبع' : 'Track'}</button>
            </form>
          </div>
        </div>
      )}

      {order && !loading && (
        <>
          {/* Order Snapshot Card */}
          <div className="card" style={{ width: '100%', padding: 24, marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-container)', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <span className="text-label-sm" style={{ color: 'var(--outline)', textTransform: 'uppercase' }}>
                  {isAr ? 'رقم الطلب' : 'ORDER NUMBER'}
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                  {order.orderNumber}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge" style={{
                  background: order.orderStatus === 'DELIVERED' ? '#e6f4ea' : 'var(--signal-orange-dim)',
                  color: order.orderStatus === 'DELIVERED' ? '#137333' : 'var(--on-tertiary-container)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {order.orderStatus}
                </span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Payment & Delivery Status Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 12,
              padding: 14,
              background: 'var(--surface-container-low)',
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'طريقة الدفع' : 'Payment Method'}
                </span>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
                  {order.paymentMethod === 'COD' ? (isAr ? 'الدفع نقدًا عند الاستلام' : 'Cash on Delivery (COD)') : order.paymentMethod}
                </div>
              </div>

              <div>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'حالة السداد النقدية' : 'Payment Status'}
                </span>
                <div style={{ fontWeight: 700, color: order.paymentStatus === 'COLLECTED' ? '#2e7d32' : '#e65100', marginTop: 2 }}>
                  {order.paymentStatus === 'COLLECTED'
                    ? (isAr ? 'تم استلام النقد' : 'COLLECTED (Paid)')
                    : (isAr ? 'بانتظار التحصيل عند التسليم' : 'PENDING COLLECTION')}
                </div>
              </div>

              <div>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {isAr ? 'المبلغ المستحق نقدًا' : 'Amount Due on Delivery'}
                </span>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', marginTop: 2 }}>
                  {Number(order.grandTotal).toFixed(3)} {copy("KWD")} </div>
              </div>
            </div>

            {/* Delivery Destination */}
            {order.deliveryAddress && (
              <div style={{ borderBottom: '1px solid var(--surface-container)', paddingBottom: 16, marginBottom: 16 }}>
                <h3 className="text-headline-sm" style={{ fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>pin_drop</span>
                  {isAr ? 'عنوان وموقع التوصيل' : 'Delivery Destination'}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--on-surface)', lineHeight: 1.5 }}>
                  <div><strong>{order.customerName}</strong> ({order.customerPhone})</div>
                  <div>
                    {order.deliveryAddress.area}, {order.deliveryAddress.block}, {order.deliveryAddress.street}, {order.deliveryAddress.building}
                    {order.deliveryAddress.floor && ` • Floor: ${order.deliveryAddress.floor}`}
                  </div>
                  {order.deliveryAddress.notes && (
                    <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginTop: 4, fontStyle: 'italic' }}>
                      "{order.deliveryAddress.notes}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Breakdown */}
            <h3 className="text-headline-sm" style={{ fontSize: '1rem', marginBottom: 12 }}>
              {isAr ? 'الأصناف المطلوبة' : 'Ordered Items'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {order.lines?.map((line: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{line.quantity}{copy("x")}</span> {line.productName}
                    <span style={{ color: 'var(--outline)', fontSize: '0.8rem', marginLeft: 6 }}>({line.sku})</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{Number(line.subtotal).toFixed(3)} {copy("KWD")}</div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div style={{ borderTop: '1px solid var(--surface-container)', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                <span>{isAr ? 'مجموع المنتجات' : 'Products Subtotal'}</span>
                <span>{Number(order.subtotal).toFixed(3)} {copy("KWD")}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.9rem' }}>
                <span>{isAr ? 'رسوم التوصيل المعتمدة' : 'Kuwait Delivery Charge'}</span>
                <span>{Number(order.deliveryFee || 0).toFixed(3)} {copy("KWD")}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: '2px solid var(--surface-container)',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: 'var(--primary)'
              }}>
                <span>{isAr ? 'المبلغ المستحق للدفع نقدًا' : 'Total Payable on Delivery'}</span>
                <span>{Number(order.grandTotal).toFixed(3)} {copy("KWD")}</span>
              </div>
            </div>
          </div>

          {/* Chronological Order Lifecycle Stepper */}
          <div className="card" style={{ width: '100%', padding: 24, marginTop: 24 }}>
            <h3 className="text-headline-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>timeline</span>
              {isAr ? 'مراحل تتبع الطلب' : 'Live Order Tracking'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {order.timeline?.map((step: any, idx: number) => {
                const isCurrent = step.completed && (idx === order.timeline.length - 1 || !order.timeline[idx + 1]?.completed);
                return (
                  <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: step.completed ? '#2e7d32' : 'var(--surface-container-high)',
                      color: step.completed ? '#fff' : 'var(--outline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: isCurrent ? '0 0 0 4px #c8e6c9' : 'none'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {step.completed ? 'check' : 'radio_button_unchecked'}
                      </span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: step.completed ? 'var(--primary)' : 'var(--outline)' }}>
                        {isAr ? step.labelAr : step.label}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>
                        {isAr ? step.descriptionAr : step.description}
                      </div>
                      {step.timestamp && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: 4 }}>
                          {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(step.timestamp).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 24 }}>
        <Link to="/shop" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
          {isAr ? 'متابعة التسوق' : 'Continue Shopping'}
        </Link>
        <Link to="/account" className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
          {isAr ? 'عرض حسابي وطلباتي' : 'View My Account'}
        </Link>
      </div>
    </div>
  );
}
