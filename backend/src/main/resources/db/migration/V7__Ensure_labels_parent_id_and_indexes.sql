-- Ensure `parent_id` column exists and related constraints/indexes
ALTER TABLE labels ADD COLUMN IF NOT EXISTS parent_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_parent_label') THEN
        ALTER TABLE labels ADD CONSTRAINT fk_parent_label FOREIGN KEY (parent_id) REFERENCES labels(id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_labels_parent_id ON labels (parent_id);
CREATE INDEX IF NOT EXISTS idx_labels_project_id ON labels (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_label_name_per_project ON labels (project_id, name);
