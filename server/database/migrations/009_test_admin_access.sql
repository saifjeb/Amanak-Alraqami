
BEGIN;

ALTER TABLE admins
DROP CONSTRAINT IF EXISTS chk_admins_role;

UPDATE admins
SET role = 'test_admin'
WHERE role = 'demo_admin';

ALTER TABLE admins
ADD CONSTRAINT chk_admins_role
CHECK (
  role IN (
    'admin',
    'test_admin'
  )
);

CREATE TABLE IF NOT EXISTS test_admin_access_settings (
  id SMALLINT PRIMARY KEY,
  registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_test_admin_access_settings_singleton
    CHECK (id = 1)
);

INSERT INTO test_admin_access_settings (
  id,
  registration_enabled
)
VALUES (
  1,
  TRUE
)
ON CONFLICT (id)
DO NOTHING;

COMMIT;
