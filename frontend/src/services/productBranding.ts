import embedded from './embeddedProductBranding.json';

export type BrandPlacement={position:string;x:number;y:number;width:number;foreground:number};
export function hasEmbeddedBranding(src:string|undefined){
 let key='';try{key=new URL(src||'','https://najmihardware.com/').pathname.replace(/^\/catalogue\//,'/')}catch{return false}
 return (embedded as string[]).includes(key.replace(/-(?:card|thumb)(?=\.[^.]+$)/,''));
}
export function brandPlacementFor(src:string|undefined):BrandPlacement{
 void src;
 return {position:'top-left',x:3,y:3,width:11,foreground:0};
}

// Place relative to the visible photo, including the letterboxing of non-square sources.
export function brandGeometry(image:HTMLImageElement,frame:HTMLElement,placement:BrandPlacement){
 if(!image.naturalWidth||!image.naturalHeight)return null;
 const box=image.getBoundingClientRect(),outer=frame.getBoundingClientRect();
 if(!image.naturalWidth||!image.naturalHeight||!box.width||!box.height)return null;
 const fit=getComputedStyle(image).objectFit;
 let width=box.width,height=box.height;
 if(fit==='contain'||fit==='scale-down'){
  const ratio=Math.min(box.width/image.naturalWidth,box.height/image.naturalHeight,fit==='scale-down'?1:Infinity);
  width=image.naturalWidth*ratio;height=image.naturalHeight*ratio;
 }
 const left=box.left-outer.left+(box.width-width)/2,top=box.top-outer.top+(box.height-height)/2;
 const size=Math.min(width*placement.width/100,76,height*.24),markHeight=size*2/3;
 const x=Math.min(width-size-width*.025,Math.max(width*.025,width*placement.x/100));
 const y=Math.min(height-markHeight-height*.025,Math.max(height*.025,height*placement.y/100));
 return {left:left+x,top:top+y,width:size};
}
