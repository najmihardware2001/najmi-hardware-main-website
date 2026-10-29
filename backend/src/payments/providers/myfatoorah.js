const Base=require('../PaymentProvider'),crypto=require('node:crypto');
// Optional adapter: no credentials bundled; never selected by default or integration tests.
class MyFatoorah extends Base {
 constructor(fetcher=fetch){super();this.fetcher=fetcher;}
 async request(endpoint,data){const base=new URL(process.env.MYFATOORAH_BASE_URL||'https://apitest.myfatoorah.com');if(base.protocol!=='https:'||!['apitest.myfatoorah.com','api.myfatoorah.com'].includes(base.hostname)||base.username||base.password||base.port)throw Error('Unapproved gateway URL');const response=await this.fetcher(new URL(endpoint,base),{method:'POST',headers:{Authorization:'Bearer '+process.env.MYFATOORAH_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});const body=await response.json();if(!response.ok||!body.IsSuccess)throw Object.assign(Error('Gateway rejected request'),{definitive:response.status>=400&&response.status<500});return body.Data;}
 async createPayment(p){const d=await this.request('/v2/SendPayment',{NotificationOption:'LNK',InvoiceValue:Number(p.invoiceAmount),DisplayCurrencyIso:p.currency,CustomerName:p.customerName,CustomerEmail:p.customerEmail||undefined,CustomerReference:p.orderId,CallBackUrl:process.env.PAYMENT_SUCCESS_URL,ErrorUrl:process.env.PAYMENT_FAILURE_URL});return {id:String(d.InvoiceId),url:d.InvoiceURL};}
 async getPaymentStatus(id){const d=await this.request('/v2/GetPaymentStatus',{Key:id,KeyType:'InvoiceId'});return {id:String(d.InvoiceId),orderReference:String(d.CustomerReference||''),amount:d.InvoiceValue,currency:String(d.InvoiceTransactions?.find(t=>t.TransactionStatus==='Succss')?.Currency||d.Currency||''),status:d.InvoiceStatus==='Paid'?'SUCCESS':d.InvoiceStatus==='Pending'?'PENDING':'FAILED'};}
 verifyWebhook(payload, signature) {
 const secret=process.env.MYFATOORAH_WEBHOOK_SECRET;
 if(typeof signature!=='string'||!secret||!payload?.Data)return false;
 const data=payload.Data;let keys;
 if(typeof payload.Event==='object'){
  if(payload.Event.Code===1&&payload.Event.Name==='PAYMENT_STATUS_CHANGED')keys=['Invoice.Id','Invoice.Status','Transaction.Status','Transaction.PaymentId','Invoice.ExternalIdentifier'];
  else if(payload.Event.Code===2&&payload.Event.Name==='REFUND_STATUS_CHANGED')keys=['Refund.Id','Refund.Status','Amount.ValueInBaseCurrency','ReferencedInvoice.Id'];
  else return false;
 }else if(payload.Event==='TransactionsStatusChanged')keys=['AuthorizationId','BaseCurrency','CreatedDate','CustomerEmail','CustomerMobile','CustomerName','CustomerReference','DisplayCurrency','InvoiceId','InvoiceReference','InvoiceValueInBaseCurrency','InvoiceValueInDisplayCurreny','InvoiceValueInPayCurrency','PayCurrency','PaymentId','PaymentMethod','ReferenceId','TrackId','TransactionStatus','UserDefinedField'];
 else if(payload.Event==='RefundStatusChanged')keys=['Amount','Comments','CreatedDate','InvoiceId','RefundId','RefundReference','RefundStatus'];
 else return false;
 const stringToSign=keys.map(k=>k+'='+String(k.split('.').reduce((v,key)=>v?.[key],data)??'')).join(',');
 const expected=crypto.createHmac('sha256',secret).update(stringToSign,'utf8').digest('base64');
 const a=Buffer.from(expected),b=Buffer.from(signature);return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

 async refund(p){const d=await this.request('/v2/MakeRefund',{Key:p.invoice,KeyType:'InvoiceId',Amount:Number(p.amount),Comment:p.reason});return {id:String(d.RefundId),status:'PENDING'};}
 async healthCheck(){return {configured:!!process.env.MYFATOORAH_API_KEY&&!!process.env.MYFATOORAH_WEBHOOK_SECRET,provider:'myfatoorah',remote_probe_performed:false};}
}module.exports=MyFatoorah;
