import { useTranslation } from 'react-i18next';
import arabic from './storefront-ar.json';

/** Translate visible copy without changing routes, identifiers, or selector values. */
export function useStorefrontCopy() {
  const { i18n } = useTranslation();
  return (text: string) => i18n.language === 'ar-KW'
    ? (arabic as Record<string, string>)[text] || text
    : text;
}
