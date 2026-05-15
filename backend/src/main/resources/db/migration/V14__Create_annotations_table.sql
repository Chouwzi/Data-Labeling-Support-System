CREATE TABLE IF NOT EXISTS annotations (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL,
    label_id UUID NOT NULL,
    created_by UUID,
    shape_type VARCHAR(50) NOT NULL,
    geometry JSONB NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_annotations_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_annotations_label
        FOREIGN KEY (label_id) REFERENCES labels(id),
    CONSTRAINT fk_annotations_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_annotations_shape_type
        CHECK (shape_type IN ('BOUNDING_BOX')),
    CONSTRAINT chk_annotations_geometry_object
        CHECK (jsonb_typeof(geometry) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_annotations_task_id ON annotations (task_id);
CREATE INDEX IF NOT EXISTS idx_annotations_label_id ON annotations (label_id);
CREATE INDEX IF NOT EXISTS idx_annotations_task_created_at ON annotations (task_id, created_at);
