const router = require('express').Router();
const db = require('../db');
const { fail } = require('../services/commerce-quote');

// ── COD Analytics Endpoint ──
// GET /api/admin/orders/cod-analytics
router.get('/orders/cod-analytics', async (req, res) => {
  // Query live figures from orders and cash_transactions
  const orders = (await db.query(`
    SELECT id, order_number, status, total_amount, payment_method,
      (SELECT SUM(amount) FROM cash_transactions ct WHERE ct.order_id = orders.id AND ct.kind = 'COLLECTION') as collected,
      (SELECT SUM(amount) FROM cash_transactions ct WHERE ct.order_id = orders.id AND ct.kind = 'REFUND') as refunded
    FROM orders
    WHERE payment_method = 'COD'
  `)).rows;

  let totalCodOrders = orders.length;
  let pendingCodOrders = 0;
  let awaitingCollection = 0;
  let ordersCollected = 0;
  let actualCashCollected = 0;
  let outstandingCodAmount = 0;
  let cancelledOrders = 0;
  let returnedOrders = 0;
  let verifiedRefunds = 0;
  let discrepancyCount = 0;

  for (const o of orders) {
    const total = Number(o.total_amount || 0);
    const collected = Number(o.collected || 0);
    const refunded = Number(o.refunded || 0);

    actualCashCollected += collected;
    verifiedRefunds += refunded;

    if (o.status === 'CANCELLED') {
      cancelledOrders++;
    } else if (o.status === 'RETURNED') {
      returnedOrders++;
    } else if (o.status === 'PENDING_CONFIRMATION' || o.status === 'CONFIRMED' || o.status === 'PROCESSING') {
      pendingCodOrders++;
      outstandingCodAmount += total;
    } else if (o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED') {
      if (collected >= total && total > 0) {
        ordersCollected++;
      } else {
        awaitingCollection++;
        outstandingCodAmount += Math.max(0, total - collected);
      }
    }

    if (collected > 0 && Math.abs(collected - total) > 0.001 && o.status === 'DELIVERED') {
      discrepancyCount++;
    }
  }

  res.json({
    totalCodOrders,
    pendingCodOrders,
    awaitingCollection,
    ordersCollected,
    actualCashCollected: Number(actualCashCollected.toFixed(3)),
    outstandingCodAmount: Number(outstandingCodAmount.toFixed(3)),
    cancelledOrders,
    returnedOrders,
    verifiedRefunds: Number(verifiedRefunds.toFixed(3)),
    discrepancyCount
  });
});

// ── COD Settings (Admin) ──
// GET /api/admin/settings/cod
router.get('/settings/cod', async (req, res) => {
  const row = (await db.query("SELECT value FROM store_settings WHERE key = 'cod'")).rows[0];
  const defaults = {
    enabled: true,
    allowedAreas: ['Shuwaikh', 'Al-Rai', 'Sharq', 'Salmiya', 'Hawally', 'Farwaniya', 'Ahmadi', 'Jahra', 'Subhan', 'Fahaheel'],
    minOrderAmount: null,
    maxOrderAmount: null,
    handlingFee: null,
    standardDeliveryFee: 2.500,
    instructionsEn: 'Cash on Delivery is available across all Kuwait areas. Payment is collected in cash upon order handover.',
    instructionsAr: 'خدمة الدفع عند الاستلام متاحة لجميع مناطق الكويت. يتم تحصيل المبلغ نقداً عند تسليم الطلب.',
    internalOrderConfirmation: true,
    deliveryPricingApproved: true,
    isTestMode: false,
    sampleNoticeEn: 'Standard Kuwait delivery fee: 2.500 KWD (free delivery above 50.000 KWD)',
    sampleNoticeAr: 'رسوم التوصيل القياسية لجميع مناطق الكويت: 2.500 د.ك (توصيل مجاني للطلبات فوق 50.000 د.ك)'
  };
  res.json(row?.value || defaults);
});

// PUT /api/admin/settings/cod
router.put('/settings/cod', async (req, res) => {
  const settings = req.body;
  await db.query(`
    INSERT INTO store_settings (key, value, updated_at)
    VALUES ('cod', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
  `, [JSON.stringify(settings)]);

  res.json({
    success: true,
    message: 'COD settings updated successfully',
    settings
  });
});

// ── Customer CRM Endpoints ──
// POST /api/admin/customers/:id/notes
router.post('/customers/:id/notes', async (req, res) => {
  const custId = Number(req.params.id) || 0;
  const { note } = req.body;
  if (!note) fail('Note content required');

  await db.query(`
    INSERT INTO admin_audit_log (admin_id, action, entity_id, details)
    VALUES ($1, 'CUSTOMER_NOTE_ADDED', $2, $3)
  `, [req.admin?.id || null, String(custId), JSON.stringify({ note })]);

  res.json({ success: true, message: 'Note added to customer record' });
});

// PATCH /api/admin/customers/:id/status
router.patch('/customers/:id/status', async (req, res) => {
  const custId = Number(req.params.id) || 0;
  const { status } = req.body;

  const updateRes = await db.query(`
    UPDATE customers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, status
  `, [status || 'ACTIVE', custId]);

  if (!updateRes.rows.length) fail('Customer not found', 404);
  res.json({ success: true, customer: updateRes.rows[0] });
});

module.exports = router;
