-- Align activity_logs.user_id type with users.id (UUID)
-- Legacy databases may still have user_id as BIGINT from old schema versions.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
      AND column_name = 'user_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE activity_logs
    ALTER COLUMN user_id TYPE UUID
    USING NULL;
  END IF;
END $$;
