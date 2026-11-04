import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import localizations
import arCommon from './locales/ar-KW/common.json';
import arNavigation from './locales/ar-KW/navigation.json';
import arProducts from './locales/ar-KW/products.json';
import arCheckout from './locales/ar-KW/checkout.json';
import arWholesale from './locales/ar-KW/wholesale.json';
import arAccount from './locales/ar-KW/account.json';
import arAdmin from './locales/ar-KW/admin.json';

import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enProducts from './locales/en/products.json';
import enCheckout from './locales/en/checkout.json';
import enWholesale from './locales/en/wholesale.json';
import enAccount from './locales/en/account.json';
import enAdmin from './locales/en/admin.json';

const resources = {
  'ar-KW': {
    common: arCommon,
    navigation: arNavigation,
    products: arProducts,
    checkout: arCheckout,
    wholesale: arWholesale,
    account: arAccount,
    admin: arAdmin,
  },
  'en': {
    common: enCommon,
    navigation: enNavigation,
    products: enProducts,
    checkout: enCheckout,
    wholesale: enWholesale,
    account: enAccount,
    admin: enAdmin,
  }
};

// Read the preference before LanguageDetector can cache the browser language.
const savedLanguage = typeof location!=='undefined'&&/^\/en(?:\/|$)/.test(location.pathname)?'en':'ar-KW';

i18n
  // Configure language detector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage && ['ar-KW', 'en'].includes(savedLanguage) ? savedLanguage : 'ar-KW',
    defaultNS: 'common',
    fallbackLng: 'en',
    
    // We only support these
    supportedLngs: ['ar-KW', 'en'],
    
    detection: {
      // Prioritize localStorage to remember manual language switch
      order: ['localStorage', 'navigator'],
      // Only cache user's manual selection in localStorage
      caches: ['localStorage'],
      // Force ar-KW as default if navigator says something else and no cache exists
      lookupLocalStorage: 'i18nextLng'
    },
    
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    }
  });

// Override the initial language logic per requirements:
// On a customer's first visit: Always display Arabic (even if browser is English or outside Kuwait).
// If a user manually changes it, it gets stored in localStorage and loaded next time.


// Update the <html> element lang and dir attributes on language change
const updateHtmlDirection = (lang: string) => {
  if(typeof document==='undefined')return;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar-KW' ? 'rtl' : 'ltr';
};

// Initial setup
updateHtmlDirection(i18n.language || 'ar-KW');

// On change
i18n.on('languageChanged', updateHtmlDirection);

export default i18n;
