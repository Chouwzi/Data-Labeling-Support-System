-- Remove parent_id and its constraints/indexes from labels (feature removed)
-- Drop foreign key constraint if present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_parent_label') THEN
        ALTER TABLE labels DROP CONSTRAINT fk_parent_label;
    END IF;
END
$$;

-- Drop index for parent_id if exists
DROP INDEX IF EXISTS idx_labels_parent_id;

-- Drop the parent_id column if it exists
ALTER TABLE labels DROP COLUMN IF EXISTS parent_id;
