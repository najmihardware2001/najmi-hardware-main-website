import { colourLabel, measurementLabel, unitLabel } from '../i18n/catalogueLabels';

// Owner-supplied business contacts. WhatsApp quotation enquiries go to Najmuddin.
export const BUSINESS_CONTACTS = {
  owner: { name: 'Najmuddin', nameAr: 'نجم الدين', role: 'Owner', roleAr: 'المالك', phone: '+96599652718', displayPhone: '+965 9965 2718' },
  sales: { name: 'Yusuf', nameAr: 'يوسف', role: 'Sales', roleAr: 'المبيعات', phone: '+96597465572', displayPhone: '+965 9746 5572' },
} as const;

export function normalizeWhatsAppMessage(message:string):string {
  return message.replace(/\\r\\n|\\n/g,'\n').replace(/\r\n?/g,'\n').replace(/[ \t]+\n/g,'\n').replace(/\n(?=•)/g,'\n\n').replace(/\n{3,}/g,'\n\n').trim();
}
export function whatsappUrl(phone: string, message: string): string {
  return 'https://wa.me/'+phone.replace(/\D/g,'')+'?text='+encodeURIComponent(normalizeWhatsAppMessage(message));
}

export function generalQuoteUrl(ar: boolean, product?: string | null): string {
  return whatsappUrl(BUSINESS_CONTACTS.owner.phone, ar
    ? `*نجمي هاردوير | طلب عرض سعر*\n\nمرحباً نجم الدين،\n\n*المتطلبات*\n• المنتج: ${product||'سأضيف التفاصيل'}\n• المقاس / المواصفات:\n• اللون:\n• الكمية ووحدة البيع:\n\n*يرجى تقديم*\n• السعر\n• التوفر ومدة التوريد\n\nشكراً.`
    : `*NAJMI HARDWARE | QUOTE REQUEST*\n\nHello Najmuddin,\n\n*REQUIREMENTS*\n• Product: ${product||'Details to follow'}\n• Size / specification:\n• Colour:\n• Quantity & unit:\n\n*PLEASE CONFIRM*\n• Price\n• Availability & lead time\n\nThank you.`);
}

type QuoteSelection = {
  product: string; code: string; pageUrl: string; measurementType: string;
  measurements?: { size_value?: number; size_unit?: string; length_value?: number; length_unit?: string; packaging?: string; colour_note?: string; sheet_dimensions?: { values: number[]; unit?: string | null } };
  colour?: string; quantity: number; unit?: string;
};

export function productQuoteUrl(selection: QuoteSelection, ar: boolean): string {
  const m = selection.measurements, unknown = ar ? 'يرجى التأكيد' : 'Please confirm';
  const size = m?.size_value != null ? `${m.size_value} ${unitLabel(m.size_unit || '', ar)}` : unknown;
  const colour = selection.colour?.replace(/^pref:/, '');
  const lines = [ar?'*نجمي هاردوير | طلب عرض سعر*':'*NAJMI HARDWARE | QUOTE REQUEST*','',ar?'مرحباً نجم الدين،':'Hello Najmuddin,','',`*01 · ${selection.product}*`,`• ${ar?'المرجع':'Reference'}: ${selection.code}`];
  if(m?.size_value!=null)lines.push(`• ${measurementLabel(selection.measurementType, ar)}: ${size}`);
  if (m?.length_value != null) lines.push(`• ${ar ? 'الطول' : 'Length'}: ${m.length_value} ${unitLabel(m.length_unit || '', ar)}`);
  if (m?.sheet_dimensions) lines.push(`• ${ar ? 'أبعاد اللوح' : 'Sheet dimensions'}: ${m.sheet_dimensions.values.join(' × ')} ${m.sheet_dimensions.unit ? unitLabel(m.sheet_dimensions.unit, ar) : `(${ar ? 'الوحدة للتأكيد' : 'unit to confirm'})`}`);
  if (m?.packaging) lines.push(`• ${ar ? 'التعبئة' : 'Packaging'}: ${unitLabel(m.packaging, ar)}`);
  lines.push(`• ${ar ? 'اللون / النقشة' : 'Colour / pattern'}: ${colour && colour !== '__unknown' ? colourLabel(colour, ar) : m?.colour_note ? colourLabel(m.colour_note, ar) : unknown}`);
  lines.push(`• ${ar ? 'الكمية المطلوبة' : 'Requested quantity'}: ${selection.quantity}${selection.unit?' '+unitLabel(selection.unit,ar):' ('+(ar?'الوحدة للتأكيد':'unit to confirm')+')'}`);
  lines.push('',`${ar ? 'رابط المنتج' : 'Product link'}:`,selection.pageUrl);
  lines.push('',ar?'*يرجى تقديم*':'*PLEASE CONFIRM*',ar?'• السعر':'• Price',ar?'• التوفر ومدة التوريد':'• Availability & lead time',ar?'• ملاءمة المواصفات المطلوبة':'• Required specification', '',ar?'طلب عرض سعر فقط. شكراً.':'Quotation enquiry only. Thank you.');
  return whatsappUrl(BUSINESS_CONTACTS.owner.phone, lines.filter(Boolean).join('\n\n'));
}
