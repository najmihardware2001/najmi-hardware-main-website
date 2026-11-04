import {createContext,lazy,Suspense,useContext,useEffect,useState,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import type {RfqItem} from './store';
import {hasPrerender} from './services/initialCatalogue';
import type {ApiProductTemplate} from './services/api';
import {readIds,writeLocal} from './services/catalogueDiscovery';
const QuickView=lazy(()=>import('./components/ProductQuickView'));
type Discovery={selections:RfqItem[];saveSelection:(item:RfqItem)=>void;removeSelection:(item:RfqItem)=>void;compare:string[];saved:string[];recent:string[];toggleCompare:(id:string)=>void;toggleSaved:(id:string)=>void;visit:(id:string)=>void;openQuick:(p:ApiProductTemplate,editing?:RfqItem,forceQuote?:boolean)=>void;closeQuick:()=>void};
const Context=createContext<Discovery>(null!);
export const useDiscovery=()=>useContext(Context);
export function DiscoveryProvider({children}:{children:ReactNode}){
 const [selections,setSelections]=useState<RfqItem[]>(()=>{if(hasPrerender())return [];try{const saved=JSON.parse(localStorage.getItem('najmi.saved-selections')||'[]');return Array.isArray(saved)?saved.filter(i=>typeof i?.productId==='string'&&Number.isFinite(i?.quantity)&&i.quantity>0).slice(0,30):[]}catch{return []}});
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW';
 const [compare,setCompare]=useState(()=>hasPrerender()?[]:readIds('najmi.compare').slice(0,3)),[saved,setSaved]=useState(()=>hasPrerender()?[]:readIds('najmi.saved')),[recent,setRecent]=useState(()=>hasPrerender()?[]:readIds('najmi.recent')),[quick,setQuick]=useState<{product:ApiProductTemplate;editing?:RfqItem;forceQuote?:boolean}|null>(null),[notice,setNotice]=useState('');
 useEffect(()=>{if(!hasPrerender())return;const c=readIds('najmi.compare').slice(0,3),s=readIds('najmi.saved'),r=readIds('najmi.recent');if(c.length)setCompare(c);if(s.length)setSaved(s);if(r.length)setRecent(r);try{const stored=JSON.parse(localStorage.getItem('najmi.saved-selections')||'[]');if(Array.isArray(stored)&&stored.length)setSelections(stored.filter(i=>typeof i?.productId==='string'&&Number.isFinite(i.quantity)&&i.quantity>0).slice(0,30))}catch{}},[]);
 const toggleCompare=(id:string)=>setCompare(old=>{if(!old.includes(id)&&old.length>=3){setNotice(ar?'يمكن مقارنة ثلاثة منتجات كحد أقصى.':'Compare up to three products. Remove one to add another.');return old}const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];writeLocal('najmi.compare',next);setNotice('');return next});
 const toggleSaved=(id:string)=>setSaved(old=>{const next=old.includes(id)?old.filter(x=>x!==id):[id,...old].slice(0,30);writeLocal('najmi.saved',next);return next});
 const visit=(id:string)=>setRecent(old=>{const next=[id,...old.filter(x=>x!==id)].slice(0,12);writeLocal('najmi.recent',next);return next});
 const saveSelection=(item:RfqItem)=>{setSelections(old=>{const next=[item,...old.filter(v=>v.productId!==item.productId||v.selectionKey!==item.selectionKey)].slice(0,30);writeLocal('najmi.saved-selections',next);return next});if(!saved.includes(item.productId))toggleSaved(item.productId)};
 const removeSelection=(item:RfqItem)=>setSelections(old=>{const next=old.filter(v=>v.productId!==item.productId||v.selectionKey!==item.selectionKey);writeLocal('najmi.saved-selections',next);return next});
 return <Context.Provider value={{selections,saveSelection,removeSelection,compare,saved,recent,toggleCompare,toggleSaved,visit,openQuick:(product,editing,forceQuote)=>setQuick({product,editing,forceQuote}),closeQuick:()=>setQuick(null)}}>{children}{notice&&<div className="v2-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label={ar?'إغلاق':'Dismiss'}>×</button></div>}{!!compare.length&&<nav className="v2-compare-tray" aria-label={ar?'المنتجات للمقارنة':'Products to compare'}><span>{ar?'المقارنة':'Compare'} {compare.length}/3</span><Link to="/compare" onClick={()=>setQuick(null)}>{ar?'عرض المقارنة':'View comparison'} →</Link><button onClick={()=>{setCompare([]);writeLocal('najmi.compare',[])}}>{ar?'مسح':'Clear'}</button></nav>}{quick&&<Suspense fallback={<div role="status" className="v2-notice">{ar?'جارٍ التحميل…':'Loading quick view…'}</div>}><QuickView product={quick.product} editing={quick.editing} forceQuote={quick.forceQuote} onClose={()=>setQuick(null)}/></Suspense>}</Context.Provider>;
}
