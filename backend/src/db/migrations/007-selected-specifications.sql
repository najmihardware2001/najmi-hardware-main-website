CREATE TABLE catalogue_specifications(
 id SERIAL PRIMARY KEY,parent_id INT NOT NULL REFERENCES products(id),source_key TEXT NOT NULL,
 measurement_type TEXT NOT NULL DEFAULT 'diameter',measurements JSONB NOT NULL DEFAULT '{}',
 colours JSONB NOT NULL DEFAULT '[]',colour_scope TEXT NOT NULL DEFAULT 'PREFERENCE',
 source_reference TEXT NOT NULL,review_status TEXT NOT NULL DEFAULT 'SELECTED_ENQUIRY',
 active BOOLEAN NOT NULL DEFAULT true,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(parent_id,source_key)
);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS measurements JSONB NOT NULL DEFAULT '{}';
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS pricing_rule TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS source_price_version INT NOT NULL DEFAULT 1;
ALTER TABLE catalogue_evidence ADD COLUMN IF NOT EXISTS reconciled_raw JSONB;
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS reviewed_by INT REFERENCES admin_users(id);
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS origin TEXT;
CREATE TABLE catalogue_change_history(id SERIAL PRIMARY KEY,operation_key TEXT UNIQUE NOT NULL,kind TEXT NOT NULL,entity_id TEXT NOT NULL,before_data JSONB,after_data JSONB,source_reference TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
