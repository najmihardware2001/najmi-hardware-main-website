import fs from 'node:fs';

// A publishing guard: newly imported products need the same complete A+ content.
const {products}=JSON.parse(fs.readFileSync(new URL('../catalogue/public-catalogue.json',import.meta.url),'utf8'));
const failures=[];
for(const p of products){
 const c=p.listing_content||{};
 for(const lang of ['en','ar']){
  for(const key of ['description','details','applications','selection','usage','care'])if(!c[`${key}_${lang}`]?.trim())failures.push(`${p.id}: ${key}_${lang}`);
  if(!Array.isArray(c[`features_${lang}`])||c[`features_${lang}`].length<3)failures.push(`${p.id}: features_${lang}`);
  if(!Array.isArray(c[`faq_${lang}`])||c[`faq_${lang}`].length<3||c[`faq_${lang}`].some(f=>!f.q?.trim()||!f.a?.trim()))failures.push(`${p.id}: faq_${lang}`);
  if(p.content_sections?.[lang]?.details!==c[`details_${lang}`])failures.push(`${p.id}: stale ${lang} detail copy`);
 }
 if(!c.specifications?.length||c.specifications.some(s=>!s.key||!s.en?.trim()||!s.ar?.trim()))failures.push(`${p.id}: bilingual specifications`);
}
if(failures.length)throw new Error(`Complete A+ listings before publishing:\n${failures.join('\n')}`);
console.log(`A+ publishing requirements complete for ${products.length} products in English and Arabic.`);
