CREATE TABLE IF NOT EXISTS agrochain_records (
    resource TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (resource, id)
);

CREATE INDEX IF NOT EXISTS idx_agrochain_records_resource
ON agrochain_records(resource);
