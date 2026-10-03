
BEGIN;

ALTER TABLE test_admin_access_settings
ALTER COLUMN registration_enabled
SET DEFAULT FALSE;

UPDATE test_admin_access_settings
SET
  registration_enabled = FALSE,
  updated_at = NOW()
WHERE id = 1;

COMMIT;
