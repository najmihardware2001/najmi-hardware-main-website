import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Import the five colours confirmed together in the client's 15-ply twine photo.
const root = path.resolve(import.meta.dirname, '..');
const sources = 'C:/Users/lenovo/.codex/generated_images/01a158a3-656b-7931-969e-9d6cb56f5b91';
const review = 'D:/Codex Output/Apna galla production chat (3)/nylon-colour-variants-2026-11-12';
const entries = [
  ['Green', 'أخضر', '#24844c', 'exec-947174eb-7642-4158-88b4-0d3b059d1479.png'],
  ['Blue', 'أزرق', '#2250b8', 'exec-4b36aef6-122e-4e59-a39f-4cb0519852ad.png'],
  ['Red', 'أحمر', '#ce2637', 'exec-94401a80-1aa6-4b65-961e-80d2a27b1679.png'],
  ['Yellow', 'أصفر', '#f6dc29', 'exec-0afda154-da22-44cb-9610-80e0bf43c41a.png'],
  ['Black', 'أسود', '#17191c', 'exec-a7e7aaf4-b8d0-4549-8147-7babc0c93eb3.png'],
];
const file = path.join(root, 'catalogue/public-catalogue.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const product = data.products.find(p => p.id === 7911);
const brandingFile = path.join(root, 'frontend/src/services/embeddedProductBranding.json');
const branding = new Set(JSON.parse(fs.readFileSync(brandingFile, 'utf8')));
fs.mkdirSync(review, {recursive: true});
const photos = [];
for (const [colour, ar, hex, input] of entries) {
  const slug = colour.toLowerCase();
  const source = path.join(sources, input);
  const url = `/uploads/nylon-colours-20261112/NEW-21--${slug}.webp`;
  const dest = path.join(root, 'frontend/public', url);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  fs.copyFileSync(source, path.join(review, `${slug}.png`));
  const meta = await sharp(source).webp({quality: 86, effort: 5}).toFile(dest);
  const order = photos.length + 4;
  photos.push({id: `nylon-7911-${slug}`, url, order, image_order: order,
    width: meta.width, height: meta.height,
    alt_en: `${colour} 15-ply nylon line twine spool on a white background`,
    alt_ar: `بكرة خيط نايلون ${ar} من 15 طبقة بخلفية بيضاء`,
    card_url: url, thumbnail_url: url, colour, color_code: hex,
    variant_id: null, generated: true, content_type: 'COLOUR', review_status: 'CLIENT_AUTHORIZED'});
  branding.add(url);
}
product.images = [...product.images.filter(p => !p.url.startsWith('/uploads/nylon-colours-20261112/')), ...photos];
product.enquiry_colours = entries.map(e => e[0]);
product.updated_at = '2026-11-12T12:00:00.000Z';
const mappings = photos.map(p => ({colour: p.colour, url: p.url, generated: true}));
for (const config of [data.configurations['7911'], ...Object.values(data.spec_configurations['7911'])]) {
  config.colour_preferences = [...product.enquiry_colours];
  config.colour_photos = mappings;
}
data.configurations['7911'].auto_select_single_specification = true;
product.listing_content.specifications = product.listing_content.specifications.map(s => s.key === 'colour_preference'
  ? {...s, en: 'Green, Blue, Red, Yellow, Black', ar: 'أخضر، أزرق، أحمر، أصفر، أسود'} : s);
fs.writeFileSync(file, JSON.stringify(data));
fs.writeFileSync(brandingFile, JSON.stringify([...branding]));
fs.writeFileSync(path.join(review, 'manifest.json'), JSON.stringify({product_id: 7911, tool: 'Built-in image generation', images: photos,
  prompt: 'Create one premium square white-background studio photograph per confirmed colour (green, blue, red, yellow, black), isolating the matching 15-ply nylon twine spool from the supplied client assortment. Preserve fine twisted nylon texture, upright cylindrical spool and dark central hub. Preserve Star Rope paper wraps on blue/red/yellow, plain green/black reference spools. Soft studio lighting and subtle shadow, no props. Exactly one small Star Rope corner watermark at top left. Match the approved shared studio image style.'}, null, 2));
console.log('Imported five colour images for the existing nylon twine product.');
