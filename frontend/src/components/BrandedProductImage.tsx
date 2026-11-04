import {useLayoutEffect,useRef,useState,type CSSProperties,type ImgHTMLAttributes} from 'react';
import {brandGeometry,brandPlacementFor,hasEmbeddedBranding} from '../services/productBranding';
import './branded-product-image.css';
import {responsiveImage} from '../services/responsiveImages';

// Keep source photographs unchanged; use one approved catalogue-branding layer.
export default function BrandedProductImage({className='',style,src,onLoad,...props}:ImgHTMLAttributes<HTMLImageElement>){
 const branding=import.meta.env.BASE_URL+'images/branding/star-rope-approved-display.webp';
 const frame=useRef<HTMLSpanElement>(null),image=useRef<HTMLImageElement>(null),[geometry,setGeometry]=useState<ReturnType<typeof brandGeometry>>(null);
 const placement=brandPlacementFor(src),embeddedBrand=hasEmbeddedBranding(src);
 useLayoutEffect(()=>{
  let animation=0;const measure=()=>{cancelAnimationFrame(animation);animation=requestAnimationFrame(()=>{if(frame.current&&image.current)setGeometry(brandGeometry(image.current,frame.current,placement))})};
  setGeometry(null);const img=image.current,element=frame.current;
  const observer=new ResizeObserver(measure);if(element)observer.observe(element);if(img){observer.observe(img);img.addEventListener('load',measure);if(img.complete)measure()}
  return()=>{cancelAnimationFrame(animation);observer.disconnect();img?.removeEventListener('load',measure)};
 },[src,placement.position,placement.x,placement.y,placement.width]);
 return <span ref={frame} className={`branded-product-photo ${className}`} style={{...style,'--product-brand-sticker':`url("${branding}")`,'--brand-left':`${geometry?.left||0}px`,'--brand-top':`${geometry?.top||0}px`,'--brand-width':`${geometry?.width||0}px`} as CSSProperties} data-branding="star-rope-approved-v2" data-brand-position={placement.position} data-brand-embedded={embeddedBrand} data-brand-ready={!!geometry}>
  <img {...props} {...responsiveImage(src,props.sizes||(String(props.width)==='600'?'(max-width: 700px) 45vw, (max-width: 1100px) 28vw, 280px':undefined))} ref={image} onLoad={onLoad} style={{width:'100%',height:style?.height||'100%',objectFit:style?.objectFit||'contain',borderRadius:style?.borderRadius}}/>
 </span>;
}
