BEGIN;

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'admin';

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE admins
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

DO $$
BEGIN
    ALTER TABLE admins
    ADD CONSTRAINT chk_admins_role
    CHECK (role IN ('admin', 'demo_admin'));
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END
$$;

COMMIT;
