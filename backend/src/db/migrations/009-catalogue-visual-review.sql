ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'GALLERY';
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100;
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS qa_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED';
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS qa_note TEXT;
ALTER TABLE catalogue_photo_reviews ADD COLUMN IF NOT EXISTS source_approval_evidence TEXT;
UPDATE catalogue_photo_reviews SET content_type=CASE WHEN kind='MAIN' THEN 'HERO' WHEN kind='COLOUR' THEN 'COLOUR' ELSE 'GALLERY' END;
CREATE TABLE catalogue_supplied_photos(
 id SERIAL PRIMARY KEY,source_key TEXT NOT NULL UNIQUE,filename TEXT NOT NULL,url TEXT NOT NULL,
 sha256 TEXT NOT NULL,parent_candidates JSONB NOT NULL DEFAULT '[]',
 status TEXT NOT NULL DEFAULT 'APPROVED_SUPPLIED_ASSET',approval_evidence TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
