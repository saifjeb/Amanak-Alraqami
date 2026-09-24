BEGIN;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    admin_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(80) NOT NULL DEFAULT 'admin',
    resource_id VARCHAR(100),
    http_method VARCHAR(10) NOT NULL,
    request_path TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
    ON admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id
    ON admin_audit_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
    ON admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource
    ON admin_audit_logs(resource_type, resource_id);

COMMIT;
