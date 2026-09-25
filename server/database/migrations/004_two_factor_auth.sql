ALTER TABLE parents
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE parents
ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted TEXT DEFAULT NULL;

ALTER TABLE parents
ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ DEFAULT NULL;


ALTER TABLE admins
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted TEXT DEFAULT NULL;

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ DEFAULT NULL;


CREATE TABLE IF NOT EXISTS two_factor_recovery_codes (
    id BIGSERIAL PRIMARY KEY,

    account_type VARCHAR(20) NOT NULL
        CHECK (account_type IN ('parent', 'admin')),

    account_id BIGINT NOT NULL,

    code_hash VARCHAR(64) NOT NULL,

    used_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_two_factor_recovery_account
ON two_factor_recovery_codes (
    account_type,
    account_id
);

CREATE INDEX IF NOT EXISTS idx_two_factor_recovery_unused
ON two_factor_recovery_codes (
    account_type,
    account_id
)
WHERE used_at IS NULL;