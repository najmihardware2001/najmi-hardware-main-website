-- Migration 004: Client Catalogue Staging & Draft Import Support
-- Additive migration: supports DRAFT product status, import batch audit, planned image queue, and review items

-- 1. Expand products status check to include DRAFT
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'));

-- 2. Track import batches for repeatability and provenance
CREATE TABLE IF NOT EXISTS catalogue_import_batches (
  id SERIAL PRIMARY KEY,
  batch_id TEXT UNIQUE NOT NULL,
  source_file TEXT NOT NULL,
  parents_imported INT NOT NULL DEFAULT 0,
  variants_imported INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Planned colour image queue (Step 4 staging -> Step 5 photography pipeline)
CREATE TABLE IF NOT EXISTS catalogue_image_queue (
  id SERIAL PRIMARY KEY,
  parent_id TEXT NOT NULL,
  product_family TEXT,
  color TEXT,
  example_skus TEXT,
  image_status TEXT NOT NULL DEFAULT 'NEEDS PHOTO + CLIENT APPROVAL',
  show_on_selection BOOLEAN NOT NULL DEFAULT false,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_image_queue_parent ON catalogue_image_queue(parent_id);

-- 4. Review items for variant collisions and cross-parent family merges
CREATE TABLE IF NOT EXISTS catalogue_review_items (
  id SERIAL PRIMARY KEY,
  review_type TEXT NOT NULL,
  parent_id TEXT,
  sku TEXT,
  title TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'HIGH',
  resolution_status TEXT NOT NULL DEFAULT 'PENDING_CLIENT_REVIEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_items_parent ON catalogue_review_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_review_items_sku ON catalogue_review_items(sku);
