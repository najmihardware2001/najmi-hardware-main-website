const Base=require('../MediaProvider');
class Cloudinary extends Base {
 client(){if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)throw Object.assign(Error('Configure new project media credentials before uploading'),{status:503});const sdk=require('cloudinary').v2;sdk.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET,secure:true});return sdk;}
 async upload(buffer,id){const result=await new Promise((resolve,reject)=>{const stream=this.client().uploader.upload_stream({resource_type:'image',public_id:(process.env.CLOUDINARY_FOLDER||'ecommerce')+'/'+id,overwrite:false,format:'webp'},(e,r)=>e?reject(Error('Media upload failed')):resolve(r));stream.end(buffer)});return {url:result.secure_url,public_id:result.public_id};}
 async delete(id){await this.client().uploader.destroy(id,{resource_type:'image',invalidate:true});}
 transformUrl(url,width=800){return url.replace('/image/upload/','/image/upload/f_auto,q_auto,w_'+Math.max(40,Math.min(1600,Number(width)||800))+'/');}
}module.exports=Cloudinary;
