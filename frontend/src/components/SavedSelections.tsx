import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useDiscovery} from '../DiscoveryContext';
import {useStore} from '../StoreContext';
import {quoteDetails} from '../services/quoteBasket';
export default function SavedSelections(){
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW',d=useDiscovery(),{dispatch,showToast}=useStore();
 if(!d.selections.length)return null;
 return <section className="v2-saved-selections"><h2>{ar?'المواصفات المحفوظة':'Saved specifications'}</h2><div>{d.selections.map(item=><article key={item.productId+'|'+item.selectionKey}><p className="im-eyebrow">{item.parentReference||item.productId}</p><h3><Link to={'/product/'+item.productId}>{ar?(item.productNameAr||item.productName):item.productName}</Link></h3>{quoteDetails(item,ar).map(line=><p key={line}>{line}</p>)}<p>{ar?'الكمية':'Quantity'}: {item.quantity}</p><div className="v2-link-row"><button className="btn btn-primary" onClick={()=>{dispatch({type:'ADD_TO_RFQ',payload:item});showToast(ar?'أضيف إلى طلب عرض السعر':'Added to quote basket')}}>{ar?'أضف لعرض السعر':'Add to Quote'}</button><button onClick={()=>d.removeSelection(item)}>{ar?'إزالة':'Remove'}</button></div></article>)}</div></section>;
}
