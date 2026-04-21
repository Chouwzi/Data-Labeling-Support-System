-- Add deleted_at column to labels for soft-delete support
ALTER TABLE labels ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
