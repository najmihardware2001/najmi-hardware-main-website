import type { ApiProductTemplate } from './api';
import type { RfqItem } from '../store';
import { colourLabel, measurementLabel, unitLabel } from '../i18n/catalogueLabels';
import { BUSINESS_CONTACTS, whatsappUrl } from './businessContacts';

export function quoteItem(product: ApiProductTemplate, selection: Partial<RfqItem> = {}): RfqItem {
 const item: RfqItem = {productId:product.id,variantId:'',quantity:1,notes:'',productName:product.name,productNameAr:product.nameAr,imageUrl:product.imageUrl,parentReference:product.metadata?.parentReference||product.code,pageUrl:window.location.href,...selection};
 // This identifies an enquiry selection only. It is never sent as an inventory SKU.
 item.selectionKey=JSON.stringify([item.variantId,item.measurementType||'',item.measurements||{},item.colour||'',item.unit||'']);
 return item;
}
export function quoteDetails(item:RfqItem,ar:boolean):string[] {
 const m=item.measurements||{},lines:string[]=[];
 if(m.size_value!=null)lines.push(`${measurementLabel(item.measurementType||'diameter',ar)}: ${m.size_value} ${unitLabel(m.size_unit||'',ar)}`);
 if(m.length_value!=null)lines.push(`${ar?'الطول':'Length'}: ${m.length_value} ${unitLabel(m.length_unit||'',ar)}`);
 if(m.sheet_dimensions)lines.push(`${ar?'أبعاد اللوح':'Sheet dimensions'}: ${m.sheet_dimensions.values.join(' × ')} ${m.sheet_dimensions.unit?unitLabel(m.sheet_dimensions.unit,ar):ar?'الوحدة تحتاج إلى تأكيد':'unit to confirm'}`);
 if(m.packaging)lines.push(`${ar?'التعبئة':'Packaging'}: ${unitLabel(m.packaging,ar)}`);
 const colour=item.colour?.replace(/^pref:/,'')||m.colour_note;
 if(colour&&colour!=='__unknown')lines.push(`${ar?'اللون':'Colour'}: ${colourLabel(colour,ar)}${item.colour?.startsWith('pref:')?(ar?' (تفضيل للتأكيد)':' (preference to confirm)'):''}`);
 return lines;
}
export type QuoteContact={name:string;phone:string;email:string;company:string;notes:string;project?:string};
export const emptyContact:QuoteContact={name:'',phone:'',email:'',company:'',notes:'',project:''};
export function basketMessage(items:RfqItem[],ar:boolean,contact:QuoteContact):string {
 const clean=(value:string|undefined)=>String(value||'').replace(/[\r\n]+/g,' ').trim();
 const blocks=[ar?'*نجمي هاردوير | طلب عرض سعر*':'*NAJMI HARDWARE | QUOTE REQUEST*',ar?'مرحباً ناظم الدين، أرجو عرض سعر للمتطلبات التالية:':'Hello Nazmuddin, please quote for the following requirements:'];
 if(contact.project)blocks.push((ar?'*المشروع:* ':'*Project:* ')+clean(contact.project));
 for(const [index,item] of items.entries()){
  const name=ar?(item.productNameAr||item.productName||item.productId):(item.productName||item.productId);
  const fields=['*'+(index+1)+'. '+clean(name)+'*',...quoteDetails(item,ar).map(line=>'• '+clean(line)),(ar?'• الكمية: ':'• Quantity: ')+item.quantity+' '+(item.unit?unitLabel(item.unit,ar):ar?'(الوحدة للتأكيد)':'(unit to confirm)')];
  if(item.notes)fields.push((ar?'• ملاحظات: ':'• Notes: ')+clean(item.notes));
  blocks.push(fields.join('\n\n'));
 }
 const customer=[['name',ar?'الاسم':'Name'],['phone',ar?'الهاتف':'Phone'],['email',ar?'البريد الإلكتروني':'Email'],['company',ar?'الشركة':'Company'],['notes',ar?'ملاحظات عامة':'General notes']] as const;
 const fields=customer.filter(([key])=>contact[key]).map(([key,label])=>'• '+label+': '+clean(contact[key]));
 if(fields.length)blocks.push([ar?'*بيانات العميل*':'*CUSTOMER DETAILS*',...fields].join('\n\n'));
 blocks.push(ar?'*يرجى تأكيد*\n\n• سعر الوحدة\n\n• التوفر\n\n• مدة التوريد':'*PLEASE CONFIRM*\n\n• Unit price\n\n• Availability\n\n• Lead time',ar?'طلب عرض سعر فقط، وليس طلب شراء. شكراً.':'Quotation request only. Thank you.');
 return blocks.join('\n\n────────────────\n\n');
}
export function basketQuoteUrl(items:RfqItem[],ar:boolean,contact:QuoteContact):string {return whatsappUrl(BUSINESS_CONTACTS.owner.phone,basketMessage(items,ar,contact));}
