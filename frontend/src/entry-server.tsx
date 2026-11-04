import React from 'react';
import {renderToReadableStream} from 'react-dom/server.browser';
import {MemoryRouter} from 'react-router-dom';
import {I18nextProvider} from 'react-i18next';
import App from './App';
import i18n from './i18n';
import {AuthProvider} from './AuthContext';
import {StoreProvider} from './StoreContext';
import {DiscoveryProvider} from './DiscoveryContext';
import {api} from './services/api';
import {setInitialCatalogue,type InitialCatalogue} from './services/initialCatalogue';
export const transformProduct=(product:any)=>api.transformProduct(product);
export async function renderStorefront(route:string,ar:boolean,initial:InitialCatalogue){
 setInitialCatalogue(initial);
 await i18n.changeLanguage(ar?'ar-KW':'en');
 const base=ar?'':'/en';
 const stream=await renderToReadableStream(<React.StrictMode><MemoryRouter basename={base||'/'} initialEntries={[base+(route==='/'?'/':route)]}><I18nextProvider i18n={i18n}><AuthProvider><StoreProvider><DiscoveryProvider><App/></DiscoveryProvider></StoreProvider></AuthProvider></I18nextProvider></MemoryRouter></React.StrictMode>);
 await stream.allReady;
 return await new Response(stream).text();
}
