/**
 * Exact Variant Combination Resolver for Najmi Hardware
 * 
 * Rules:
 * 1. Each valid attribute combination (diameter, length, color, material, etc.)
 *    resolves to exactly ONE genuine SKU variant.
 * 2. Does NOT synthesize combinations that do not exist.
 * 3. Ambiguous combinations (where attributes match multiple variants) return AMBIGUOUS_COMBINATION.
 * 4. Missing combinations return NO_MATCHING_VARIANT.
 */

function normalizeValue(val) {
  if (val === null || val === undefined || val === '') return null;
  return String(val).trim().toLowerCase();
}

function resolveVariantCombination(variants, criteria = {}) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return {
      success: false,
      state: 'NO_VARIANTS',
      message: 'No variants available for this product family'
    };
  }

  // Filter out archived variants
  const activeVariants = variants.filter(v => v.status !== 'ARCHIVED');

  const matches = activeVariants.filter(v => {
    // Check diameter
    if (criteria.diameterMm !== undefined && criteria.diameterMm !== null && criteria.diameterMm !== '') {
      const critDia = Number(criteria.diameterMm);
      const varDia = v.diameter_mm != null ? Number(v.diameter_mm) : null;
      if (varDia !== null && !isNaN(critDia) && Math.abs(varDia - critDia) > 0.01) {
        return false;
      }
    }

    // Check length
    if (criteria.lengthValue !== undefined && criteria.lengthValue !== null && criteria.lengthValue !== '') {
      const critLen = Number(criteria.lengthValue);
      const varLen = v.length_value != null ? Number(v.length_value) : null;
      if (varLen !== null && !isNaN(critLen) && Math.abs(varLen - critLen) > 0.01) {
        return false;
      }
    }

    // Check length unit
    if (criteria.lengthUnit) {
      if (normalizeValue(v.length_unit) !== normalizeValue(criteria.lengthUnit)) {
        return false;
      }
    }

    // Check color
    if (criteria.color) {
      const critColor = normalizeValue(criteria.color);
      const varColor = normalizeValue(v.color);
      const varColorAr = normalizeValue(v.color_ar);
      const varName = normalizeValue(v.name_en);
      if (varColor !== critColor && varColorAr !== critColor && !varName?.includes(critColor)) {
        return false;
      }
    }

    // Check material
    if (criteria.material) {
      const critMat = normalizeValue(criteria.material);
      const varMat = normalizeValue(v.material);
      const varMatAr = normalizeValue(v.material_ar);
      if (varMat !== critMat && varMatAr !== critMat) {
        return false;
      }
    }

    // Check generic attributes JSON
    if (criteria.attributes && typeof criteria.attributes === 'object') {
      const varAttrs = v.attributes || {};
      for (const [k, val] of Object.entries(criteria.attributes)) {
        if (val !== undefined && val !== null && val !== '') {
          if (normalizeValue(varAttrs[k]) !== normalizeValue(val)) {
            return false;
          }
        }
      }
    }

    return true;
  });

  if (matches.length === 1) {
    const resolved = matches[0];
    return {
      success: true,
      state: 'EXACT_MATCH',
      variant: resolved,
      sku: resolved.sku,
      selling_price: resolved.selling_price,
      price_approved: resolved.price_approved,
      is_purchase_eligible: resolved.is_purchase_eligible,
      stock_status: resolved.stock_status,
      inventory_quantity: resolved.inventory_quantity
    };
  }

  if (matches.length > 1) {
    return {
      success: false,
      state: 'AMBIGUOUS_COMBINATION',
      message: `Multiple SKU variants (${matches.length}) match the selected criteria. Additional attribute specification required.`,
      matchingCount: matches.length,
      candidateSkus: matches.map(m => m.sku),
      candidates: matches
    };
  }

  return {
    success: false,
    state: 'NO_MATCHING_VARIANT',
    message: 'No genuine SKU variant exists for this exact combination of attributes.',
    availableCombinations: activeVariants.map(v => ({
      sku: v.sku,
      diameter_mm: v.diameter_mm,
      length_value: v.length_value,
      length_unit: v.length_unit,
      color: v.color,
      material: v.material
    }))
  };
}

module.exports = {
  resolveVariantCombination
};
