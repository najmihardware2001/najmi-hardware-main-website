export type ShopSession = { search: string; category: string; brand: string; material: string; colour: string; sort: 'featured'|'price-asc'|'price-desc'|'name-asc' };
const key='najmi-shop-session-v3';
export function readShopSession(): Partial<ShopSession> {
  try {
    const data=JSON.parse(sessionStorage.getItem(key)||'{}'),safe:Record<string,string>={};
    for(const field of ['search','category','brand','material','colour','sort']) if(typeof data[field]==='string'&&data[field].length<300)safe[field]=data[field];
    if(!['featured','price-asc','price-desc','name-asc'].includes(safe.sort))delete safe.sort;
    // Old marketing links saved a display name rather than a real brand filter.
    if(/^star[ +_-]*rope$/i.test(safe.brand||'')){delete safe.brand;delete safe.material;}
    return safe;
  } catch { return {}; }
}
export function saveShopSession(value:ShopSession) { try { sessionStorage.setItem(key,JSON.stringify(value)); } catch { /* Keep the current in-memory filters. */ } }
