CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS project_reviewers (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_manager_id ON groups(manager_id);
CREATE INDEX IF NOT EXISTS idx_project_reviewers_reviewer_id ON project_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status_annotator ON tasks(project_id, status, annotator_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_created_at ON reviews(reviewer_id, created_at DESC);
