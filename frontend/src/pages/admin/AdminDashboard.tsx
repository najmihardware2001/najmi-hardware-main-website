import { useState, useEffect } from 'react';
import { useStore } from '../../StoreContext';
import { Link } from 'react-router-dom';
import { api, type CodAnalytics, type ApiOrder } from '../../services/api';

export default function AdminDashboard() {
  const { state } = useStore();
  const pendingRfqs = state.rfqSubmissions.filter(r => r.status === 'pending');

  const [analytics, setAnalytics] = useState<CodAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([
      api.getCodAnalytics().catch(() => null),
      api.getAdminOrders({ take: 5 }).catch(() => ({ total: 0, items: [] })),
    ]).then(([analyticsData, ordersData]) => {
      if (analyticsData) setAnalytics(analyticsData);
      if (ordersData?.items) setRecentOrders(ordersData.items);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-headline-md" style={{ color: 'var(--primary)', fontWeight: 800 }}>
            Executive Operations & COD Dashboard
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Real-time telemetry and cash collection figures from PostgreSQL.
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchDashboardData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Refresh Stats
        </button>
      </div>

      {/* ── Section 4: COD Financial & Cash Collection Analytics ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 24 }}>payments</span>
          <h2 className="text-headline-sm" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Cash on Delivery (COD) Financial Metrics
          </h2>
        </div>

        {/* Financial Separation Highlights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* Actual Cash Collected (Real Revenue) */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #2e7d32', background: 'linear-gradient(to bottom, #f1f8e9 0%, #fff 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-label-sm" style={{ color: '#2e7d32', textTransform: 'uppercase', fontWeight: 700 }}>
                Actual Cash Collected
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>paid</span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="text-price-display" style={{ color: '#1b5e20', fontSize: '1.8rem', fontWeight: 900 }}>
                  {(analytics?.actualCashCollected || 0).toFixed(3)}
                </span>
                <span className="text-price-unit" style={{ color: '#2e7d32', fontWeight: 800 }}>KWD</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#2e7d32' }}>check_circle</span>
                <span className="text-label-sm" style={{ fontSize: 11, color: '#2e7d32', fontWeight: 600 }}>
                  Confirmed Cash Received ({analytics?.ordersCollected || 0} orders)
                </span>
              </div>
            </div>
          </div>

          {/* Outstanding COD Amounts */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #f57f17', background: 'linear-gradient(to bottom, #fffde7 0%, #fff 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-label-sm" style={{ color: '#f57f17', textTransform: 'uppercase', fontWeight: 700 }}>
                Outstanding COD Amount
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff9c4', color: '#f57f17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pending_actions</span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="text-price-display" style={{ color: '#e65100', fontSize: '1.8rem', fontWeight: 900 }}>
                  {(analytics?.outstandingCodAmount || 0).toFixed(3)}
                </span>
                <span className="text-price-unit" style={{ color: '#e65100', fontWeight: 800 }}>KWD</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f57f17' }}>hourglass_empty</span>
                <span className="text-label-sm" style={{ fontSize: 11, color: '#f57f17', fontWeight: 600 }}>
                  Uncollected Cash in Transit / Pending
                </span>
              </div>
            </div>
          </div>

          {/* Verified Cash Refunds */}
          <div className="kpi-card" style={{ borderLeft: '4px solid #d32f2f', background: 'linear-gradient(to bottom, #ffebee 0%, #fff 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-label-sm" style={{ color: '#c62828', textTransform: 'uppercase', fontWeight: 700 }}>
                Verified COD Refunds
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ffcdd2', color: '#c62828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>currency_exchange</span>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="text-price-display" style={{ color: '#b71c1c', fontSize: '1.8rem', fontWeight: 900 }}>
                  {(analytics?.verifiedRefunds || 0).toFixed(3)}
                </span>
                <span className="text-price-unit" style={{ color: '#c62828', fontWeight: 800 }}>KWD</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c62828' }}>verified</span>
                <span className="text-label-sm" style={{ fontSize: 11, color: '#c62828', fontWeight: 600 }}>
                  Authorized Cash Paybacks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Operational Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
          {/* Total COD Orders */}
          <div className="card" style={{ padding: 14 }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Total COD Orders</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
              {analytics?.totalCodOrders || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>All-time orders placed</span>
          </div>

          {/* Pending COD Orders */}
          <div className="card" style={{ padding: 14 }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Pending COD Orders</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1976d2', marginTop: 4 }}>
              {analytics?.pendingCodOrders || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Pending / Packing</span>
          </div>

          {/* Awaiting Collection */}
          <div className="card" style={{ padding: 14 }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Awaiting Collection</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f57f17', marginTop: 4 }}>
              {analytics?.awaitingCollection || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Delivered but unpaid</span>
          </div>

          {/* COD Orders Collected */}
          <div className="card" style={{ padding: 14 }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Orders Collected</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2e7d32', marginTop: 4 }}>
              {analytics?.ordersCollected || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Confirmed paid</span>
          </div>

          {/* Cancelled COD Orders */}
          <div className="card" style={{ padding: 14 }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Cancelled Orders</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c62828', marginTop: 4 }}>
              {analytics?.cancelledOrders || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Cancelled with reason</span>
          </div>

          {/* Returned COD Orders */}
          <div className="card" style={{ padding: 14 }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Returned Orders</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7b1fa2', marginTop: 4 }}>
              {analytics?.returnedOrders || 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Physical goods returned</span>
          </div>
        </div>
      </div>

      {/* Discrepancy Alert Banner if discrepancies exist */}
      {(analytics?.discrepancyCount || 0) > 0 && (
        <div style={{
          background: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#e65100'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>warning</span>
            <div>
              <strong>Audit Warning:</strong> {analytics?.discrepancyCount} Cash on Delivery collections have discrepancy variances flagged.
            </div>
          </div>
          <Link to="/admin/orders" className="btn btn-sm btn-outline" style={{ borderColor: '#e65100', color: '#e65100' }}>
            Review Discrepancies
          </Link>
        </div>
      )}

      {/* ── Recent COD Orders & Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Recent COD Orders */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Recent COD Orders</h3>
            <Link to="/admin/orders" className="text-label-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              View All ({analytics?.totalCodOrders || 0}) →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>No orders placed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentOrders.map(order => (
                <div key={order.id} style={{
                  padding: 12,
                  background: 'var(--surface-container-low)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{order.orderNumber}</span>
                      <span className="badge" style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        background: order.paymentStatus === 'COLLECTED' ? '#e8f5e9' : '#fff3e0',
                        color: order.paymentStatus === 'COLLECTED' ? '#2e7d32' : '#e65100'
                      }}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: 4 }}>{order.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{order.deliveryAddress?.area}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{Number(order.grandTotal).toFixed(3)} KWD</div>
                    <span className="badge" style={{ fontSize: '0.7rem', marginTop: 4, display: 'inline-block' }}>{order.orderStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wholesale RFQs & Urgent Actions */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Wholesale RFQ Pipeline</h3>
            <Link to="/admin/rfqs" className="text-label-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              View RFQs ({pendingRfqs.length}) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, background: 'var(--pale-blue-grey)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-label-sm" style={{ color: 'var(--charcoal-slate)', fontWeight: 600 }}>Active Enquiries</span>
                <span style={{ fontWeight: 700 }}>{pendingRfqs.length} Pending</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-slate)', marginTop: 4 }}>
                B2B wholesale proforma quotes awaiting review and manager dispatch.
              </div>
              <Link to="/admin/rfqs" className="btn btn-primary btn-sm" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span> Process RFQs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
