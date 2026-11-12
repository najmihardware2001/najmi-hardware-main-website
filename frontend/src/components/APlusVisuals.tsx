import BrandedProductImage from './BrandedProductImage';
import {useEffect,useState} from 'react';
import {getInitialCatalogue} from '../services/initialCatalogue';
import {useTranslation} from 'react-i18next';
import {api} from '../services/api';
import {measurementLabel,unitLabel,colourLabel} from '../i18n/catalogueLabels';
export const visualRole=(role:string,ar:boolean)=>({HERO:ar?'الصورة الرئيسية':'Hero',MATERIAL_CLOSEUP:ar?'تفاصيل السطح':'Material / surface detail',APPLICATION:ar?'الاستخدام والتخزين':'Application / storage',SPECIFICATION_VISUAL:ar?'دليل المواصفات':'Specification visual',SELECTION_GUIDE:ar?'دليل الاختيار':'Selection guide',GALLERY:ar?'معرض الصور':'Gallery',COLOUR:ar?'اللون / النقشة':'Colour / pattern'} as Record<string,string>)[role]||role;
type VisualData={assets:any[];specifications:any[]};
export default function APlusVisuals({parentId,override,excludeUrls=[]}:{parentId:string;override?:VisualData;excludeUrls?:string[]}){
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW',[data,setData]=useState<VisualData>(()=>String(getInitialCatalogue().configuration?.parent_id)===parentId?getInitialCatalogue().visuals||{assets:[],specifications:[]}:{assets:[],specifications:[]});
 useEffect(()=>{if(override){setData(override);return}if(String(getInitialCatalogue().configuration?.parent_id)===parentId&&getInitialCatalogue().visuals){setData(getInitialCatalogue().visuals);return}let active=true;setData({assets:[],specifications:[]});api.catalogue(`/products/${parentId}/visuals`).then(r=>{if(active)setData(r)}).catch(()=>{});return()=>{active=false}},[parentId,override]);
 const assets=data.assets.filter(a=>!excludeUrls.includes(a.url));
 const groups=new Map<string,{type:string;m:any;lengths:string[];unconfirmed:boolean}>();
 for(const s of data.specifications){const m=s.measurements,key=JSON.stringify([s.measurement_type,m.size_value,m.size_unit,m.sheet_dimensions,m.packaging]);if(!groups.has(key))groups.set(key,{type:s.measurement_type,m,lengths:[],unconfirmed:s.review_status?.includes('UNCONFIRMED')||s.review_status?.includes('HISTORICAL')});const row=groups.get(key)!;if(m.length_value!=null){const v=`${m.length_value} ${unitLabel(m.length_unit,ar)}`;if(!row.lengths.includes(v))row.lengths.push(v)}}
 const rows=[...groups.values()],hasLengths=rows.some(r=>r.lengths.length),type=rows[0]?.type||'enquiry';
 return <section data-testid="a-plus-visuals" className="a-plus-visuals">
  {!!assets.length&&<div className="a-plus-image-grid" data-testid="approved-a-plus-gallery">{assets.map(a=><figure key={a.id}><BrandedProductImage src={a.url} alt={(ar?a.alt_ar:a.alt_en)||visualRole(a.content_type,ar)} loading="lazy"/><figcaption>{(ar?a.caption_ar:a.caption_en)||visualRole(a.content_type,ar)}{a.colour?` · ${colourLabel(a.colour,ar)}`:''}{override&&<small>{a.status}</small>}</figcaption></figure>)}</div>}
  <section data-testid="specification-visual" className="specification-visual"><p className="catalogue-eyebrow">{ar?'المواصفات بنظرة واحدة':'Specifications at a glance'}</p><h2>{ar?'اختر المقاس المناسب':'Find your measurement'}</h2><div className="specification-card-grid">{rows.map((r,index)=><article className="specification-card" key={index}>
   <span className={`measurement-mark measurement-mark-${r.type}`} aria-hidden="true"/>
   <strong>{measurementLabel(r.type,ar)}</strong><b dir="auto">{r.m.size_value!=null?`${r.m.size_value} ${unitLabel(r.m.size_unit,ar)}`:ar?'المواصفات تحتاج إلى تأكيد':'Specification to confirm'}</b>
   {!!r.lengths.length&&<p>{ar?'الأطوال المختارة':'Selected lengths'}<span>{r.lengths.join(ar?'، ':' / ')}</span></p>}
   {r.m.sheet_dimensions&&<p>{ar?'أبعاد اللوح':'Sheet dimensions'}<span>{r.m.sheet_dimensions.values.join(' × ')} {r.m.sheet_dimensions.unit?unitLabel(r.m.sheet_dimensions.unit,ar):ar?'— الوحدة تحتاج إلى تأكيد':'— unit to confirm'}</span></p>}
   {r.m.packaging&&<p>{ar?'التعبئة':'Packaging'}<span>{unitLabel(r.m.packaging,ar)}</span></p>}
   {r.m.colour_note&&<p>{ar?'وصف اللون':'Colour description'}<span>{colourLabel(r.m.colour_note,ar)}</span></p>}
   {r.unconfirmed&&<small>{ar?'خيار استفسار يحتاج إلى تأكيد':'Enquiry option — confirmation required'}</small>}
  </article>)}</div><p className="catalogue-help">{ar?'هذه خيارات لتحديد طلبك. تؤكد وحدة البيع واللون والتوفر عند مراجعة الصنف. الأشكال توضيحية وليست مقياساً فعلياً.':'These options help describe your request. Selling unit, colour and availability are confirmed for the exact item. Graphic marks are not to scale.'}</p></section>
  <section data-testid="selection-guide-visual" className="selection-guide-visual"><h2>{ar?'خطوات اختيار المنتج':'Your selection guide'}</h2><ol><li><b>{measurementLabel(type,ar)}</b><span>{ar?'اختر من المقاسات المحددة أعلاه.':'Choose one of the listed measurements.'}</span></li>{hasLengths&&<li><b>{ar?'طول اللفة':'Roll length'}</b><span>{ar?'اختر طولاً مرتبطاً بالمقاس المختار فقط.':'Choose a length associated with your measurement.'}</span></li>}<li><b>{ar?'اللون / النقشة':'Colour / pattern'}</b><span>{ar?'حدد اللون أو التفضيل ليؤكده فريقنا.':'Select the colour or preference for our team to confirm.'}</span></li><li><b>{ar?'الكمية ووحدة البيع':'Quantity and selling unit'}</b><span>{ar?'حدد عدد اللفات أو القطع أو العبوات المطلوبة، ثم أرسل طلب عرض السعر.':'Specify the requested number of rolls, pieces or packs, then send your quote enquiry.'}</span></li></ol></section>
 </section>
}
