-- Create projects table
CREATE TABLE projects (
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
CREATE UNIQUE INDEX idx_unique_project_name_active ON projects (name) WHERE deleted_at IS NULL;

-- Create labels table
CREATE TABLE labels (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    parent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_label FOREIGN KEY (parent_id) REFERENCES labels(id),
    CONSTRAINT chk_color_hex CHECK (color_hex ~ '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$')
);

-- Index for foreign keys
CREATE INDEX idx_labels_project_id ON labels (project_id);
CREATE INDEX idx_labels_parent_id ON labels (parent_id);

-- Unique label name per project
CREATE UNIQUE INDEX idx_unique_label_name_per_project ON labels (project_id, name);
