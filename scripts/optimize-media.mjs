import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),publicDir=path.join(root,'frontend/public');
const data=JSON.parse(fs.readFileSync(path.join(root,'catalogue/public-catalogue.json'),'utf8'));
const sources=new Set([...JSON.stringify(data).matchAll(/"(\/(?:uploads|images)\/[^"?]+\.(?:webp|png|jpe?g))"/gi)].map(m=>m[1]));
sources.add('/images/branding/najmi-logo.jpg');
const map={},entries=[...sources].sort();let count=0;
fs.mkdirSync(path.join(publicDir,'images/optimized'),{recursive:true});
async function processImage(src){
 const input=path.join(publicDir,src);if(!fs.existsSync(input))return;
 const bytes=fs.readFileSync(input),hash=createHash('sha256').update(bytes).digest('hex').slice(0,16),meta=await sharp(bytes).metadata();
 if(!meta.width||!meta.height)return;
 const widths=(src.includes('najmi-logo')?[80]:[240,320,480,960]).filter(w=>w<=meta.width);
 if(!widths.length)return;
 const variants=[];
 for(const width of widths){const url=`/images/optimized/${hash}-${width}.webp`,file=path.join(publicDir,url);if(!fs.existsSync(file))await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:76,effort:4}).toFile(file);variants.push({url,width})}
 map[src]={variants,width:meta.width,height:meta.height};count++;
}
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{while(cursor<entries.length)await processImage(entries[cursor++])}));
fs.writeFileSync(path.join(root,'frontend/src/content/responsive-images.json'),JSON.stringify(map));
console.log(JSON.stringify({optimizedSources:count,variants:Object.values(map).reduce((n,v)=>n+v.variants.length,0)}));
