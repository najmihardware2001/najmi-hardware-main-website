const router = require('express').Router();
const db = require('../db');
const crypto = require('crypto');
const { fail } = require('../services/commerce-quote');
const PDFDocument = require('pdfkit');

// ── Public RFQ Endpoints ──

// POST /api/rfq/submit
router.post('/rfq/submit', async (req, res) => {
  const {
    companyName, contactPerson, contactName, email, phone,
    deliveryLocation, requiredDate, notes, items, lines
  } = req.body;

  const contact = contactPerson || contactName || 'Wholesale Buyer';
  if (!phone && !email) fail('Contact phone or email is required');

  const rfqItems = items || lines || [];
  if (!Array.isArray(rfqItems) || rfqItems.length === 0) {
    fail('At least one item is required in the RFQ');
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Generate unique RFQ number: RFQ-2026-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const rfqNumber = `RFQ-2026-${randomSuffix}`;
    const accessKey = crypto.randomUUID();

    const insertRfqQuery = `
      INSERT INTO rfqs (
        rfq_number, access_key, company_name, contact_person, email, phone,
        delivery_location, notes, customer_name,customer_email,customer_phone,status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$4,$5,$6, 'SUBMITTED', NOW(), NOW())
      RETURNING *;
    `;
    const rfqRes = await client.query(insertRfqQuery, [
      rfqNumber,
      accessKey,
      companyName || 'Establishment / Contracting',
      contact,
      email || '',
      phone || '',
      deliveryLocation || 'Shuwaikh Industrial',
      notes || ''
    ]);
    const rfq = rfqRes.rows[0];

    // Insert items
    for (const item of rfqItems) {
      await client.query(`
        INSERT INTO rfq_items (
          rfq_id, product_name, sku, quantity, target_unit_price, notes
        ) VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        rfq.id,
        item.productName || item.name || 'Industrial Product',
        item.sku || '',
        Number(item.quantity || item.qty || 1),
        item.targetUnitPrice ? Number(item.targetUnitPrice) : null,
        item.notes || item.specs || ''
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Wholesale RFQ submitted successfully',
      messageAr: 'تم تقديم طلب عرض السعر بالجملة بنجاح',
      rfqNumber: rfq.rfq_number,
      accessKey: rfq.access_key,
      rfq
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// GET /api/rfq/view/:rfqNumber
router.get('/rfq/view/:rfqNumber', async (req, res) => {
  const { rfqNumber } = req.params;
  const accessKey = req.query.accessKey;

  const rfqRes = await db.query('SELECT * FROM rfqs WHERE rfq_number = $1', [rfqNumber]);
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  const rfq = rfqRes.rows[0];

  const providedKey = req.query.accessKey || req.query.key || req.headers['x-access-key'];
  if (!providedKey || rfq.access_key !== providedKey) {
    fail('Unauthorized: A valid access key is required to view this quotation.', 403);
  }

  const itemsRes = await db.query('SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id ASC', [rfq.id]);
  const quotesRes = await db.query(`
    SELECT q.*, 
      (SELECT json_agg(ql.*) FROM quotation_lines ql WHERE ql.quotation_id = q.id) as lines
    FROM quotations q 
    WHERE q.rfq_id = $1 
    ORDER BY q.id DESC
  `, [rfq.id]);

  const quotations=quotesRes.rows.map(q=>({...q,quotationNumber:q.quote_number,createdAt:q.created_at,validUntil:q.valid_until,deliveryFee:Number(q.delivery_fee||0),grandTotal:Number(q.total_amount),discountTotal:0,termsEn:q.payment_terms,lines:(q.lines||[]).map(l=>({...l,productNameEn:l.product_name||l.description,unitPrice:Number(l.unit_price),lineTotal:Number(l.total_price)}))}));
  const safeRfq={rfq_number:rfq.rfq_number,company_name:rfq.company_name,customer_name:rfq.customer_name,customer_phone:rfq.customer_phone,customer_email:rfq.customer_email,status:rfq.status,created_at:rfq.created_at,items:itemsRes.rows,quotations:quotesRes.rows};
  res.json({success:true,rfqNumber:rfq.rfq_number,createdAt:rfq.created_at,companyName:rfq.company_name,contactPerson:rfq.contact_person||rfq.customer_name,status:quotations[0]?.status==='ACCEPTED'||quotations[0]?.status==='REJECTED'?quotations[0].status:rfq.status,area:rfq.delivery_location,quotations,rfq:safeRfq});
});

// POST /api/rfq/:rfqNumber/respond
router.post('/rfq/:rfqNumber/respond', async (req, res) => {
  const { rfqNumber } = req.params;
  const { action, feedback } = req.body;

  const rfqRes = await db.query('SELECT * FROM rfqs WHERE rfq_number = $1', [rfqNumber]);
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  const rfq = rfqRes.rows[0];

  const providedKey = req.query.accessKey || req.query.key || req.headers['x-access-key'];
  if (!providedKey || rfq.access_key !== providedKey) {
    fail('Unauthorized: A valid access key is required to respond to this quotation.', 403);
  }

  if(!['ACCEPT','REJECT'].includes(action))fail('Invalid quotation response');
  const latest=(await db.query('SELECT id,status,valid_until FROM quotations WHERE rfq_id=$1 ORDER BY id DESC LIMIT 1',[rfq.id])).rows[0];
  if(!latest||latest.status!=='SENT'||latest.valid_until&&new Date(latest.valid_until)<new Date())fail('No current quotation awaiting response',409);
  const newStatus = (action === 'ACCEPT') ? 'ACCEPTED' : 'REJECTED';
  await db.query(`
    UPDATE quotations 
    SET status = $1, client_feedback = $2, updated_at = NOW() 
    WHERE id = $3 AND status='SENT'
  `, [newStatus, String(feedback || '').slice(0,2000), latest.id]);

  // Customer acceptance changes the quotation, never enables a purchase or bypasses stock review.

  res.json({
    success: true,
    message: `Quotation ${newStatus.toLowerCase()} successfully`,
    status: newStatus
  });
});

// GET /api/rfq/view/:rfqNumber/pdf - Secure guest customer quotation PDF download
router.get('/rfq/view/:rfqNumber/pdf', async (req, res) => {
  const { rfqNumber } = req.params;
  const providedKey = req.query.accessKey || req.query.key || req.headers['x-access-key'];

  const rfqRes = await db.query('SELECT * FROM rfqs WHERE rfq_number = $1', [rfqNumber]);
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  const rfq = rfqRes.rows[0];

  if (!providedKey || rfq.access_key !== providedKey) {
    fail('Unauthorized: A valid access key is required to download this quotation PDF.', 403);
  }

  const quoteRes = await db.query('SELECT * FROM quotations WHERE rfq_id = $1 ORDER BY id DESC LIMIT 1', [rfq.id]);
  if (!quoteRes.rows.length) fail('Quotation not yet generated for this RFQ', 404);
  const quote = quoteRes.rows[0];

  const lines = (await db.query('SELECT * FROM quotation_lines WHERE quotation_id = $1 ORDER BY id ASC', [quote.id])).rows;

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="NAJMI-QUOTE-${quote.quote_number}.pdf"`);
  doc.pipe(res);

  doc.rect(40, 40, 515, 65).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(18).text('NAJMI HARDWARE EST.', 55, 52, { bold: true });
  doc.fontSize(9).fillColor('#94a3b8').text('Industrial Wire Ropes, Rigging Hardware & Marine Supplies', 55, 74);
  doc.fontSize(8).fillColor('#cbd5e1').text('Kuwait | Personalized quotation from Najmi Hardware', 55, 87);

  doc.moveDown(3);
  doc.fillColor('#0f172a').fontSize(16).text('COMMERCIAL QUOTATION / عرض سعر رسمي', 40, 120);

  doc.fontSize(9).fillColor('#475569');
  doc.text(`Quotation #: ${quote.quote_number}`, 40, 145);
  doc.text(`RFQ Reference: ${rfq.rfq_number}`, 40, 158);
  doc.text(`Date Issued: ${new Date(quote.created_at).toLocaleDateString('en-GB')}`, 40, 171);

  doc.text(`Client: ${rfq.company_name}`, 320, 145);
  doc.text(`Contact: ${rfq.contact_person}`, 320, 158);
  doc.text(`Phone: ${rfq.phone}`, 320, 171);

  const tableTop = 205;
  doc.rect(40, tableTop, 515, 22).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(9);
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Description / Specifications', 75, tableTop + 6, { width: 220 });
  doc.text('Qty', 380, tableTop + 6, { width: 35, align: 'right' });
  doc.text('Unit Price', 425, tableTop + 6, { width: 55, align: 'right' });
  doc.text('Total (KWD)', 485, tableTop + 6, { width: 65, align: 'right' });

  let curY = tableTop + 24;
  lines.forEach((line, i) => {
    doc.fillColor('#1e293b').fontSize(8);
    doc.text(String(i + 1), 45, curY, { width: 25 });
    doc.text(line.description || line.product_name, 75, curY, { width: 220 });
    doc.text(String(line.quantity), 380, curY, { width: 35, align: 'right' });
    doc.text(Number(line.unit_price).toFixed(3), 425, curY, { width: 55, align: 'right' });
    doc.text(Number(line.total_price || line.line_total || (line.quantity * line.unit_price)).toFixed(3), 485, curY, { width: 65, align: 'right' });
    curY += Math.max(22,doc.heightOfString(line.description||line.product_name,{width:220})+8);
  });

  doc.rect(40, curY + 10, 515, 1).fill('#cbd5e1');
  doc.fillColor('#0f172a').fontSize(10).text(`Total Amount: ${Number(quote.total_amount).toFixed(3)} KWD`, 350, curY + 20, { bold: true, align: 'right' });

  doc.end();
});

module.exports = router;
