import type {ApiProductTemplate} from './api';
export type InitialCatalogue={products:ApiProductTemplate[];product?:ApiProductTemplate;configuration?:any;visuals?:any};
let initial:InitialCatalogue|undefined;
export function setInitialCatalogue(value:InitialCatalogue){initial=value;}
export function getInitialCatalogue():InitialCatalogue{
 if(initial)return initial;
 if(typeof document!=='undefined'){
  const element=document.getElementById('najmi-initial-catalogue');
  if(element){initial=JSON.parse(element.textContent||'{}');return initial!;}
 }
 return {products:[]};
}
export const hasPrerender=()=>typeof document!=='undefined'&&document.getElementById('root')?.dataset.prerender==='true';
