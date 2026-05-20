DELETE FROM tasks
WHERE ctid IN (
    SELECT ctid
    FROM (
        SELECT
            ctid,
            ROW_NUMBER() OVER (
                PARTITION BY project_id, sample_id
                ORDER BY created_at ASC NULLS LAST, id ASC
            ) AS row_number
        FROM tasks
    ) duplicates
    WHERE duplicates.row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_project_sample
    ON tasks (project_id, sample_id);
