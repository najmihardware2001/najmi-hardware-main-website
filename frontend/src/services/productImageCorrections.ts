// Versioned presentation replacements. Source catalogue images and records remain
// available; both the product gallery and configuration preview use the same map.
const corrected:Record<string,string>={
 '/uploads/pricing-a-plus/ROP-003_COLOUR_Black_v1.webp':'/uploads/cotton-upright-20261028/ROP-003--black-upright.webp',
 '/uploads/pricing-a-plus/ROP-003_COLOUR_White_20261020_v1.webp':'/uploads/cotton-upright-20261028/ROP-003--white-upright.webp',
};
export function correctedProductImages<T>(value:T):T{
 if(typeof value==='string'){
  const direct=corrected[value];if(direct)return direct as T;
  for(const [source,target] of Object.entries(corrected)){
   for(const suffix of ['-card','-thumb'])if(value===source.replace('.webp',suffix+'.webp'))return target.replace('.webp',suffix+'.webp') as T;
  }
  return value;
 }
 if(Array.isArray(value))return value.map(correctedProductImages) as T;
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,correctedProductImages(item)])) as T;
 return value;
}
