import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export default function NotFoundPage() {
  const {i18n}=useTranslation();const ar=i18n.language==='ar-KW';
  return <section style={{padding:'64px 24px',maxWidth:800,margin:'0 auto',textAlign:'center'}}>
    <p>404</p><h1>{ar?'الصفحة غير موجودة':'Page Not Found'}</h1>
    <p style={{margin:'20px 0'}}>{ar?'قد يكون الرابط قديماً. يمكنك متابعة التصفح من الكتالوج.':'This link may be out of date. Continue browsing from our catalogue.'}</p>
    <Link to="/shop" className="btn btn-primary">{ar?'العودة إلى الكتالوج':'Back to Catalogue'}</Link>
  </section>;
}
