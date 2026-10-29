exports.initiatePayment=async p=>{const result=await require('../payments')().createPayment({...p,currency:require('../utils/money').currency()});return {InvoiceId:result.id,InvoiceURL:result.url}};
