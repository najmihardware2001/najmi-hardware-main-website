import type {RfqItem} from '../store';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {api,type ApiProductTemplate} from '../services/api';
import {productName,reference} from '../services/catalogueDiscovery';
import AccessibleDialog from './AccessibleDialog';
import BrandedProductImage from './BrandedProductImage';
import MasterProductOptions from './MasterProductOptions';
export default function ProductQuickView({product:initial,onClose,editing,forceQuote}:{product:ApiProductTemplate;onClose:()=>void;editing?:RfqItem;forceQuote?:boolean}){
 const {i18n}=useTranslation(),ar=i18n.language==='ar-KW';
 const [product,setProduct]=useState(initial),[image,setImage]=useState<string|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;api.getStorefrontProductById(initial.id).then(p=>{if(active)setProduct(p)}).catch(()=>{if(active)setError(ar?'تعذر تحديث التفاصيل. افتح صفحة المنتج للمحاولة مجدداً.':'Could not refresh details. Open the product page to retry.')});return()=>{active=false}},[initial.id]);
 return <AccessibleDialog title={ar?'عرض سريع':'Quick view'} onClose={onClose} className="v2-quickview"><div className="v2-quick-content"><BrandedProductImage className="v2-quick-photo" src={image||product.imageUrl} alt={productName(product,ar)} width="600" height="600"/><div><p className="im-eyebrow">{reference(product)}</p><h3>{productName(product,ar)}</h3><p>{(ar?product.descriptionAr:product.description)||''}</p><Link className="im-text-link" onClick={onClose} to={'/product/'+product.id}>{ar?'عرض صفحة المنتج':'View full product'} →</Link></div></div>{error&&<p role="alert">{error}</p>}<MasterProductOptions product={product} onImage={setImage} compact editing={editing} onAdded={onClose} forceQuote={forceQuote}/></AccessibleDialog>;
}
