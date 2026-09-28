BEGIN;

-- ============================================================
-- MEDIA: allow images up to 5 MB and MP4 videos up to 50 MB
-- ============================================================

ALTER TABLE media
DROP CONSTRAINT IF EXISTS chk_media_file_size_max;

ALTER TABLE media
DROP CONSTRAINT IF EXISTS chk_media_mime_type;

ALTER TABLE media
ADD CONSTRAINT chk_media_mime_type
CHECK (
    mime_type IN (
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4'
    )
);

ALTER TABLE media
ADD CONSTRAINT chk_media_file_size_max
CHECK (
    (
        mime_type IN (
            'image/png',
            'image/jpeg',
            'image/webp'
        )
        AND file_size <= 5242880
    )
    OR
    (
        mime_type = 'video/mp4'
        AND file_size <= 52428800
    )
);

-- ============================================================
-- ADVENTURES: optional educational video
-- ============================================================

ALTER TABLE adventures
ADD COLUMN IF NOT EXISTS video_media_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_adventures_video_media'
    ) THEN
        ALTER TABLE adventures
        ADD CONSTRAINT fk_adventures_video_media
        FOREIGN KEY (video_media_id)
        REFERENCES media(id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS
idx_adventures_video_media_id
ON adventures(video_media_id);

COMMIT;
