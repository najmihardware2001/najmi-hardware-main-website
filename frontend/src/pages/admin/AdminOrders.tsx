import { useState, useEffect } from 'react';
import { useStore } from '../../StoreContext';
import { useAuth } from '../../AuthContext';
import { api, type ApiOrder } from '../../services/api';

export default function AdminOrders() {
  const { showToast } = useStore();
  const { user } = useAuth();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [collectionModalOrder, setCollectionModalOrder] = useState<ApiOrder | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<string>('');
  const [collectionStaff, setCollectionStaff] = useState<string>(user?.fullName || 'Najmi Cashier');
  const [collectionNotes, setCollectionNotes] = useState<string>('');

  const [cancelModalOrder, setCancelModalOrder] = useState<ApiOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [refundModalOrder, setRefundModalOrder] = useState<ApiOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundStaff, setRefundStaff] = useState<string>(user?.fullName || 'Najmi Manager');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    api.getAdminOrders({
      orderStatus: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      paymentStatus: selectedPaymentStatus !== 'ALL' ? selectedPaymentStatus : undefined,
      search: search.trim() || undefined,
    })
      .then(res => {
        setOrders(res.items);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching admin orders:', err);
        showToast(`Failed to load orders: ${err.message}`, 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedPaymentStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Status transitions
  const handleUpdateStatus = async (orderId: string, status: string, reason?: string) => {
    setActionLoading(true);
    try {
      await api.updateOrderStatus(orderId, status, reason);
      showToast(`Order status updated to ${status}`, 'check_circle');
      fetchOrders();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Cash Collection Modal
  const openCollectionModal = (order: ApiOrder) => {
    setCollectionModalOrder(order);
    setCollectionAmount(order.grandTotal.toFixed(3));
    setCollectionStaff(user?.fullName || 'Authorized Staff');
    setCollectionNotes('');
  };

  // Submit Cash Collection
  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionModalOrder) return;

    const amt = parseFloat(collectionAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid collection amount', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.recordCashCollection(
        collectionModalOrder.id,
        amt,
        collectionStaff,
        collectionNotes
      );

      if (res.hasDiscrepancy) {
        showToast(`Discrepancy Flagged: ${res.message}`, 'warning');
      } else {
        showToast('Cash collection recorded successfully!', 'check_circle');
      }

      setCollectionModalOrder(null);
      fetchOrders();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Order Cancellation
  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      await api.cancelOrder(cancelModalOrder.id, cancelReason);
      showToast('Order cancelled successfully', 'info');
      setCancelModalOrder(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Manual Cash Refund
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder || !refundReason.trim()) {
      showToast('Please provide a refund reason', 'warning');
      return;
    }

    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid refund amount', 'warning');
      return;
    }

    if (amt > refundModalOrder.collectedAmount) {
      showToast(`Refund amount cannot exceed verified collected cash (${refundModalOrder.collectedAmount.toFixed(3)} KWD)`, 'error');
      return;
    }

    setActionLoading(true);
    try {
      await api.processCashRefund(refundModalOrder.id, amt, refundReason, refundStaff);
      showToast('Manual cash refund recorded successfully', 'check_circle');
      setRefundModalOrder(null);
      setRefundAmount('');
      setRefundReason('');
      fetchOrders();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
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
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>receipt_long</span>
          </div>
          <div>
            <h1 className="text-headline-md" style={{ color: 'var(--primary)', fontWeight: 800 }}>
              Cash on Delivery (COD) Orders
            </h1>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Manage retail COD orders, courier dispatches, and authorized cash collections.
            </p>
          </div>
        </div>

        <button className="btn btn-outline" onClick={fetchOrders} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Refresh Orders
        </button>
      </div>

      {/* Critical Business Notice Banner */}
      <div style={{
        background: '#fff8e1',
        border: '1px solid #ffe082',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#f57f17',
        fontSize: '0.875rem'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified</span>
        <div>
          <strong>Strict Separation Rule:</strong> Delivery status and Cash Collection are completely independent. Marking an order delivered does <em>not</em> mark it paid. Payment is only recorded when cash receipt is confirmed.
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Order Status Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING_CONFIRMATION', label: 'Pending Confirmation' },
              { id: 'CONFIRMED', label: 'Confirmed' },
              { id: 'PROCESSING', label: 'Processing' },
              { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
              { id: 'DELIVERED', label: 'Delivered' },
              { id: 'CANCELLED', label: 'Cancelled' },
              { id: 'RETURNED', label: 'Returned' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`btn btn-sm ${selectedStatus === tab.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => setSelectedStatus(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Payment:</label>
            <select
              className="input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
              value={selectedPaymentStatus}
              onChange={e => setSelectedPaymentStatus(e.target.value)}
            >
              <option value="ALL">All Payments</option>
              <option value="PENDING_COLLECTION">Pending Cash Collection</option>
              <option value="COLLECTED">Cash Collected</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="input"
            placeholder="Search by order number (ORD-...), customer name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
          </button>
        </form>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, animation: 'spin 1s linear infinite' }}>hourglass_top</span>
          <div style={{ marginTop: 8 }}>Loading PostgreSQL orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>inbox</span>
          <h3 style={{ marginTop: 12, fontSize: '1.1rem', fontWeight: 600 }}>No orders found</h3>
          <p style={{ marginTop: 4, fontSize: '0.9rem' }}>No COD orders match the current filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => {
            const isDelivered = order.orderStatus === 'DELIVERED';
            const isCollected = order.paymentStatus === 'COLLECTED';
            const isCancelled = order.orderStatus === 'CANCELLED';

            return (
              <div key={order.id} className="card" style={{
                padding: 20,
                borderLeft: order.discrepancyFlag
                  ? '5px solid #ff9800'
                  : isCollected
                  ? '5px solid #2e7d32'
                  : '5px solid var(--primary)'
              }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {order.orderNumber}
                      </span>

                      {/* Order Status Badge */}
                      <span className="badge" style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        background: isDelivered ? '#e8f5e9' : isCancelled ? '#ffebee' : 'var(--surface-container-high)',
                        color: isDelivered ? '#2e7d32' : isCancelled ? '#c62828' : 'var(--primary)',
                        textTransform: 'uppercase'
                      }}>
                        {order.orderStatus}
                      </span>

                      {/* Payment Status Badge */}
                      <span className="badge" style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        background: isCollected ? '#e8f5e9' : '#fff3e0',
                        color: isCollected ? '#2e7d32' : '#e65100',
                        textTransform: 'uppercase'
                      }}>
                        {isCollected ? '● CASH COLLECTED' : '○ PENDING COLLECTION'}
                      </span>
                    </div>

                    <h3 className="text-body-lg" style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 6 }}>
                      {order.customerName}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                      📞 {order.customerPhone} {order.customerEmail && `• ✉️ ${order.customerEmail}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {Number(order.grandTotal).toFixed(3)}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>KWD</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--outline)', display: 'block', marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Discrepancy Alert */}
                {order.discrepancyFlag && (
                  <div style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: '#fff3e0',
                    border: '1px solid #ffe082',
                    borderRadius: 8,
                    color: '#e65100',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span className="material-symbols-outlined">warning</span>
                    <span>
                      <strong>Cash Discrepancy Flagged:</strong> {order.discrepancyNote || 'Collected amount does not match order total.'}
                    </span>
                  </div>
                )}

                {/* Cancellation Alert */}
                {isCancelled && order.cancellationReason && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: '#ffebee',
                    border: '1px solid #ffcdd2',
                    borderRadius: 6,
                    color: '#c62828',
                    fontSize: '0.85rem'
                  }}>
                    <strong>Cancelled:</strong> {order.cancellationReason}
                  </div>
                )}

                {/* Address Info */}
                {order.deliveryAddress && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-container-low)', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      📍 Kuwait Delivery: {order.deliveryAddress.area}, {order.deliveryAddress.block}, {order.deliveryAddress.street}, {order.deliveryAddress.building}
                    </div>
                    {order.deliveryAddress.notes && (
                      <div style={{ color: 'var(--on-surface-variant)', fontStyle: 'italic', marginTop: 2 }}>
                        Courier note: "{order.deliveryAddress.notes}"
                      </div>
                    )}
                  </div>
                )}

                {/* Items Summary */}
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface-container)', borderRadius: 6 }}>
                  {order.lines.map((line, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 2 }}>
                      <span><strong>{line.quantity}x</strong> {line.productName} ({line.sku})</span>
                      <span>{Number(line.subtotal).toFixed(3)} KWD</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--outline)', marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 4 }}>
                    <span>Subtotal: {Number(order.subtotal).toFixed(3)} KWD • Delivery: {Number(order.deliveryFee).toFixed(3)} KWD</span>
                    <span>Method: {order.deliveryMethod} • Pay: COD</span>
                  </div>
                </div>

                {/* Cash Collection Record Summary if collected */}
                {isCollected && (
                  <div style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    background: '#e8f5e9',
                    borderRadius: 6,
                    color: '#1b5e20',
                    fontSize: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      ✓ Cash Collected: <strong>{Number(order.collectedAmount).toFixed(3)} KWD</strong>
                      {order.collections && order.collections.length > 0 && ` by ${order.collections[0].staffName}`}
                    </span>
                    {order.collections && order.collections.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#2e7d32' }}>
                        {new Date(order.collections[0].collectedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                {!isCancelled && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--surface-container)' }}>
                    {/* Status Step Transitions */}
                    {order.orderStatus === 'PENDING_CONFIRMATION' && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> Confirm Order
                      </button>
                    )}

                    {order.orderStatus === 'CONFIRMED' && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>package_2</span> Start Processing
                      </button>
                    )}

                    {order.orderStatus === 'PROCESSING' && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_shipping</span> Out for Delivery
                      </button>
                    )}

                    {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                      <button
                        className="btn btn-signal btn-sm"
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>done_all</span> Mark Delivered (Courier)
                      </button>
                    )}

                    {/* Independent Cash Collection Button */}
                    {!isCollected && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                        disabled={actionLoading}
                        onClick={() => openCollectionModal(order)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>payments</span>
                        Record Cash Collection
                      </button>
                    )}

                    {/* Manual Cash Refund (Only when collected) */}
                    {isCollected && order.orderStatus !== 'RETURNED' && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ borderColor: '#d32f2f', color: '#d32f2f' }}
                        disabled={actionLoading}
                        onClick={() => {
                          setRefundModalOrder(order);
                          setRefundAmount(order.collectedAmount.toFixed(3));
                          setRefundReason('');
                          setRefundStaff(user?.fullName || 'Najmi Manager');
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>currency_exchange</span>
                        Manual Cash Refund
                      </button>
                    )}

                    {/* Cancellation Button */}
                    {!isDelivered && !isCollected && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                        disabled={actionLoading}
                        onClick={() => {
                          setCancelModalOrder(order);
                          setCancelReason('');
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span> Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Record Cash Collection ── */}
      {collectionModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#2e7d32', fontSize: 28 }}>payments</span>
                <h3 className="text-headline-sm">Record Cash Collection</h3>
              </div>
              <button className="btn btn-ghost" onClick={() => setCollectionModalOrder(null)}>✕</button>
            </div>

            <div style={{ background: 'var(--surface-container-low)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
              <div>Order: <strong>{collectionModalOrder.orderNumber}</strong></div>
              <div>Customer: <strong>{collectionModalOrder.customerName}</strong></div>
              <div>Expected Total: <strong>{collectionModalOrder.grandTotal.toFixed(3)} KWD</strong></div>
            </div>

            <form onSubmit={handleRecordCollection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Actual Cash Amount Collected (KWD) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="input"
                  value={collectionAmount}
                  onChange={e => setCollectionAmount(e.target.value)}
                  required
                />
                {Math.abs(parseFloat(collectionAmount || '0') - collectionModalOrder.grandTotal) > 0.001 && (
                  <span style={{ fontSize: '0.75rem', color: '#e65100', marginTop: 4, display: 'block' }}>
                    ⚠️ Variance detected: Differs from order amount by {(parseFloat(collectionAmount || '0') - collectionModalOrder.grandTotal).toFixed(3)} KWD. Will be flagged for manager review.
                  </span>
                )}
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Authorized Staff Member *
                </label>
                <input
                  type="text"
                  className="input"
                  value={collectionStaff}
                  onChange={e => setCollectionStaff(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Reference / Courier Receipt Notes
                </label>
                <textarea
                  className="input"
                  rows={2}
                  style={{ height: 'auto', paddingTop: 8 }}
                  placeholder="e.g. Received by Courier Ahmed, cash drawer receipt #..."
                  value={collectionNotes}
                  onChange={e => setCollectionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCollectionModalOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#2e7d32' }} disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Cancel Order ── */}
      {cancelModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24 }}>
            <h3 className="text-headline-sm" style={{ color: 'var(--error)', marginBottom: 12 }}>
              Cancel Order {cancelModalOrder.orderNumber}
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Please provide a valid cancellation reason for auditing purposes.
            </p>

            <form onSubmit={handleCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Cancellation Reason *
                </label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ height: 'auto', paddingTop: 8 }}
                  placeholder="e.g. Customer requested cancellation, out of delivery zone, wrong item..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCancelModalOrder(null)}>
                  Keep Order
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--error)' }} disabled={actionLoading}>
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Manual Cash Refund ── */}
      {refundModalOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 460, width: '100%', padding: 24 }}>
            <h3 className="text-headline-sm" style={{ color: '#d32f2f', marginBottom: 8 }}>
              Process Manual COD Refund
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Order {refundModalOrder.orderNumber} • Verified Collected Cash: <strong>{refundModalOrder.collectedAmount.toFixed(3)} KWD</strong>
            </p>

            <form onSubmit={handleProcessRefund} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Refund Amount (KWD, Max: {refundModalOrder.collectedAmount.toFixed(3)}) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  max={refundModalOrder.collectedAmount}
                  className="input"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Refund Reason *
                </label>
                <textarea
                  className="input"
                  rows={2}
                  style={{ height: 'auto', paddingTop: 8 }}
                  placeholder="e.g. Return of damaged coil, approved by showroom manager..."
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-label-sm" style={{ display: 'block', marginBottom: 4 }}>
                  Authorized Staff Member *
                </label>
                <input
                  type="text"
                  className="input"
                  value={refundStaff}
                  onChange={e => setRefundStaff(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRefundModalOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#d32f2f' }} disabled={actionLoading}>
                  Authorize Cash Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
