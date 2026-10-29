import rawProducts from '../products.json';
import type { Product, ProductVariant } from '../store';
import { getGalleryImages } from './imageMap';

export function generateProducts(): Product[] {
  return rawProducts.map((base, index) => {
    const product: Product = {
      id: base.id,
      name: base.name,
      nameAr: base.name_ar || '',
      category: base.category,
      categoryTag: base.category,
      categoryTagAr: base.category_ar || base.category,
      material: base.material,
      materialAr: base.material_ar || base.material,
      description: base.description,
      descriptionAr: base.description_ar || base.description,
      shortDesc: base.short_description || base.description.substring(0, 100) + '...',
      shortDescAr: base.short_description_ar || (base.description_ar ? base.description_ar.substring(0, 100) + '...' : ''),
      images: getGalleryImages(base.material, index), 
      variants: [],
      tags: base.applications || [],
      tagsAr: base.applications_ar || [],
      isVerified: base.is_verified_najmi_stock,
      isActive: true,
      stock: base.inventory_demo,
      lowStockThreshold: 10,
      createdAt: new Date().toISOString(),
      brand: base.brand,
      origin: base.origin === 'India' ? 'Manufactured' : (base.origin === 'Unverified' ? 'Imported' : 'Imported'),
      manufacturer: base.origin === 'India' ? 'NAJMI Hardware Plant' : 'Global Partner',
      countryOfOrigin: base.origin === 'India' ? 'India' : 'Various',
    };

    let totalStock = 0;

    base.roll_lengths_yards.forEach((length: number) => {
      base.colors_available.forEach((color: string) => {
        const ratio = length / base.default_roll_length_yards;
        const retailPrice = base.retail_price_kwd_demo * ratio;
        const variantStock = Math.max(0, base.inventory_demo - (length === 200 ? 5 : 0));

        const variant: ProductVariant = {
          id: `var-${base.id}-${length}-${color.toLowerCase()}`,
          diameter: `${base.diameter_mm}mm`,
          length: `${length} yards`,
          color: color,
          unit: base.unit,
          retailPrice: retailPrice,
          wholesaleMinQty: base.quantity_tiers_demo?.[1]?.min_qty || 10,
          sku: `${base.sku}-${length}-${color.substring(0, 3).toUpperCase()}`,
          stock: variantStock
        };

        product.variants.push(variant);
        totalStock += variantStock;
      });
    });

    product.stock = totalStock;
    return product;
  });
}
