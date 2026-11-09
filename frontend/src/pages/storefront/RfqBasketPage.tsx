import {useDiscovery} from '../../DiscoveryContext';
import BrandedProductImage from '../../components/BrandedProductImage';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../StoreContext';
import { api } from '../../services/api';
import { basketQuoteUrl, quoteDetails, emptyContact, type QuoteContact } from '../../services/quoteBasket';
import { BUSINESS_CONTACTS } from '../../services/businessContacts';
import {writeLocal} from '../../services/catalogueDiscovery';
import {downloadRfqPdf} from '../../services/rfqPdf';
import { unitLabel } from '../../i18n/catalogueLabels';

export default function RfqBasketPage({cartMode=false,embedded=false}:{cartMode?:boolean;embedded?:boolean}={}) {
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW';
 const {openQuick}=useDiscovery();
 const {state,dispatch}=useStore(),items=state.rfqBasket;
 const [contact,setContact]=useState<QuoteContact>(()=>{try{return {...emptyContact,...JSON.parse(localStorage.getItem('najmi.quote-contact')||'{}')}}catch{return emptyContact}});
 const [pdfBusy,setPdfBusy]=useState(false),[pdfError,setPdfError]=useState('');
 useEffect(()=>writeLocal('najmi.quote-contact',contact),[contact]);
 const exportPdf=async()=>{setPdfBusy(true);setPdfError('');try{await downloadRfqPdf(items,contact,ar)}catch{setPdfError(ar?'تعذر إنشاء الملف. يرجى المحاولة مجدداً.':'Could not create the PDF. Please retry.')}finally{setPdfBusy(false)}};
 // Resolve older saved basket entries against the real catalogue, never mock fixtures.
 useEffect(()=>{let active=true;for(const item of items.filter(i=>!i.productName))api.getStorefrontProductById(item.productId).then(product=>{if(!active)return;const variant=product.variants.find(v=>v.id===item.variantId);dispatch({type:'REMOVE_FROM_RFQ',payload:item});dispatch({type:'ADD_TO_RFQ',payload:{...item,productName:product.name,productNameAr:product.nameAr,parentReference:product.metadata?.parentReference||product.code,imageUrl:product.imageUrl,unit:variant?.sellingUnit,colour:variant?.color,measurements:variant?{size_value:variant.diameterMm,size_unit:'mm',length_value:variant.lengthValue,length_unit:variant.lengthUnit}:undefined}})}).catch(()=>{});return()=>{active=false}},[items,dispatch]);
 const href=basketQuoteUrl(items,ar,contact);
 return <div className={'container-app quote-basket-page'+(embedded?' quote-basket-embedded':'')} data-testid={cartMode?'enquiry-cart':'quote-basket'}>
  <div className="quote-basket-heading"><div><p className="catalogue-eyebrow">{ar?'نجمي هاردوير':'Najmi Hardware'}</p>{embedded?<h2>{ar?'منتجات تحتاج إلى عرض سعر':'Items for quotation'} <span>({items.length})</span></h2>:<h1>{cartMode?(ar?'سلة التسوق':'Your Cart'):(ar?'سلة عروض الأسعار':'Quote Basket')} <span>({items.length})</span></h1>}</div><Link className="btn btn-outline" to="/shop">{ar?'متابعة التسوق':'Continue browsing'}</Link></div>
  <p className="quote-basket-intro">{ar?'راجع متطلباتك وأرسل القائمة المنظمة إلى ناظم الدين عبر واتساب لتأكيد الأسعار والتوفر.':'Review your requirements and send the itemized list to Nazmuddin on WhatsApp for pricing and availability.'}</p>
  {!items.length?<section className="quote-basket-empty"><span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span><h2>{cartMode?(ar?'سلتك فارغة':'Your cart is empty'):(ar?'سلة عروض الأسعار فارغة':'Your quote basket is empty')}</h2><p>{ar?'أضف المنتجات من المتجر أو صفحة المنتج للبدء.':'Add products from the shop or a product page to get started.'}</p><Link className="btn btn-primary" to="/shop">{ar?'تصفح المنتجات':'Browse products'}</Link></section>:<div className="quote-basket-layout">
   <section className="quote-basket-items" aria-label={ar?'المنتجات المطلوبة':'Requested products'}>
    {items.map(item=><article className="quote-basket-item" data-testid="quote-basket-item" key={item.productId+'|'+(item.selectionKey||item.variantId)}>
     <Link to={'/product/'+item.productId} className="quote-item-image">{item.imageUrl&&<BrandedProductImage src={item.imageUrl} alt={ar?(item.productNameAr||item.productName):item.productName} loading="lazy"/>}</Link>
     <div className="quote-item-content"><p className="catalogue-eyebrow">{item.parentReference||item.productId}</p><Link to={'/product/'+item.productId}><h2>{ar?(item.productNameAr||item.productName||'منتج محفوظ'):(item.productName||'Saved product')}</h2></Link>
      {quoteDetails(item,ar).length?quoteDetails(item,ar).map(line=><p key={line}>{line}</p>):<p>{ar?'المواصفات تحتاج إلى تأكيد':'Specifications to confirm'}</p>}
      <div className="quote-item-fields"><label>{ar?'الكمية':'Quantity'}<input data-testid="quote-quantity" type="number" min="1" max="9999" value={item.quantity} onChange={e=>dispatch({type:'UPDATE_RFQ_ITEM',payload:{...item,quantity:Math.max(1,Math.min(9999,Math.floor(Number(e.target.value)||1)))}})}/></label>
       <label>{ar?'وحدة الكمية':'Quantity unit'}{(item.unitOptions?.length||0)>1?<select value={item.unit||''} onChange={e=>dispatch({type:'UPDATE_RFQ_ITEM',payload:{...item,unit:e.target.value}})}><option value="">{ar?'يرجى التأكيد':'Please confirm'}</option>{item.unitOptions!.map(u=><option key={u} value={u}>{unitLabel(u,ar)}</option>)}</select>:<span>{item.unit?unitLabel(item.unit,ar):ar?'يؤكدها فريقنا':'Our team will confirm'}</span>}</label></div>
      <label className="quote-item-notes">{ar?'ملاحظات المنتج':'Item notes'}<input maxLength={300} value={item.notes} onChange={e=>dispatch({type:'UPDATE_RFQ_ITEM',payload:{...item,notes:e.target.value}})}/></label>
      <button className="quote-remove" onClick={()=>api.getStorefrontProductById(item.productId).then(p=>openQuick(p,item,true)).catch(()=>setPdfError(ar?'تعذر تحميل مواصفات المنتج.':'Could not load product specifications.'))}>{ar?'تعديل المواصفات':'Edit specification'}</button>
      <button className="quote-remove" type="button" onClick={()=>dispatch({type:'REMOVE_FROM_RFQ',payload:item})}>{ar?'إزالة':'Remove'}</button>
     </div>
    </article>)}
   </section>
   <aside className="quote-basket-summary"><h2>{ar?'اطلب عرض سعر':'Request your quotation'}</h2><p>{ar?'بيانات التواصل اختيارية. تفتح الرسالة في واتساب لتراجعها وترسلها بنفسك.':'Contact details are optional. WhatsApp opens your prepared list for you to review and send.'}</p>
    {(['project','name','phone','email','company','notes'] as const).map(key=><label key={key}>{({project:ar?'مرجع المشروع':'Project reference',name:ar?'الاسم':'Name',phone:ar?'الهاتف':'Phone',email:ar?'البريد الإلكتروني':'Email',company:ar?'الشركة':'Company',notes:ar?'ملاحظات عامة':'General notes'})[key]}<input type={key==='email'?'email':key==='phone'?'tel':'text'} maxLength={key==='notes'?500:150} value={contact[key]} onChange={e=>setContact({...contact,[key]:e.target.value})}/></label>)}
    <a className="btn btn-primary quote-basket-send" data-testid="basket-whatsapp" href={href} target="_blank" rel="noopener noreferrer">{ar?'إرسال المتطلبات عبر واتساب':'Send Requirements on WhatsApp'}<span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span></a>
    <button className="btn btn-outline v2-pdf-button" data-testid="download-rfq" disabled={pdfBusy} onClick={exportPdf}>{pdfBusy?(ar?'جارٍ إنشاء الملف…':'Creating PDF…'):(ar?'تنزيل طلب عرض السعر PDF':'Download RFQ PDF')}</button>{pdfError&&<p role="alert">{pdfError}</p>}<p className="catalogue-help">{ar?'الملف طلب متطلبات، وليس فاتورة أو عرض سعر معتمداً. لإرفاق مستند، أرسله بنفسك في واتساب بعد مراجعة الرسالة.':'This document is a request, not an invoice or approved quote. Send any supporting attachment yourself in WhatsApp after reviewing the message.'}</p>
    <p dir="ltr">{BUSINESS_CONTACTS.owner.displayPhone}</p><details className="requirement-message-preview"><summary>{ar?'معاينة رسالة المتطلبات':'Preview requirement message'}</summary><pre>{new URL(href).searchParams.get('text')}</pre></details><p className="catalogue-help">{ar?'تُؤكد الأسعار والتوفر قبل الشراء.':'Prices and availability are confirmed before purchase.'}</p>
   </aside>
  </div>}
 </div>;
}
