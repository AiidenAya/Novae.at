-- better-auth 1.7+ validates the schema and expects a standard "image"
-- column on User (used for OAuth-provided avatars), distinct from the
-- app's own "avatar" field.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
