import React from 'react';
import {renderToPipeableStream,renderToString} from 'react-dom/server';
import {PassThrough} from 'node:stream';
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
 const tree=<React.StrictMode><MemoryRouter basename={base||'/'} initialEntries={[base+(route==='/'?'/':route)]}><I18nextProvider i18n={i18n}><AuthProvider><StoreProvider><DiscoveryProvider><App/></DiscoveryProvider></StoreProvider></AuthProvider></I18nextProvider></MemoryRouter></React.StrictMode>;
 return await new Promise<string>((resolve,reject)=>{
  const output=new PassThrough();
  output.resume();output.on('end',()=>{try{const html=renderToString(tree);if(html.includes('<!--$!-->')||html.includes('<!--$?-->'))throw Error('Incomplete storefront render: '+route);resolve(html)}catch(error){reject(error)}});output.on('error',reject);
  const stream=renderToPipeableStream(tree,{onAllReady(){stream.pipe(output)},onError(error){reject(error)}});
 });
}
