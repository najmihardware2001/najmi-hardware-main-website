import BrandedProductImage from './BrandedProductImage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {loadCatalogue} from '../services/catalogueDiscovery';
import { type ApiProductTemplate } from '../services/api';
import { colourLabel, measurementLabel, unitLabel } from '../i18n/catalogueLabels';
import APlusVisuals from './APlusVisuals';
import './a-plus-product-content.css';
import {getInitialCatalogue} from '../services/initialCatalogue';
import {applySeo,canonicalUrl,SITE_URL,productSeoTitle} from '../services/seo';
export default function APlusProductContent({product}:{product:ApiProductTemplate}){
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW',c=product.metadata?.listingContent||{},[related,setRelated]=useState<ApiProductTemplate[]>([]);
 useEffect(()=>{
  let active=true;
  const choose=(items:ApiProductTemplate[])=>{
   const words=new Set(product.name.toLowerCase().split(/\W+/).filter(w=>w.length>2));
   const score=(p:ApiProductTemplate)=>p.name.toLowerCase().split(/\W+/).reduce((n,w)=>n+(words.has(w)?1:0),0);
   if(active)setRelated(items.filter(p=>p.id!==product.id).sort((a,b)=>score(b)-score(a)).slice(0,4));
  };
  choose(getInitialCatalogue().products);loadCatalogue().then(choose).catch(()=>{});
  return()=>{active=false};
 },[product.id,product.name]);
 useEffect(()=>{applySeo({path:'/product/'+product.id,ar,title:productSeoTitle((ar?product.seoTitleAr:product.seoTitle)||(ar?product.nameAr:product.name),ar),description:(ar?product.metaDescriptionAr:product.metaDescription)||(ar?product.descriptionAr:product.description)||product.name,image:product.imageUrl,type:'product'})},[product,ar]);
 const text=(key:string)=>c[key+(ar?'_ar':'_en')],labels:Record<string,string>={reference:ar?'مرجع المنتج':'Product reference',family:ar?'فئة المنتج':'Product family',length:ar?'الأطوال المختارة':'Selected lengths',sheet:ar?'أبعاد اللوح':'Sheet dimensions',packaging:ar?'التعبئة':'Packaging',colour_preference:ar?'تفضيلات الألوان':'Colour preferences',diameters:ar?'الأقطار':'Diameters',sizes:ar?'المقاسات':'Sizes',sample:ar?'العينة المصورة':'Photographed sample',ply:ar?'عدد الطبقات':'Ply count'};
 const display=(value:string,key:string)=>ar?(key==='colour_preference'?value.split(' — ')[0].split(/[,،]/).map(v=>colourLabel(v.trim(),true)).join('، ')+' — يؤكد اللون عند التوريد':value.replace(/\b(mm|cm|in|ft|yard|kg|g|m|ply)\b/g,u=>unitLabel(u,true))):value;
 const canonical=canonicalUrl('/product/'+product.id,ar);
 // Quote-only pages do not have the published offer/review required for a Product rich result.
 const schema={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':canonical+'#webpage',name:ar?product.nameAr:product.name,description:ar?product.descriptionAr:product.description,identifier:product.code,image:product.imageUrl?[new URL(product.imageUrl,SITE_URL).href]:undefined,url:canonical,inLanguage:ar?'ar-KW':'en-KW',isPartOf:{'@id':SITE_URL+'/#website'},breadcrumb:{'@id':canonical+'#breadcrumb'}},{'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:ar?'الرئيسية':'Home',item:canonicalUrl('/',ar)},{'@type':'ListItem',position:2,name:ar?'المنتجات':'Products',item:canonicalUrl('/shop',ar)},{'@type':'ListItem',position:3,name:ar?product.nameAr:product.name,item:canonical}]}]};
 return <section data-testid="a-plus-content" className="a-plus-content"><script type="application/ld+json">{JSON.stringify(schema).replaceAll('<','\u003c')}</script>
 <div className="a-plus-intro"><p className="catalogue-eyebrow">{ar?'دليل المنتج':'Product guide'}</p><h2>{ar?product.nameAr:product.name}</h2><p>{text('details')}</p></div>
 <section className="a-plus-features" aria-label={ar?'مميزات المنتج':'Product features'}>{(text('features')||[]).map((feature:string,index:number)=><article key={feature}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span><p>{feature}</p></article>)}</section>
 <APlusVisuals parentId={product.id} excludeUrls={c.visual_layout==='THREE_IMAGE_SET'?[product.imageUrl||'']:['7883','7895','7896','7900','7901','7902'].includes(product.id)?[]:(product.media||[]).map(m=>m.webpUrl||m.originalUrl)}/>
 <div className="a-plus-columns"><section><h2>{ar?'المواصفات الفنية':'Technical specifications'}</h2><table><tbody>{(c.specifications||[]).map((r:any)=><tr key={r.key}><th scope="row">{labels[r.key]||(r.key.startsWith('option_')?(ar?'المقاس والطول':'Size and length'):measurementLabel(r.key,ar))}</th><td>{display(ar?r.ar:r.en,r.key)}</td></tr>)}</tbody></table><p className="catalogue-help">{ar?'اختر المقاس والطول المطلوبين من خيارات المنتج. يؤكد فريقنا السعر واللون والتوفر عند مراجعة طلب عرض السعر.':'Choose your required size and length in the product options. Our team confirms price, colour and availability with your quotation.'}</p></section>
 <section><h2>{ar?'الاستخدامات المناسبة':'Applications'}</h2><p>{text('applications')}</p><h3>{ar?'دليل اختيار المقاس':'Selection guide'}</h3><p>{text('selection')}</p><h3>{ar?'إرشادات الاستخدام':'Handling guidance'}</h3><p>{text('usage')}</p><h3>{ar?'العناية والتخزين':'Care and storage'}</h3><p>{text('care')}</p></section></div>
 <section className="a-plus-faq"><h2>{ar?'أسئلة شائعة':'Frequently asked questions'}</h2>{(text('faq')||[]).map((f:any)=><details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
 {!!related.length&&<section><h2>{ar?'منتجات من الكتالوج المختار':'Explore the selected catalogue'}</h2><div className="a-plus-related">{related.map(p=><Link key={p.id} to={`/product/${p.id}`}><BrandedProductImage src={p.imageUrl} alt={ar?p.nameAr:p.name} loading="lazy"/><strong>{ar?p.nameAr:p.name}</strong></Link>)}</div></section>}
 </section>
}
