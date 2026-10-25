-- Google Identity Services account linking for AgroChain.
-- Apply this migration before deploying the Google-auth API routes.
ALTER TABLE auth_users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE auth_users
  ADD COLUMN IF NOT EXISTS google_id TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS avatar TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS auth_users_google_id_unique
  ON auth_users (google_id)
  WHERE google_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS auth_users_email_lower_idx
  ON auth_users (LOWER(email));
