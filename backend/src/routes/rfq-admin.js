const router = require('express').Router();
const db = require('../db');
const { fail } = require('../services/commerce-quote');
const PDFDocument = require('pdfkit');
const quoteView=q=>({...q,id:String(q.id),quotationNumber:q.quote_number,revisionNumber:1,grandTotal:Number(q.total_amount),validDays:q.validity_days||30,validUntil:q.valid_until,createdAt:q.created_at,deliveryFee:Number(q.delivery_fee||0),paymentTerms:q.payment_terms||'Cash on Delivery',discountTotal:0,lines:(q.lines||[]).map(l=>({...l,productNameEn:l.product_name||l.description,specDetails:l.description,unitPrice:Number(l.unit_price),lineTotal:Number(l.total_price??l.line_total)}))});

// ── Admin RFQ Management Endpoints ──

router.get('/rfq/staff',async(req,res)=>res.json((await db.query("SELECT id,name FROM admin_users WHERE status='ACTIVE' ORDER BY name")).rows));

// GET /api/admin/rfq
router.get('/rfq', async (req, res) => {
  const { status, search, offset = 0, limit = 20 } = req.query;
  let whereClauses = [];
  let params = [];

  if (status) {
    params.push(status);
    whereClauses.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(rfq_number ILIKE $${params.length} OR company_name ILIKE $${params.length} OR contact_person ILIKE $${params.length} OR phone ILIKE $${params.length})`);
  }

  const whereStr = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const total = Number((await db.query(`SELECT count(*) FROM rfqs ${whereStr}`, params)).rows[0].count);

  params.push(Number(limit), Number(offset));
  const rfqs = (await db.query(`
    SELECT r.*,
      (SELECT json_build_object('id',a.id::text,'fullName',a.name,'email',a.email) FROM admin_users a WHERE a.id=r.assigned_staff_id) AS assigned_to,
      (SELECT count(*) FROM rfq_items ri WHERE ri.rfq_id = r.id) as item_count,
      (SELECT json_agg(q.*) FROM quotations q WHERE q.rfq_id = r.id) as quotations
    FROM rfqs r
    ${whereStr}
    ORDER BY r.id DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params)).rows;

  res.json({
    total,
    rfqs: rfqs.map(r => ({
      id: String(r.id),
      rfqNumber: r.rfq_number,
      accessKey: r.access_key,
      companyName: r.company_name,
      contactPerson: r.contact_person||r.customer_name,
      contactName: r.contact_person||r.customer_name,
      email: r.email||r.customer_email,
      phone: r.phone||r.customer_phone,
      deliveryLocation: r.delivery_location,
      status: r.status,
      notes: r.notes,
      assignedStaffId: r.assigned_staff_id,
      internalNotes: r.internal_notes,
      createdAt: r.created_at,
      itemCount: Number(r.item_count || 0),
      itemsCount: Number(r.item_count || 0),
      area:r.delivery_location,
      assignedTo:r.assigned_to,
      latestQuotation:r.quotations?.length?quoteView(r.quotations.sort((a,b)=>b.id-a.id)[0]):null,
      quotations: (r.quotations || []).map(quoteView)
    }))
  });
});

// GET /api/admin/rfq/:id
router.get('/rfq/:id', async (req, res) => {
  const rfqRes = await db.query('SELECT * FROM rfqs WHERE id = $1', [Number(req.params.id) || 0]);
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  const rfq = rfqRes.rows[0];

  const items = (await db.query('SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id ASC', [rfq.id])).rows;
  const quotations = (await db.query(`
    SELECT q.*, 
      (SELECT json_agg(ql.*) FROM quotation_lines ql WHERE ql.quotation_id = q.id) as lines
    FROM quotations q 
    WHERE q.rfq_id = $1 
    ORDER BY q.id DESC
  `, [rfq.id])).rows;

  res.json({
    id: String(rfq.id),
    rfqNumber: rfq.rfq_number,
    accessKey: rfq.access_key,
    companyName: rfq.company_name,
    contactPerson: rfq.contact_person||rfq.customer_name,
    contactName: rfq.contact_person||rfq.customer_name,
    email: rfq.email||rfq.customer_email,
    phone: rfq.phone||rfq.customer_phone,
    deliveryLocation: rfq.delivery_location,
    status: rfq.status,
    notes: rfq.notes,
    assignedStaffId: rfq.assigned_staff_id,
    assignedTo:rfq.assigned_staff_id?(await db.query('SELECT id::text id,name AS "fullName",email FROM admin_users WHERE id=$1',[rfq.assigned_staff_id])).rows[0]:null,
    area:rfq.delivery_location,
    projectDescription:rfq.notes,
    internalNotes: rfq.internal_notes,
    createdAt: rfq.created_at,
    lines: items.map(i => ({
      id: String(i.id),
      productNameEn: i.product_name||i.custom_description,
      sku: i.sku,
      quantity: Number(i.quantity),
      unit:i.unit,
      customSpecs:(()=>{try{return JSON.parse(i.notes||'{}')}catch{return {notes:i.notes}}})(),
      notes: i.notes
    })),
    quotations:quotations.map(quoteView)
  });
});

// PATCH /api/admin/rfq/:id/assign
router.patch('/rfq/:id/assign', async (req, res) => {
  const { staffId } = req.body;
  const rfqRes = await db.query(
    'UPDATE rfqs SET assigned_staff_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [staffId || null, Number(req.params.id) || 0]
  );
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  res.json({ success: true, rfq: rfqRes.rows[0] });
});

// POST /api/admin/rfq/:id/notes
router.post('/rfq/:id/notes', async (req, res) => {
  const { internalNotes } = req.body;
  const rfqRes = await db.query(
    'UPDATE rfqs SET internal_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [internalNotes, Number(req.params.id) || 0]
  );
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  res.json({ success: true, rfq: rfqRes.rows[0] });
});

// POST /api/admin/rfq/:id/quote
router.post('/rfq/:id/quote', async (req, res) => {
  const rfqId = Number(req.params.id) || 0;
  const { items, lines, deliveryFee = 0, paymentTerms } = req.body;
  const validityDays=Number(req.body.validityDays??req.body.validDays??30),notes=String(req.body.notes??req.body.termsEn??'').slice(0,4000);
  if(!Number.isInteger(validityDays)||validityDays<1||validityDays>365)fail('Quotation validity must be 1 to 365 days');

  const quoteLines = items || lines || [];
  if (!Array.isArray(quoteLines) || !quoteLines.length) {
    fail('Quotation requires at least one line item');
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const rfqRes = await client.query('SELECT * FROM rfqs WHERE id = $1 FOR UPDATE', [rfqId]);
    if (!rfqRes.rows.length) fail('RFQ not found', 404);
    const rfq = rfqRes.rows[0];

    // Calculate subtotal
    let subtotal = 0;
    const validatedLines = quoteLines.map((line, idx) => {
      const qty = Number(line.quantity ?? line.qty);
      const suppliedPrice=line.unitPrice??line.price;
      if(suppliedPrice==null||suppliedPrice==='')fail('Staff must enter a personalized quotation price');
      const unitPrice = Number(suppliedPrice);
      if(!Number.isFinite(qty)||qty<=0||!Number.isFinite(unitPrice)||unitPrice<=0||!/^\d+(\.\d{1,3})?$/.test(String(suppliedPrice)))fail('Enter positive quantities and a three-decimal KWD quotation price');
      const lineTotal = Number((qty * unitPrice).toFixed(3));
      subtotal += lineTotal;
      return {
        productName: line.productNameEn || line.productName || line.name || `Item ${idx + 1}`,
        sku: line.sku || '',
        description: String(line.specDetails||'').slice(0,2000),
        quantity: qty,
        unitPrice,
        lineTotal
      };
    });

    if(!Number.isFinite(Number(deliveryFee))||Number(deliveryFee)<0)fail('Invalid delivery fee');
    const totalAmount = Number((subtotal + Number(deliveryFee)).toFixed(3));
    const quoteNumber = `QUO-${rfq.rfq_number.replace('RFQ-', '')}-${Date.now().toString().slice(-4)}`;

    const quoteRes = await client.query(`
      INSERT INTO quotations (
        rfq_id, quote_number, subtotal, delivery_fee, total_amount, currency,customer_name,customer_phone,valid_until,
        validity_days, payment_terms, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'KWD',$9,$10,NOW()+($6*INTERVAL '1 day'), $6, $7, 'SENT', $8, NOW(), NOW())
      RETURNING *;
    `, [
      rfqId,
      quoteNumber,
      subtotal,
      Number(deliveryFee),
      totalAmount,
      validityDays,
      paymentTerms || 'Cash on Delivery (COD)',
      notes || '',rfq.customer_name,rfq.customer_phone
    ]);
    const quote = quoteRes.rows[0];

    for (const l of validatedLines) {
      await client.query(`
        INSERT INTO quotation_lines (
          quotation_id, product_name, description,sku, quantity, unit_price, line_total,total_price
        ) VALUES ($1, $2,$7, $3, $4, $5, $6,$6);
      `, [quote.id, l.productName, l.sku, l.quantity, l.unitPrice, l.lineTotal,l.productName+(l.description?' — '+l.description:'')]);
    }

    await client.query('UPDATE rfqs SET status = $1, updated_at = NOW() WHERE id = $2', ['QUOTED', rfqId]);
    await client.query('COMMIT');

    quote.lines = validatedLines;
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      quotation: quote
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

// GET /api/admin/rfq/:id/quote/:quotationId/pdf
router.get('/rfq/:id/quote/:quotationId/pdf', async (req, res) => {
  const { id, quotationId } = req.params;

  const rfqRes = await db.query('SELECT * FROM rfqs WHERE id = $1', [Number(id) || 0]);
  if (!rfqRes.rows.length) fail('RFQ not found', 404);
  const rfq = rfqRes.rows[0];

  const quoteRes = await db.query('SELECT * FROM quotations WHERE id = $1 AND rfq_id=$2', [Number(quotationId) || 0,Number(id) || 0]);
  if (!quoteRes.rows.length) fail('Quotation not found', 404);
  const quote = quoteRes.rows[0];

  const lines = (await db.query('SELECT * FROM quotation_lines WHERE quotation_id = $1 ORDER BY id ASC', [quote.id])).rows;

  // If JSON requested by React modal
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    return res.json({
      store: {
        nameEn: 'NAJMI HARDWARE & INDUSTRIAL SUPPLIES',
        nameAr: 'شركة النجمي للتجهيزات الصناعية والأدوات',
        addressEn: 'Kuwait',
        phone: '',
        crNumber: '',
        email: ''
      },
      quotation: {
        quotationNumber: quote.quote_number,
        createdAt: quote.created_at,
        validUntil: new Date(new Date(quote.created_at).getTime() + (quote.validity_days || 30) * 86400000).toISOString(),
        paymentTerms: quote.payment_terms || 'Cash on Delivery (COD)',
        subtotal: Number(quote.subtotal),
        deliveryFee: Number(quote.delivery_fee || 0),
        grandTotal: Number(quote.total_amount)
      },
      client: {
        companyName: rfq.company_name,
        contactPerson: rfq.contact_person,
        phone: rfq.phone,
        email: rfq.email,
        area: rfq.delivery_location || 'Shuwaikh',
        governorate: 'Capital Governorate'
      },
      lines: lines.map((l, idx) => ({
        index: idx + 1,
        description: l.description||l.product_name,
        specs: l.sku || '',
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        lineTotal: Number(l.line_total)
      })),
      pdfDownloadUrl: `/api/admin/rfq/${id}/quote/${quotationId}/pdf?download=true`
    });
  }

  // Otherwise generate and stream branded PDF using PDFKit
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="NAJMI-QUOTE-${quote.quote_number}.pdf"`);

  doc.pipe(res);

  // 1. Header & Branding
  doc.rect(40, 40, 515, 65).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(18).text('NAJMI HARDWARE EST.', 55, 52, { bold: true });
  doc.fontSize(9).fillColor('#94a3b8').text('Industrial Wire Ropes, Rigging Hardware & Marine Supplies', 55, 74);
  doc.fontSize(8).fillColor('#cbd5e1').text('Kuwait | Personalized quotation from Najmi Hardware', 55, 87);

  // 2. Title & Metadata
  doc.moveDown(3);
  doc.fillColor('#0f172a').fontSize(16).text('COMMERCIAL QUOTATION / عرض سعر رسمي', 40, 120);

  doc.fontSize(9).fillColor('#475569');
  doc.text(`Quotation #: ${quote.quote_number}`, 40, 145);
  doc.text(`RFQ Reference: ${rfq.rfq_number}`, 40, 158);
  doc.text(`Date Issued: ${new Date(quote.created_at).toLocaleDateString('en-GB')}`, 40, 171);
  doc.text(`Validity: ${quote.validity_days || 30} Days`, 40, 184);

  doc.text(`Client: ${rfq.company_name}`, 320, 145);
  doc.text(`Contact: ${rfq.contact_person}`, 320, 158);
  doc.text(`Phone: ${rfq.phone}`, 320, 171);
  doc.text(`Delivery: ${rfq.delivery_location}`, 320, 184);

  // 3. Line Items Table Header
  const tableTop = 210;
  doc.rect(40, tableTop, 515, 22).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(9);
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Description / Specifications', 75, tableTop + 6, { width: 220 });
  doc.text('SKU', 300, tableTop + 6, { width: 75 });
  doc.text('Qty', 380, tableTop + 6, { width: 35, align: 'right' });
  doc.text('Unit Price', 425, tableTop + 6, { width: 55, align: 'right' });
  doc.text('Total (KWD)', 485, tableTop + 6, { width: 65, align: 'right' });

  // 4. Line Items Rows
  let curY = tableTop + 24;
  lines.forEach((line, i) => {
    doc.fillColor('#334155').fontSize(8.5);
    doc.text(String(i + 1), 45, curY + 4, { width: 25 });
    doc.text(line.description||line.product_name, 75, curY + 4, { width: 220 });
    doc.text(line.sku || '-', 300, curY + 4, { width: 75 });
    doc.text(String(line.quantity), 380, curY + 4, { width: 35, align: 'right' });
    doc.text(Number(line.unit_price).toFixed(3), 425, curY + 4, { width: 55, align: 'right' });
    doc.text(Number(line.line_total).toFixed(3), 485, curY + 4, { width: 65, align: 'right' });

    const rowHeight=Math.max(22,doc.heightOfString(line.description||line.product_name,{width:220})+10);
    doc.rect(40, curY + rowHeight-4, 515, 0.5).fill('#e2e8f0');
    curY += rowHeight;
  });

  // 5. Totals Box
  curY += 10;
  doc.rect(340, curY, 215, 65).fill('#f8fafc');
  doc.rect(340, curY, 215, 65).stroke('#cbd5e1');

  doc.fillColor('#475569').fontSize(9);
  doc.text('Subtotal:', 350, curY + 8);
  doc.text(`${Number(quote.subtotal).toFixed(3)} KWD`, 450, curY + 8, { width: 95, align: 'right' });

  doc.text('Delivery (Kuwait):', 350, curY + 24);
  doc.text(`${Number(quote.delivery_fee || 0).toFixed(3)} KWD`, 450, curY + 24, { width: 95, align: 'right' });

  doc.fillColor('#0f172a').fontSize(10);
  doc.text('Grand Total:', 350, curY + 44, { bold: true });
  doc.text(`${Number(quote.total_amount).toFixed(3)} KWD`, 450, curY + 44, { width: 95, align: 'right', bold: true });

  // 6. Payment & Authorized Terms
  curY += 85;
  doc.fillColor('#0f172a').fontSize(9).text('Payment Terms & Conditions:', 40, curY, { bold: true });
  doc.fillColor('#475569').fontSize(8);
  doc.text('1. Payment Method: Cash on Delivery (COD) strictly upon delivery and inspection.', 40, curY + 14);
  doc.text('2. All prices are in Kuwaiti Dinars (KWD) net.', 40, curY + 26);
  doc.text('3. Product specifications and suitability require item-specific confirmation.', 40, curY + 38);

  // 7. Signature & Stamp
  doc.text('Authorized Signature & Company Stamp:', 350, curY + 14, { bold: true });
  doc.rect(350, curY + 28, 180, 45).stroke('#cbd5e1');
  doc.fillColor('#94a3b8').fontSize(7.5).text('Najmi Hardware Authorized Commercial Stamp', 360, curY + 45);

  doc.end();
});

// POST /api/admin/rfq/:id/quote/:quotationId/convert-to-order
router.post('/rfq/:id/quote/:quotationId/convert-to-order',async(req,res)=>fail('Use validated COD checkout after exact product, price and inventory approval. A quotation response alone does not create an order.',409));

module.exports = router;
