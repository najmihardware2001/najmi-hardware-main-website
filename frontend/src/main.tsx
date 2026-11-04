import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import {DiscoveryProvider} from './DiscoveryContext';
import { AuthProvider } from './AuthContext';
import { StoreProvider } from './StoreContext';
import './local-fonts.css';
import './index.css';
import './responsive.css';
import './catalogue-refresh.css';
import './industrial-minimal.css';
import './website-v2.css';
import './search-pages.css';
import './i18n';
import i18n from './i18n';
import {LANGUAGE_BASE} from './services/seo';

i18n.changeLanguage(LANGUAGE_BASE ? 'en' : 'ar-KW');
i18n.on('languageChanged',language=>{
  const base=language==='ar-KW'?'':'/en';
  if(base===LANGUAGE_BASE)return;
  const path=location.pathname.slice(LANGUAGE_BASE.length)||'/';
  location.assign(base+path+location.search+location.hash);
});

const root=document.getElementById('root')!;
const tree=(
  <React.StrictMode>
    <BrowserRouter basename={LANGUAGE_BASE||'/'}>
      <AuthProvider>
        <StoreProvider>
          <DiscoveryProvider><App /></DiscoveryProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
// Let the complete server-rendered page paint before attaching interactions.
if(root.dataset.prerender==='true')requestAnimationFrame(()=>setTimeout(()=>ReactDOM.hydrateRoot(root,tree),0));else ReactDOM.createRoot(root).render(tree);
