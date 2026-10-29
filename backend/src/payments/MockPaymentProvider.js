const db=require('../db'),crypto=require('node:crypto'),Base=require('./PaymentProvider');
class MockPaymentProvider extends Base {
 async createPayment(p){const invoice=crypto.randomUUID();await db.query('INSERT INTO mock_provider_payments(invoice_id,order_reference,amount,currency) VALUES($1,$2,$3,$4)',[invoice,p.orderId,p.invoiceAmount,p.currency]);return {id:invoice,url:(process.env.PUBLIC_API_URL||'http://localhost:3000')+'/api/payments/mock/'+invoice};}
 async getPaymentStatus(id){const p=(await db.query('SELECT * FROM mock_provider_payments WHERE invoice_id=$1',[id])).rows[0];if(!p)throw Object.assign(Error('Payment not found'),{status:404});return {id:p.invoice_id,orderReference:p.order_reference,amount:p.amount,currency:p.currency,status:p.status};}
 verifyWebhook(payload,signature,raw){const expected=crypto.createHmac('sha256',process.env.ORDER_TRACKING_SECRET).update(raw||JSON.stringify(payload)).digest('hex'),actual=String(signature||'');return expected.length===actual.length&&crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(actual));}
 async refund(p){const prior=(await db.query('SELECT * FROM mock_provider_refunds WHERE idempotency_key=$1',[p.key])).rows[0];if(prior)return {id:prior.id,status:prior.status};const id=crypto.randomUUID();await db.query('INSERT INTO mock_provider_refunds(id,invoice_id,amount,idempotency_key) VALUES($1,$2,$3,$4)',[id,p.invoice,p.amount,p.key]);return {id,status:'SUCCESS'};}
 async healthCheck(){return {configured:true,provider:'mock',external_service:false};}
}module.exports=MockPaymentProvider;
