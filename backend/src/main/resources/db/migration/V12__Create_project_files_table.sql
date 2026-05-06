-- Create project_files table for guideline uploads
CREATE TABLE project_files (
    id UUID PRIMARY KEY,
    file_name TEXT,
    file_type VARCHAR(100),
    file_path TEXT,
    file_size BIGINT,
    project_id UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_files_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_project_files_project_id ON project_files (project_id);
