import BrandedProductImage from './BrandedProductImage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {loadCatalogue} from '../services/catalogueDiscovery';
import { type ApiProductTemplate } from '../services/api';
import { colourLabel, measurementLabel, unitLabel } from '../i18n/catalogueLabels';
import APlusVisuals from './APlusVisuals';
import {applySeo,canonicalUrl,SITE_URL,productSeoTitle} from '../services/seo';
export default function APlusProductContent({product}:{product:ApiProductTemplate}){
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW',c=product.metadata?.listingContent||{},[related,setRelated]=useState<ApiProductTemplate[]>([]);
 useEffect(()=>{loadCatalogue().then(items=>setRelated(items.filter(p=>p.id!==product.id).slice(0,4))).catch(()=>{})},[product.id]);
 useEffect(()=>{applySeo({path:'/product/'+product.id,ar,title:productSeoTitle((ar?product.seoTitleAr:product.seoTitle)||(ar?product.nameAr:product.name),ar),description:(ar?product.metaDescriptionAr:product.metaDescription)||(ar?product.descriptionAr:product.description)||product.name,image:product.imageUrl,type:'product'})},[product,ar]);
 const text=(key:string)=>c[key+(ar?'_ar':'_en')],labels:Record<string,string>={reference:ar?'مرجع المنتج':'Product reference',family:ar?'فئة المنتج':'Product family',length:ar?'الأطوال المختارة':'Selected lengths',sheet:ar?'أبعاد اللوح':'Sheet dimensions',packaging:ar?'التعبئة':'Packaging',colour_preference:ar?'تفضيلات الألوان':'Colour preferences'};
 const display=(value:string,key:string)=>ar?(key==='colour_preference'?value.split(' — ')[0].split(/[,،]/).map(v=>colourLabel(v.trim(),true)).join('، ')+' — يؤكد اللون عند التوريد':value.replace(/\b(mm|cm|in|yard|kg|g|m)\b/g,u=>unitLabel(u,true))):value;
 const schema={'@context':'https://schema.org','@graph':[{'@type':'Product',name:ar?product.nameAr:product.name,description:ar?product.descriptionAr:product.description,productID:product.code,image:product.imageUrl?[new URL(product.imageUrl,SITE_URL).href]:undefined,url:canonicalUrl('/product/'+product.id,ar)},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:ar?'الرئيسية':'Home',item:canonicalUrl('/',ar)},{'@type':'ListItem',position:2,name:ar?'المنتجات':'Products',item:canonicalUrl('/shop',ar)},{'@type':'ListItem',position:3,name:ar?product.nameAr:product.name,item:canonicalUrl('/product/'+product.id,ar)}]}]};
 return <section data-testid="a-plus-content" className="a-plus-content"><script type="application/ld+json">{JSON.stringify(schema).replaceAll('<','\u003c')}</script>
 <div className="a-plus-intro"><p className="catalogue-eyebrow">{ar?'دليل المنتج':'Product guide'}</p><h2>{ar?product.nameAr:product.name}</h2><p>{text('details')}</p></div>
 <APlusVisuals parentId={product.id} excludeUrls={['7883','7895','7896','7900','7901','7902'].includes(product.id)?[]:(product.media||[]).map(m=>m.webpUrl||m.originalUrl)}/>
 <div className="a-plus-columns"><section><h2>{ar?'المواصفات الفنية':'Technical specifications'}</h2><table><tbody>{(c.specifications||[]).map((r:any)=><tr key={r.key}><th>{labels[r.key]||measurementLabel(r.key,ar)}</th><td>{display(ar?r.ar:r.en,r.key)}</td></tr>)}</tbody></table><p className="catalogue-help">{ar?'المقاسات المختارة تحدد الطلب. يعتمد السعر والتوريد على ربط الصنف ووحدة البيع والمخزون الفعلي.':'Selected measurements describe the request. Price and supply depend on exact item identity, selling unit and verified inventory.'}</p></section>
 <section><h2>{ar?'الاستخدامات المناسبة':'Applications'}</h2><p>{text('applications')}</p><h3>{ar?'دليل اختيار المقاس':'Selection guide'}</h3><p>{text('selection')}</p><h3>{ar?'إرشادات الاستخدام':'Handling guidance'}</h3><p>{text('usage')}</p><h3>{ar?'العناية والتخزين':'Care and storage'}</h3><p>{text('care')}</p></section></div>
 <section className="a-plus-faq"><h2>{ar?'أسئلة شائعة':'Frequently asked questions'}</h2>{(text('faq')||[]).map((f:any)=><details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
 {!!related.length&&<section><h2>{ar?'منتجات من الكتالوج المختار':'Explore the selected catalogue'}</h2><div className="a-plus-related">{related.map(p=><Link key={p.id} to={`/product/${p.id}`}><BrandedProductImage src={p.imageUrl} alt={ar?p.nameAr:p.name} loading="lazy"/><strong>{ar?p.nameAr:p.name}</strong></Link>)}</div></section>}
 </section>
}
