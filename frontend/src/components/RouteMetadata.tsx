import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {applySeo,businessSchema,canonicalUrl,SITE_URL} from '../services/seo';
const titles:Record<string,[string,string]>={
 '/':['Najmi Hardware Kuwait | Ropes & Industrial Supplies Since 2001','نجمي هاردوير الكويت | الحبال والمستلزمات الصناعية منذ 2001'],
 '/shop':['Ropes, Cords & Ribbons in Kuwait | Najmi Hardware','الحبال والخيوط والشرائط في الكويت | نجمي هاردوير'],
 '/find':['Find Rope by Diameter & Length | Najmi Hardware Kuwait','اختيار الحبل حسب القطر والطول | نجمي هاردوير الكويت'],
 '/bulk-quote':['Bulk Rope & Hardware Quotes | Najmi Hardware Kuwait','عروض أسعار الحبال والمعدات بالجملة | نجمي هاردوير الكويت'],
 '/about':['About Najmi Hardware | Established 2001 in Kuwait','عن نجمي هاردوير | تأسست في الكويت عام 2001'],
 '/brands/star-rope':['STAR ROPE Cordage in Kuwait | Najmi Hardware','حبال ستار روب في الكويت | نجمي هاردوير'],
 '/manufacturing':['Rope Materials & Construction | Najmi Hardware Kuwait','خامات الحبال وبنيتها | نجمي هاردوير الكويت'],
 '/industries':['Rope & Cordage Applications | Najmi Hardware Kuwait','استخدامات الحبال والخيوط | نجمي هاردوير الكويت'],
 '/wholesale':['Wholesale Ropes & Supplies in Kuwait | Najmi Hardware','الحبال والمستلزمات بالجملة في الكويت | نجمي هاردوير'],
 '/contact':['Contact Najmi Hardware | Shuwaikh, Kuwait','تواصل مع نجمي هاردوير | الشويخ، الكويت']
};
export default function RouteMetadata(){
 const {pathname,search}=useLocation(),{i18n}=useTranslation(),ar=i18n.language==='ar-KW';
 useEffect(()=>{
  if(pathname.startsWith('/product/'))return;
  const description=ar?'نجمي هاردوير في الشويخ، الكويت، منذ 2001. استكشف الحبال والخيوط ومقابض الأكياس والشرائط واطلب عرض سعر بالمقاس واللون والكمية.':'Najmi Hardware in Shuwaikh, Kuwait, established 2001. Explore ropes, cordage, bag handles and ribbons. Request a quote by size, colour and quantity.';
  applySeo({path:pathname.startsWith('/shop/')?'/shop':pathname,title:titles[pathname]?.[ar?1:0]||(ar?'نجمي هاردوير الكويت':'Najmi Hardware Kuwait'),description,ar,noindex:!titles[pathname]||!!search});
 },[pathname,search,ar]);
 return <><script type="application/ld+json">{JSON.stringify(businessSchema)}</script><script type="application/ld+json">{JSON.stringify({'@context':'https://schema.org','@type':'WebSite','@id':SITE_URL+'/#website',url:canonicalUrl('/',ar),name:'Najmi Hardware',inLanguage:ar?'ar-KW':'en-KW',publisher:{'@id':SITE_URL+'/#business'}})}</script></>;
}
