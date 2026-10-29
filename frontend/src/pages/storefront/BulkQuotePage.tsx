import {useEffect,useState} from 'react';
import {useTranslation} from 'react-i18next';
import {loadCatalogue,searchScore,productName,reference} from '../../services/catalogueDiscovery';
import {useDiscovery} from '../../DiscoveryContext';
import {useStore} from '../../StoreContext';
import type {ApiProductTemplate} from '../../services/api';
import RfqBasketPage from './RfqBasketPage';
export default function BulkQuotePage(){
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW',say=(en:string,a:string)=>ar?a:en,{openQuick}=useDiscovery(),{state}=useStore();
 const [query,setQuery]=useState(''),[products,setProducts]=useState<ApiProductTemplate[]>([]),[error,setError]=useState('');
 useEffect(()=>{loadCatalogue().then(setProducts).catch(()=>setError(say('Catalogue unavailable. Reload to retry.','الكتالوج غير متاح. أعد التحميل للمحاولة مجدداً.')))},[]);
 const results=query.trim()?products.filter(p=>searchScore(p,query)>0).sort((a,b)=>searchScore(b,query)-searchScore(a,query)).slice(0,8):[];
 return <div className="v2-page"><section className="im-wrap v2-bulk-intro"><p className="im-eyebrow">NAJMI / {say('TRADE REQUIREMENTS','متطلبات التجارة')}</p><h1>{say('One project. One clear request.','مشروع واحد. طلب واضح.')}</h1><p>{say('Search a product or SKU, choose its specification and quantity, then add another line. Review the combined request below.','ابحث عن منتج أو رمز صنف واختر المواصفات والكمية ثم أضف صنفاً آخر. راجع الطلب المجمع أدناه.')}</p><ol className="v2-bulk-steps"><li>{say('Find a product','ابحث عن المنتج')}</li><li>{say('Configure & add','حدد المواصفات وأضف')}</li><li>{say('Review & send','راجع وأرسل')}</li></ol><label className="v2-bulk-search">{say('Add another product / SKU','أضف منتجاً آخر / رمز صنف')}<input type="search" data-testid="bulk-search" placeholder={say('e.g. ROP-003, ribbon, cord…','مثلاً ROP-003 أو شريط أو حبل…')} value={query} onChange={e=>setQuery(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}{query&&<div className="v2-bulk-results">{results.map(p=><button key={p.id} onClick={()=>openQuick(p,undefined,true)}><img src={p.imageUrl} alt="" width="56" height="56"/><span><strong>{productName(p,ar)}</strong><small>{reference(p)}</small></span><b>{say('Configure +','حدد المواصفات +')}</b></button>)}{!results.length&&<p>{say('No match. Try a product name or enter your requirement in the notes below.','لا توجد مطابقة. جرّب اسم المنتج أو أضف متطلباتك في الملاحظات أدناه.')}</p>}</div>}<a className="btn btn-outline" href="#bulk-review">{say('Review request','راجع الطلب')} ({state.rfqBasket.length}) ↓</a></section><div id="bulk-review"><RfqBasketPage embedded/></div></div>;
}
