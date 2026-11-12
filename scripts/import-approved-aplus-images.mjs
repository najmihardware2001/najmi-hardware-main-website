import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const review=process.argv[2];
if(!review)throw new Error('Pass the approved review folder containing manifest.json.');
const manifest=JSON.parse(fs.readFileSync(path.join(review,'manifest.json'),'utf8'));
const file=path.join(root,'catalogue/public-catalogue.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const brandingFile=path.join(root,'frontend/src/services/embeddedProductBranding.json');
const embedded=new Set(JSON.parse(fs.readFileSync(brandingFile,'utf8')));
const identities={'nylon-twine':7906,'clear-nylon-twine':7907,'monofilament-fishing-twine':7908,'fishing-twine-1kg':7909,'white-nylon-line-twine':7910,'assorted-colour-nylon-line':7911,'cotton-sash-cord':7912};
const roles=['HERO','MATERIAL_CLOSEUP','APPLICATION'];
const altEn=['studio product image','material close-up','illustrative application'];
const altAr=['صورة المنتج بخلفية بيضاء','تفاصيل الخامة','مثال توضيحي للاستخدام'];
const captions={
  7906:['Light bundling of wooden dowels','ربط حزمة خفيفة من الأعواد الخشبية'],
  7907:['Clear-line bead craft preparation','تجهيز أعمال الخرز بالخيط الشفاف'],
  7908:['Fishing-reel line preparation','تجهيز خيط بكرة الصيد'],
  7909:['Fishing-net repair preparation','تجهيز إصلاح شبكة الصيد'],
  7910:['Parcel tying','ربط الطرود'],
  7911:['Colour-coordinated gift packaging','تغليف الهدايا بخيوط ملونة متناسقة'],
  7912:['Sash-window cord replacement preparation','تجهيز استبدال حبل نافذة الساش']
};
let totalBytes=0;
for(const entry of manifest){
 const id=identities[entry.slug];
 const p=data.products.find(p=>p.id===id);
 if(!p||entry.files.length!==3)throw new Error(`Expected three images for ${entry.slug}`);
 const images=[];
 for(const [i,relative] of entry.files.entries()){
  const source=path.resolve(review,relative);
  if(!source.startsWith(path.resolve(review)+path.sep))throw new Error('Source must stay within approved review folder.');
  const url=`/uploads/aplus-approved-20261112/${p.source_id}--${['studio','detail','use-case'][i]}.webp`;
  const dest=path.join(root,'frontend/public',url);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  const result=await sharp(source).rotate().webp({quality:86,effort:5}).toFile(dest);
  totalBytes+=result.size;
  images.push({id:`aplus-${id}-${i+1}`,url,order:i+1,image_order:i+1,width:result.width,height:result.height,alt_en:`${p.name_en} - ${altEn[i]}`,alt_ar:`${p.name_ar} - ${altAr[i]}`,card_url:url,thumbnail_url:url,variant_id:null,color_code:null,colour:null,generated:true,content_type:roles[i],review_status:'OWNER_APPROVED'});
  embedded.add(url);
 }
 p.images=images;
 p.primary_image={url:images[0].url,width:images[0].width,height:images[0].height,alt_en:images[0].alt_en,alt_ar:images[0].alt_ar};
 p.card_gallery=images.map(i=>i.url);
 p.gallery_priority_urls=images.map(i=>i.url);
 p.photo_status='OWNER_APPROVED_STUDIO_APLUS_20261112';
 p.listing_content.visual_layout='THREE_IMAGE_SET';
 data.visuals[id].assets=images.slice(1).map((image,i)=>({...image,kind:'GALLERY',sort_order:i+1,...(i===1?{caption_en:captions[id][0],caption_ar:captions[id][1]}:{})}));
}
fs.writeFileSync(file,JSON.stringify(data));
fs.writeFileSync(brandingFile,JSON.stringify([...embedded]));
console.log(JSON.stringify({products:manifest.length,approvedImages:manifest.length*3,totalWebPBytes:totalBytes}));
