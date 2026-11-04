import {Link,useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import content from '../../content/search-pages.json';
import NotFoundPage from './NotFoundPage';
export default function GuidePage(){
 const {guideSlug}=useParams(),{i18n}=useTranslation(),ar=i18n.language==='ar-KW';
 const guide=content.guides.find(g=>g.slug===guideSlug);
 if(!guide)return <NotFoundPage/>;
 return <article className="im-wrap seo-guide"><p className="im-eyebrow">NAJMI / {ar?'دليل الاختيار':'BUYING GUIDE'}</p><h1>{ar?guide.ar:guide.en}</h1><p className="seo-guide-intro">{ar?guide.descriptionAr:guide.descriptionEn}</p>{guide.sections.map((section,i)=><section key={i}><h2>{ar?section.ar:section.en}</h2><p>{ar?section.bodyAr:section.bodyEn}</p></section>)}<aside className="seo-guide-cta"><h2>{ar?'اختر المنتج وحدد متطلباتك':'Find the product and specify your requirements'}</h2><Link className="btn btn-primary" to={'/collections/'+guide.collection}>{ar?'تصفح المنتجات ذات الصلة':'Explore related products'}</Link><Link className="im-text-link" to="/bulk-quote">{ar?'طلب عرض سعر بالجملة':'Build a bulk quote'}</Link></aside><nav aria-label={ar?'أدلة أخرى':'More buying guides'}>{content.guides.filter(g=>g.slug!==guide.slug).map(g=><Link key={g.slug} to={'/guides/'+g.slug}>{ar?g.ar:g.en}</Link>)}</nav></article>;
}
