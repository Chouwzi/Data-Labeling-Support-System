CREATE TABLE file_metadata (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    format VARCHAR(50) NOT NULL,
    size_bytes BIGINT NOT NULL,
    uploader_id UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_metadata_uploader ON file_metadata(uploader_id);
