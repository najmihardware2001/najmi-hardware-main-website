import type {ReactNode} from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collectionUrl,STORE_COLLECTIONS,type CollectionKey } from '../services/storeCollections';
import { BUSINESS_CONTACTS,generalQuoteUrl } from '../services/businessContacts';
import BrandedProductImage from './BrandedProductImage';
import './company-pages.css';

export function useCompanyCopy(){const {i18n}=useTranslation();const ar=i18n.language==='ar-KW';return {ar,say:(en:string,arabic:string)=>ar?arabic:en};}
export function CompanyHero({eyebrow,title,description,image,alt,children}:{eyebrow:string;title:string;description:string;image:string;alt:string;children:ReactNode}){
 return <section className="company-hero im-wrap"><div className="company-hero-copy"><p className="company-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="company-lead">{description}</p><div className="company-actions">{children}</div></div><figure className="company-hero-photo"><BrandedProductImage src={image} alt={alt} width="1200" height="1200"/><figcaption>NAJMI / STAR ROPE</figcaption></figure></section>;
}
export function CompanyHeading({eyebrow,title,description}:{eyebrow:string;title:string;description?:string}){return <div className="company-section-heading"><p className="company-eyebrow">{eyebrow}</p><h2>{title}</h2>{description&&<p>{description}</p>}</div>;}
export function CollectionTile({group,image,description}:{group:CollectionKey;image:string;description:string}){const {ar,say}=useCompanyCopy(),c=STORE_COLLECTIONS[group];return <Link className="company-collection" to={collectionUrl(group)} data-collection={group}><div className="company-collection-photo"><BrandedProductImage src={image} alt={ar?c.ar:c.en} width="600" height="600" loading="lazy"/></div><div className="company-collection-copy"><h3>{ar?c.ar:c.en}</h3><p>{description}</p><span>{say('Explore collection','استكشف المجموعة')} <span aria-hidden="true" className="material-symbols-outlined im-direction">arrow_forward</span></span></div></Link>;}
export function CompanySteps({steps}:{steps:{title:string;description:string}[]}){return <ol className="company-steps">{steps.map((s,i)=><li key={s.title}><span className="company-step-number">0{i+1}</span><h3>{s.title}</h3><p>{s.description}</p></li>)}</ol>;}
export function CompanyContact({title,description}:{title:string;description:string}){const {ar,say}=useCompanyCopy();return <section className="company-contact im-wrap"><div><p className="company-eyebrow">{say('LET’S SPECIFY IT','لنحدد المواصفات')}</p><h2>{title}</h2><p>{description}</p></div><div className="company-contact-actions"><a className="btn company-primary" href={generalQuoteUrl(ar)} target="_blank" rel="noopener noreferrer">{say('Discuss your requirements','ناقش متطلباتك')}<span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span></a><a className="company-phone" href={'tel:'+BUSINESS_CONTACTS.owner.phone} dir="ltr">{BUSINESS_CONTACTS.owner.displayPhone}</a></div></section>;}
