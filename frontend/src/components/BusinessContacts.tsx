import { useTranslation } from 'react-i18next';
import { BUSINESS_CONTACTS, generalQuoteUrl, whatsappUrl } from '../services/businessContacts';

export default function BusinessContacts({ cards = false, product }: { cards?: boolean; product?: string | null }) {
  const { i18n } = useTranslation(), ar = i18n.language === 'ar-KW';
  return <div data-testid="business-contacts" style={{ display: 'grid', gap: cards ? 24 : 16, width: '100%', maxWidth: cards ? 400 : undefined, textAlign: 'start' }}>
    {Object.entries(BUSINESS_CONTACTS).map(([key, contact]) => <section key={key} data-contact={key} style={cards ? { background: '#fff', padding: '20px 24px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', minWidth: 0, color: 'var(--primary)' } : { minWidth: 0 }}>
      <p style={{ fontWeight: 700, margin: '0 0 8px' }}>{ar ? contact.nameAr : contact.name} · {ar ? contact.roleAr : contact.role}</p>
      <a href={`tel:${contact.phone}`} style={{ color: 'inherit', display: 'inline-block', marginBottom: 8 }} dir="ltr">{contact.displayPhone}</a>
      {key === 'sales' && <a href="mailto:yusuf@najmihardware.com" dir="ltr" style={{ color: 'inherit', display: 'block', marginBottom: 8, overflowWrap: 'anywhere' }}>yusuf@najmihardware.com</a>}
      <a href={key === 'owner' ? generalQuoteUrl(ar, product) : whatsappUrl(contact.phone, ar ? 'مرحباً يوسف، أود الاستفسار عن منتجات نجمي هاردوير.' : 'Hello Yusuf, I would like to enquire about Najmi Hardware products.')} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', display: 'block', fontWeight: 600, overflowWrap: 'anywhere' }}>
        {key === 'owner' ? (ar ? 'طلب عرض سعر عبر واتساب' : 'Request a quote on WhatsApp') : (ar ? 'تواصل مع المبيعات عبر واتساب' : 'Contact sales on WhatsApp')}
      </a>
    </section>)}
  </div>;
}
