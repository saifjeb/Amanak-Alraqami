CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,

    account_type VARCHAR(20) NOT NULL
        CHECK (account_type IN ('parent', 'admin')),

    account_id BIGINT NOT NULL,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_account
ON password_reset_tokens (account_type, account_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash
ON password_reset_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at
ON password_reset_tokens (expires_at);psql -U postgres -d amanak_alraqami -f database/migrations/002_password_reset_tokens.sql