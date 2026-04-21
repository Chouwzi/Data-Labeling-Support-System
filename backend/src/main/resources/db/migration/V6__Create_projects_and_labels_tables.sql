-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    guideline_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    manager_id UUID NOT NULL,
    dataset_id UUID,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

-- Create partial unique index for project name (only among non-deleted projects)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_project_name_active ON projects (name) WHERE deleted_at IS NULL;

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    parent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_color_hex CHECK (color_hex ~ '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$')
);

-- Index for foreign keys
-- Ensure `parent_id` column exists for older schema versions that lacked it
ALTER TABLE labels ADD COLUMN IF NOT EXISTS parent_id UUID;

-- Add foreign key constraint for parent label if it's not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_parent_label') THEN
        ALTER TABLE labels ADD CONSTRAINT fk_parent_label FOREIGN KEY (parent_id) REFERENCES labels(id);
    END IF;
END
$$;

-- Indexes for foreign keys (create if missing)
CREATE INDEX IF NOT EXISTS idx_labels_project_id ON labels (project_id);
CREATE INDEX IF NOT EXISTS idx_labels_parent_id ON labels (parent_id);

-- Unique label name per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_label_name_per_project ON labels (project_id, name);
