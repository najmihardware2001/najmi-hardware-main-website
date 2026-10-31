// Arabic is the default storefront; English has a stable /en URL.
export const SITE_URL = 'https://najmihardware.com';
export const LANGUAGE_BASE = /^\/en(?:\/|$)/.test(location.pathname) ? '/en' : '';
export function productSeoTitle(title:string|undefined,ar:boolean){
  const value=title||(ar?'نجمي هاردوير الكويت':'Najmi Hardware Kuwait');
  return /najmi hardware|نجمي/i.test(value)?value:value+(ar?' | نجمي هاردوير الكويت':' | Najmi Hardware Kuwait');
}
export function canonicalUrl(path: string, ar = !LANGUAGE_BASE) {
  return SITE_URL + (ar ? '' : '/en') + (path === '/' ? '/' : path.replace(/\/$/, ''));
}
export function applySeo(input: {path:string; title:string; description:string; ar:boolean; image?:string; noindex?:boolean; type?:string}) {
  const {path,title,description,ar}=input,canonical=canonicalUrl(path,ar);
  document.title=title;
  const set=(selector:string,tag:string,attrs:Record<string,string>)=>{
    let el=document.head.querySelector(selector);
    if(!el){el=document.createElement(tag);document.head.append(el)}
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
  };
  set('link[rel="canonical"]','link',{rel:'canonical',href:canonical});
  set('meta[name="description"]','meta',{name:'description',content:description});
  set('meta[name="robots"]','meta',{name:'robots',content:input.noindex?'noindex,follow':'index,follow,max-image-preview:large'});
  const image=new URL(input.image||'/images/branding/najmi-social.jpg',SITE_URL).href;
  for(const [property,content] of Object.entries({'og:title':title,'og:description':description,'og:url':canonical,'og:type':input.type||'website','og:site_name':'Najmi Hardware','og:locale':ar?'ar_KW':'en_KW','og:image':image}))set(`meta[property="${property}"]`,'meta',{property,content});
  for(const [name,content] of Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image}))set(`meta[name="${name}"]`,'meta',{name,content});
  for(const [lang,href] of [['ar-KW',canonicalUrl(path,true)],['en-KW',canonicalUrl(path,false)],['x-default',canonicalUrl(path,true)]])set(`link[rel="alternate"][hreflang="${lang}"]`,'link',{rel:'alternate',hreflang:lang,href});
  document.getElementById('seo-prerender-schema')?.remove();
}
export const businessSchema={
  '@context':'https://schema.org','@type':'HardwareStore','@id':SITE_URL+'/#business',
  name:'Najmi Hardware',alternateName:['NAJMI HARDWARE EST.','مؤسسة النجم للمعدات'],url:SITE_URL+'/',
  foundingDate:'2001',email:['sales@najmihardware.com','info@najmihardware.com','yusuf@najmihardware.com'],telephone:'+96599652718',logo:SITE_URL+'/favicon.png',image:SITE_URL+'/images/branding/najmi-social.jpg',
  address:{'@type':'PostalAddress',addressLocality:'Shuwaikh',addressCountry:'KW'},
  areaServed:{'@type':'Country',name:'Kuwait'},sameAs:['https://www.najmihardware.net/','https://share.google/gRD2drGbOUItmFHs6']
};
