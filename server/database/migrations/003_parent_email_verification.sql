ALTER TABLE parents
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ DEFAULT NULL;

CREATE TABLE IF NOT EXISTS parent_email_verification_codes (
    id BIGSERIAL PRIMARY KEY,

    parent_id BIGINT NOT NULL
        REFERENCES parents(id)
        ON DELETE CASCADE,

    code_hash VARCHAR(64) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_email_verification_parent
ON parent_email_verification_codes(parent_id);

CREATE INDEX IF NOT EXISTS idx_parent_email_verification_expiry
ON parent_email_verification_codes(expires_at);