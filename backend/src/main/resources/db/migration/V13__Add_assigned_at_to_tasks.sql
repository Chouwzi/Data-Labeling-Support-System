ALTER TABLE tasks
    ADD COLUMN assigned_at TIMESTAMP;

UPDATE tasks
SET assigned_at = COALESCE(created_at, updated_at)
WHERE annotator_id IS NOT NULL
  AND assigned_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_annotator_assigned_at
    ON tasks (annotator_id, assigned_at DESC);
