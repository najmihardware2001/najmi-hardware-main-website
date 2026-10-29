-- Migration 002: Najmi Hardware adaptations
-- Universal product attributes, nullable pricing, internal identity, COD initial states, RFQs, and durable migration cross-references.

-- 1. Orders table: Expand status check constraint to include PENDING_CONFIRMATION
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK(status IN ('PENDING_PAYMENT','PENDING_CONFIRMATION','CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','RETURNED'));

-- 2. Products table: Support internal identity, nullable pricing, price approval, and stock tracking
ALTER TABLE products ALTER COLUMN source_url DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_source_url_key;
ALTER TABLE products ALTER COLUMN source_identity_hash DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_source_identity_hash_key;
ALTER TABLE products ALTER COLUMN selling_price DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_selling_price_check;
ALTER TABLE products ADD CONSTRAINT products_selling_price_check CHECK(selling_price IS NULL OR selling_price >= 0);

ALTER TABLE products ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_system TEXT DEFAULT 'NESTJS_PRISMA';
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS import_batch TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_purchase_eligible BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(18,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS verified_stock INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_tracking_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS products_source_mapping ON products(source_system, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_source_sku ON products(source_sku) WHERE source_sku IS NOT NULL;

-- 3. Product variants: Universal attributes, variant pricing, stock distinction
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS source_sku TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS diameter_mm NUMERIC(10,2);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS length_value NUMERIC(10,2);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS length_unit TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color_ar TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS pack_weight_kg NUMERIC(10,3);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS material_ar TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS selling_price NUMERIC(18,3) CHECK(selling_price IS NULL OR selling_price >= 0);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS regular_price NUMERIC(18,3);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS cost_price NUMERIC(18,3);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price_approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_purchase_eligible BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS verified_stock INT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS reserved_stock INT NOT NULL DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock_tracking_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS supplier_item_ref TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS supplier_catalogue_ref TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS supplier_source_page INT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS variants_source_mapping ON product_variants(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS variants_sku ON product_variants(sku) WHERE sku IS NOT NULL AND sku != '';

-- 4. Product images: support local images, variant associations, WebP derivative URLs
ALTER TABLE product_images ALTER COLUMN cloudinary_url DROP NOT NULL;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS local_path TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS webp_url TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS card_url TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS color_code TEXT;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS show_on_colour_selection BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS source_media_id TEXT;

-- 5. RFQs and Quotations tables
CREATE TABLE IF NOT EXISTS rfqs (
  id SERIAL PRIMARY KEY,
  rfq_number TEXT UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  company_name TEXT,
  project_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','QUOTED','EXPIRED','CANCELLED')),
  source_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_items (
  id SERIAL PRIMARY KEY,
  rfq_id INT NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  variant_id INT REFERENCES product_variants(id),
  custom_description TEXT,
  quantity NUMERIC(12,2) NOT NULL CHECK(quantity > 0),
  unit TEXT NOT NULL DEFAULT 'PIECE',
  target_price NUMERIC(18,3),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  rfq_id INT REFERENCES rfqs(id),
  customer_id INT REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC(18,3) NOT NULL DEFAULT 0,
  subtotal NUMERIC(18,3) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(18,3) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KWD',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED')),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  source_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_lines (
  id SERIAL PRIMARY KEY,
  quotation_id INT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  variant_id INT REFERENCES product_variants(id),
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK(quantity > 0),
  unit_price NUMERIC(18,3) NOT NULL CHECK(unit_price >= 0),
  total_price NUMERIC(18,3) NOT NULL CHECK(total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Durable migration cross-reference table
CREATE TABLE IF NOT EXISTS migration_id_mappings (
  id SERIAL PRIMARY KEY,
  source_entity TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id INT NOT NULL,
  import_version TEXT NOT NULL DEFAULT 'v1-nestjs-baseline',
  original_sku TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'VERIFIED',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_entity, source_id),
  UNIQUE(target_entity, target_id)
);

CREATE INDEX IF NOT EXISTS idx_migration_source ON migration_id_mappings(source_entity, source_id);
CREATE INDEX IF NOT EXISTS idx_migration_sku ON migration_id_mappings(original_sku);
