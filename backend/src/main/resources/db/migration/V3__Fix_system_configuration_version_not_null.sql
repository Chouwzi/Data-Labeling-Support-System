-- Ensure optimistic locking version is always non-null for system_configuration
-- This prevents Hibernate @Version increment failures when legacy data contains NULL version.

UPDATE system_configuration
SET version = 0
WHERE version IS NULL;

ALTER TABLE system_configuration
ALTER COLUMN version SET DEFAULT 0;

ALTER TABLE system_configuration
ALTER COLUMN version SET NOT NULL;
