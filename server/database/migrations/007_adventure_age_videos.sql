BEGIN;

-- ============================================================
-- AGE-SPECIFIC ADVENTURE VIDEOS
-- One video per adventure per child age group
-- ============================================================

CREATE TABLE IF NOT EXISTS adventure_videos (
    adventure_id INTEGER NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    media_id INTEGER NOT NULL,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_adventure_videos
        PRIMARY KEY (
            adventure_id,
            age_group
        ),

    CONSTRAINT chk_adventure_videos_age_group
        CHECK (
            age_group IN (
                '8-10',
                '11-14'
            )
        ),

    CONSTRAINT fk_adventure_videos_adventure
        FOREIGN KEY (adventure_id)
        REFERENCES adventures(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_adventure_videos_media
        FOREIGN KEY (media_id)
        REFERENCES media(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS
idx_adventure_videos_media_id
ON adventure_videos(media_id);

COMMIT;