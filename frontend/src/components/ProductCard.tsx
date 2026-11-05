import {useDiscovery} from '../DiscoveryContext';
import {productFacts,factLabel} from '../services/catalogueDiscovery';
import {swatch} from './ColourPicker';
import {colourLabel} from '../i18n/catalogueLabels';
import BrandedProductImage from './BrandedProductImage';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApiProductTemplate } from '../services/api';
import { useStore } from '../StoreContext';
import { quoteItem } from '../services/quoteBasket';
import { useCardSlideshow } from '../services/cardSlideshow';
import {responsiveImage} from '../services/responsiveImages';

const cardImageSizes='(max-width: 767px) calc((100vw - 104px) / 2), (max-width: 1100px) 28vw, 280px';
export default function ProductCard({product,onAdd}:{product:ApiProductTemplate;onAdd:(event:React.MouseEvent,product:ApiProductTemplate)=>void}) {
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW',name=ar?(product.nameAr||product.name):product.name;
 const {dispatch,showToast}=useStore();
 const {openQuick,toggleCompare,compare,toggleSaved,saved}=useDiscovery(),facts=productFacts(product);
 const variant=product.variants?.[0],priced=!!(variant?.pricingStatus==='APPROVED'&&variant.purchaseEligible&&variant.isInStock&&variant.retailPrice!=null);
 const images=useMemo(()=>[...new Set([...(product.metadata?.priorityGallery||[]),product.imageUrl,...(product.cardGallery||[])].filter(Boolean) as string[])],[product.imageUrl,product.cardGallery,product.metadata?.priorityGallery]);
 const [index,setIndex]=useState(0),[visible,setVisible]=useState(false),ref=useRef<HTMLElement>(null);
 const {playing}=useCardSlideshow();
 useEffect(()=>{const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{rootMargin:'0px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect()},[]);
 useEffect(()=>{if(!visible||!playing||images.length<2)return;const timer=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%images.length)},5000);return()=>clearInterval(timer)},[visible,playing,images.length]);
 useEffect(()=>{if(visible&&images.length>1){const next=new Image(),source=responsiveImage(images[(index+1)%images.length],cardImageSizes);if(source.srcSet){next.sizes=source.sizes!;next.srcset=source.srcSet}next.src=source.src||''}},[index,images,visible]);
 const image=images[index%images.length];
 const description=(ar?product.cardDescriptionAr:product.cardDescription)||(ar?product.descriptionAr:product.description)||'';
 return <article ref={ref} className="card product-card" data-product-id={product.id}>
  <div className="product-card-gallery">
   <Link className="product-card-media" to={`/product/${product.id}`} aria-label={name}>
    {image?<BrandedProductImage src={image} alt={name} width="600" height="600" sizes={cardImageSizes} loading="lazy" decoding="async"/>:<span className="material-symbols-outlined" aria-hidden="true">image</span>}
   </Link>
  </div>
  <div className="product-card-body">
   <Link to={`/product/${product.id}`}><h3>{name}</h3></Link>
   <p className="product-card-description">{description}</p>
   {!!facts.colour.length&&<div className="v2-card-swatches" aria-label={ar?"تفضيلات الألوان للتأكيد":"Colour preferences to confirm"}>{facts.colour.slice(0,5).map(c=><span key={c} title={colourLabel(c,ar)} style={{background:swatch(c)}}/>)}{facts.colour.length>5&&<small>+{facts.colour.length-5}</small>}</div>}
   {!!facts.diameter.length&&<p className="v2-card-spec">{facts.diameter.slice(0,3).map(v=>factLabel(v,'diameter',ar)).join(" · ")}{facts.diameter.length>3?" …":""}</p>}
   <div className="product-card-price">{priced?<><b dir="ltr">{Number(variant!.retailPrice).toFixed(3)} KWD</b><small>{variant!.sellingUnit}</small></>:<span>{ar?'السعر حسب الطلب':'Price on enquiry'}</span>}</div>
   <Link to={`/product/${product.id}`} className="im-card-options">{ar?'عرض المواصفات':'View options'}<span className="material-symbols-outlined im-direction" aria-hidden="true">arrow_forward</span></Link>
   {priced?<button className="btn btn-primary product-card-action" onClick={e=>onAdd(e,product)}>{ar?'أضف إلى السلة':'Add to Cart'}</button>:<button data-testid="card-add-quote" className="btn btn-primary product-card-action" onClick={()=>{dispatch({type:'ADD_TO_RFQ',payload:quoteItem(product,{pageUrl:new URL((window.location.hash?'#/product/':'/product/')+product.id,window.location.href).href})});showToast(ar?'أضيف إلى طلب عرض السعر':'Added to quote basket','request_quote')}}>{ar?'أضف لعرض السعر':'Add to Quote'}</button>}
   <div className="v2-card-tools"><button type="button" onClick={()=>openQuick(product)}>{ar?"عرض سريع":"Quick view"}</button><button type="button" aria-pressed={compare.includes(product.id)} onClick={()=>toggleCompare(product.id)}>{ar?"مقارنة":"Compare"}</button><button type="button" aria-pressed={saved.includes(product.id)} aria-label={ar?"حفظ المنتج":"Save product"} onClick={()=>toggleSaved(product.id)}>{saved.includes(product.id)?"♥":"♡"}</button></div>
  </div>
 </article>;
}
