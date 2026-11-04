import images from '../content/responsive-images.json';
type Entry={variants:{url:string;width:number}[];width:number;height:number};
const lookup=images as Record<string,Entry>;
export function responsiveImage(src:string|undefined,sizes?:string){
 const entry=src?lookup[src]:undefined;
 if(!entry)return {src};
 const variants=entry.variants;
 return {src:variants[Math.min(1,variants.length-1)].url,srcSet:variants.map(v=>`${v.url} ${v.width}w`).join(', '),sizes:sizes||'(max-width: 700px) 92vw, 560px'};
}
