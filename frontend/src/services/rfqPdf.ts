import type {RfqItem} from '../store';
import {quoteDetails,type QuoteContact} from './quoteBasket';
import {unitLabel} from '../i18n/catalogueLabels';

// Dependency-free PDF export. Canvas uses the browser's Arabic shaping and bundled
// fonts, so EN/AR remain visually faithful without shipping another PDF library.
// Raster pages are deliberate: the editable, accessible source remains the basket.
export async function downloadRfqPdf(items:RfqItem[],contact:QuoteContact,ar:boolean){
 if(!items.length)throw Error(ar?'أضف منتجاً أولاً.':'Add a product first.');
 await document.fonts.ready;
 const scale=2,width=794,height=1123,margin=52,pages:HTMLCanvasElement[]=[];
 let canvas!:HTMLCanvasElement,ctx!:CanvasRenderingContext2D,y=0;
 const font=ar?'"IBM Plex Sans Arabic"':'Manrope';
 const newPage=()=>{canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;ctx=canvas.getContext('2d')!;ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#10233D';ctx.fillRect(0,0,width,12);ctx.direction=ar?'rtl':'ltr';ctx.textAlign=ar?'right':'left';y=60;pages.push(canvas);};
 const line=(text:string,size=13,bold=false,ltr=false)=>{ctx.font=`${bold?'700':'400'} ${size}px ${font}`;const words=text.split(/\s+/).flatMap(word=>{if(ctx.measureText(word).width<=width-2*margin)return [word];const pieces:string[]=[];let piece='';for(const char of word){if(piece&&ctx.measureText(piece+char).width>width-2*margin){pieces.push(piece);piece=''}piece+=char}if(piece)pieces.push(piece);return pieces});let row='';const draw=(v:string)=>{ctx.direction=ltr?'ltr':ar?'rtl':'ltr';if(y>height-78){newPage();ctx.font=`${bold?'700':'400'} ${size}px ${font}`}ctx.fillStyle='#10233D';ctx.fillText(v,ar?width-margin:margin,y);y+=size*1.65;};for(const word of words){const test=row?row+' '+word:word;if(ctx.measureText(test).width>width-2*margin&&row){draw(row);row=word}else row=test;}if(row)draw(row);};
 const gap=(amount=14)=>{y+=amount};
 newPage();line('NAJMI HARDWARE / STAR ROPE',22,true);gap(6);line(ar?'طلب عرض سعر — ليس فاتورة أو عرض سعر معتمداً':'REQUEST FOR QUOTATION — NOT AN INVOICE OR APPROVED QUOTE',13,true);gap();
 const date=new Date().toLocaleDateString(ar?'ar-KW':'en-GB',{year:'numeric',month:'long',day:'numeric'});
 line(`${ar?'التاريخ':'Date'}: ${date}`);line('+965 9965 2718  |  Shuwaikh, Kuwait',13,false,true);
 const labels={name:ar?'الاسم':'Name',company:ar?'الشركة':'Company',phone:ar?'الهاتف':'Phone',email:ar?'البريد الإلكتروني':'Email',project:ar?'مرجع المشروع':'Project reference',notes:ar?'ملاحظات عامة':'General notes'};
 for(const k of ['project','name','company','phone','email'] as const)if(contact[k])line(`${labels[k]}: ${contact[k]}`);
 gap(18);
 for(const [i,item] of items.entries()){
  if(y>height-220)newPage();
  ctx.fillStyle='#E66B2E';ctx.fillRect(margin,y-8,width-margin*2,2);gap(14);
  line(`${i+1}. ${ar?(item.productNameAr||item.productName||item.productId):(item.productName||item.productId)}`,16,true);
  line(`${ar?'المرجع':'Reference'}: ${item.parentReference||item.productId}`);
  if(item.variantId)line(`SKU: ${item.variantSku||item.variantId}`);
  const details=quoteDetails(item,ar);if(!details.length)line(ar?'المواصفات: يرجى التأكيد':'Specification: to confirm');
  for(const detail of details)line(detail);
  line(`${ar?'الكمية المطلوبة':'Requested quantity'}: ${item.quantity} ${item.unit?unitLabel(item.unit,ar):ar?'(الوحدة للتأكيد)':'(unit to confirm)'}`,13,true);
  if(item.notes)line(`${ar?'ملاحظات الصنف':'Item notes'}: ${item.notes}`);gap();
 }
 if(contact.notes){gap();line(labels.notes,14,true);line(contact.notes);}
 gap();line(ar?'يرجى تأكيد الأسعار والتوفر ومدة التوريد والمواصفات ووحدة البيع.':'Please confirm prices, availability, lead time, exact specifications and selling units.');
 const images=pages.map((page,index)=>{const c=page.getContext('2d')!;c.save();c.setTransform(scale,0,0,scale,0,0);c.font=`11px ${font}`;c.textAlign='center';c.direction='ltr';c.fillStyle='#536171';c.fillText(`${ar?'طلب عرض سعر فقط':'Quotation request only'}  ·  ${index+1} / ${pages.length}`,width/2,height-35);c.restore();return Uint8Array.from(atob(page.toDataURL('image/jpeg',0.94).split(',')[1]),c=>c.charCodeAt(0));});
 const bytes=makePdf(images,width*scale,height*scale),blob=new Blob([bytes as BlobPart],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Najmi-RFQ-${new Date().toISOString().slice(0,10)}${ar?'-AR':''}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function makePdf(images:Uint8Array[],pixelWidth:number,pixelHeight:number){
 const encoder=new TextEncoder(),chunks:Uint8Array[]=[],offsets:number[]=[0];let length=0;
 const push=(v:string|Uint8Array)=>{const b=typeof v==='string'?encoder.encode(v):v;chunks.push(b);length+=b.length};
 const object=(id:number,body:string|Uint8Array)=>{offsets[id]=length;push(`${id} 0 obj\n`);push(body);push('\nendobj\n')};
 push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Count ${images.length} /Kids [${images.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 images.forEach((jpeg,i)=>{const page=3+i*3,image=page+1,content=page+2;object(page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /I${i} ${image} 0 R >> >> /Contents ${content} 0 R >>`);offsets[image]=length;push(`${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);push(jpeg);push('\nendstream\nendobj\n');const stream=`q 595.28 0 0 841.89 0 0 cm /I${i} Do Q`;object(content,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);});
 const xref=length,count=3+images.length*3;push(`xref\n0 ${count}\n0000000000 65535 f \n`);for(let i=1;i<count;i++)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 const result=new Uint8Array(length);let pos=0;for(const c of chunks){result.set(c,pos);pos+=c.length}return result;
}
