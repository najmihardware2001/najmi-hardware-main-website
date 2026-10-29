module.exports=(req,res,next)=>{req.requestId=require('node:crypto').randomUUID();res.set('X-Request-ID',req.requestId);next()};
