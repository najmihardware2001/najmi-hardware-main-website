import {api,type ApiProductTemplate} from './api';
import {colourLabel,unitLabel} from '../i18n/catalogueLabels';

export const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const unique=(values:unknown[])=>[...new Set(values.filter((v):v is string=>typeof v==='string'&&!!v.trim()))];
export function productFacts(p:ApiProductTemplate){
 const specs=p.metadata?.listingContent?.specifications||[];
 const field=(key:string)=>unique(specs.filter((s:any)=>s.key===key).flatMap((s:any)=>String(s.en||'').split(/,\s*/)));
 return {
  material:unique([...(p.metadata?.discovery?.materials||[]),...(p.variants||[]).map(v=>v.material)]),
  construction:unique([...(p.metadata?.discovery?.constructions||[]),...(p.variants||[]).map(v=>v.strandConstruction)]),
  diameter:unique([...field('diameter'),...(p.variants||[]).filter(v=>v.diameterMm!=null).map(v=>`${v.diameterMm} mm`)]),
  length:unique([...field('length'),...(p.variants||[]).filter(v=>v.lengthValue!=null).map(v=>`${v.lengthValue} ${v.lengthUnit||''}`)]),
  colour:unique([...(p.metadata?.enquiryColours||[]),...(p.variants||[]).map(v=>v.color),...(p.media||[]).map(m=>m.colour)]),
  application:unique([p.metadata?.listingContent?.applications_en]),
 };
}
export type Facet=keyof ReturnType<typeof productFacts>;
export function factLabel(value:string,facet:Facet,ar:boolean,product?:ApiProductTemplate):string{
 if(!ar)return value;
 if(facet==='colour')return colourLabel(value,true);
 if(facet==='application')return product?.metadata?.listingContent?.applications_ar||value;
 if(facet==='diameter'||facet==='length')return value.replace(/\b(mm|cm|in|yard|kg|g|m)\b/g,u=>unitLabel(u,true));
 const labels:Record<string,string>={Cotton:'قطن',Nylon:'نايلون',Polyester:'بوليستر',Polypropylene:'بولي بروبيلين',HDPE:'HDPE',Braided:'مجدول',Twisted:'مفتول',Jute:'جوت',Sisal:'سيزال',Manila:'مانيلا'};
 return labels[value]||value;
}
export const facetKeys:Facet[]=['material','construction','diameter','length','colour','application'];
export function matchesFacets(p:ApiProductTemplate,filters:Partial<Record<Facet,string>>){const f=productFacts(p);return facetKeys.every(k=>!filters[k]||f[k].some(v=>normalize(v)===normalize(filters[k]!)));}
function editOne(a:string,b:string){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,edits=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++}return edits+(a.length-i)+(b.length-j)<=1;}
export function searchScore(p:ApiProductTemplate,query:string){
 const q=normalize(query);if(!q)return 1;
 const f=productFacts(p),names=normalize([p.name,p.nameAr,p.code,p.metadata?.parentReference,...(p.metadata?.discovery?.skus||[]),...(p.variants||[]).map(v=>v.sku)].join(' '));
 const body=normalize([names,p.category?.name,p.category?.nameAr,...f.material,...f.construction,...f.colour,p.description,p.descriptionAr,...(p.metadata?.listingContent?.search_terms||[])].join(' '));
 const words=body.split(' '),terms=q.split(' ');
 if(!terms.every(t=>body.includes(t)||(t.length>=5&&words.some(w=>editOne(t,w)))))return 0;
 return names.includes(q)?100:body.includes(q)?50:10;
}
let catalogue:Promise<ApiProductTemplate[]>|undefined;
// Shared five-minute public cache; failures do not poison subsequent retries.
export function loadCatalogue(){if(!catalogue){catalogue=api.getStorefrontProducts({take:100}).then(r=>{setTimeout(()=>{catalogue=undefined},300000);return r.items}).catch(e=>{catalogue=undefined;throw e})}return catalogue;}
export const productName=(p:ApiProductTemplate,ar:boolean)=>ar?(p.nameAr||p.name):p.name;
export const reference=(p:ApiProductTemplate)=>p.metadata?.parentReference||p.code;
export function readIds(key:string):string[]{try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.filter((v:unknown)=>typeof v==='string').slice(0,30):[]}catch{return []}}
export function writeLocal(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{/* Browsing remains functional when storage is unavailable. */}}
