// Editorial groups of existing public parent references, not new inventory categories.
export const STORE_COLLECTIONS = {
 'star-rope': {en:'Ropes & cordage',ar:'الحبال ومستلزماتها',refs:['ROP-002','ROP-003','ROP-004','ROP-005','ROP-006','ROP-007','ROP-008','ROP-009','ROP-010','ROP-011','ROP-012','ROP-013','ROP-015','ROP-016','ROP-018','ROP-019','ROP-021','ROP-023','ROP-024','ROP-025','ROP-026','ROP-027','ROP-029','ROP-030']},
 'braided-rope': {en:'Braided ropes',ar:'الحبال المجدولة',refs:['ROP-002','ROP-003','ROP-007','ROP-021','ROP-023']},
 'nylon-rope': {en:'Nylon & HDPE ropes',ar:'حبال النايلون وHDPE',refs:['ROP-004','ROP-010','ROP-011','ROP-016']},
 'natural-rope': {en:'Cotton, jute & natural fibres',ar:'القطن والجوت والألياف الطبيعية',refs:['ROP-003','ROP-005','ROP-008','ROP-009','ROP-013','ROP-032','ROP-042','ROP-043','NEW-12']},
 'marine': {en:'Marine enquiry range',ar:'مجموعة الاستفسارات البحرية',refs:['ROP-004','ROP-005','ROP-012','ROP-014','ROP-017','ROP-020']},
 'workshop': {en:'Workshop & project supplies',ar:'مستلزمات الورش والمشاريع',refs:['ROP-007','ROP-010','ROP-014','ROP-016','ROP-017','ROP-018','ROP-020','ROP-024','ROP-029','ROP-038','ROP-044','ROP-045','ROP-046','NEW-07','NEW-08']},
 'packaging': {en:'Packaging & twine',ar:'التعبئة وخيوط الربط',refs:['ROP-022','ROP-028','ROP-032','ROP-037','ROP-042','ROP-043','NEW-01','NEW-02','NEW-04','NEW-05','NEW-09','NEW-10','NEW-11','NEW-12']},
 'ribbons': {en:'Ribbons & trims',ar:'الشرائط ومستلزمات التزيين',refs:['ROP-031','ROP-034','ROP-035','ROP-036','ROP-039','ROP-040','CLIENT-GLITTER-RIBBON','NEW-15']},
 'handles': {en:'Bag handles & laces',ar:'مقابض وأربطة الأكياس',refs:['ROP-037','NEW-04','NEW-05','NEW-09','NEW-10','NEW-11']},
 'decoration': {en:'Decoration & finishing',ar:'التزيين والتشطيب',refs:['ROP-019','ROP-027','ROP-030','ROP-031','ROP-035','ROP-036','NEW-01','NEW-06','CLIENT-GLITTER-RIBBON','NEW-15']},
} as const;
export type CollectionKey=keyof typeof STORE_COLLECTIONS;
export const collectionUrl=(key:CollectionKey)=>'/shop?collection='+key;
export function collectionFor(value:string|null){return value&&Object.hasOwn(STORE_COLLECTIONS,value)?STORE_COLLECTIONS[value as CollectionKey]:undefined;}
export function legacyCollection(params:URLSearchParams):CollectionKey|undefined {
 if(!/^star[ +_-]*rope$/i.test(params.get('brand')||''))return;
 const material=(params.get('material')||'').toLowerCase();
 if(material==='cotton')return 'natural-rope';
 if(['nylon','hdpe'].includes(material))return 'nylon-rope';
 if(params.get('application')==='marine')return 'marine';
 if(params.has('construction')||material==='polypropylene'||material==='polyester')return 'braided-rope';
 return 'star-rope';
}
export const EDITORIAL_IMAGES={
 cotton:'/uploads/client-corrections-20261026/ROP-003--hero.webp',
 detail:'/uploads/client-corrections-20261026/ROP-003--closeup.webp',
 nylon:'/uploads/pricing-a-plus/ROP-004_COLOUR_Yellow_20261020_v1.webp',
 braided:'/uploads/client-corrections-20261026/ROP-003--hero.webp',
 jute:'/uploads/client-approved-20261023/NEW-14--natural-card.webp',
 twine:'/uploads/master46-illustrations/ROP-042_illustration-v1.webp',
 ribbon:'/uploads/master46-illustrations/ROP-036_illustration-v1.webp',
 handles:'/uploads/handle-correction-20261027/NEW-04--bag-royal-blue.webp',
 wire:'/uploads/master46-illustrations/ROP-017_illustration-v1.webp',
 decoration:'/uploads/catalogue-refresh-20261021/ROP-019_COLOUR_Red_v2_20261021-card.webp',
} as const;
