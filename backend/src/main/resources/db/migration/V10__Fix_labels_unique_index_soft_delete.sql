-- Fix: Unique index on labels must exclude soft-deleted rows.
-- Without this, re-creating a label with the same name after soft-delete fails.
DROP INDEX IF EXISTS idx_unique_label_name_per_project;
CREATE UNIQUE INDEX idx_unique_label_name_per_project
    ON labels (project_id, name) WHERE deleted_at IS NULL;
