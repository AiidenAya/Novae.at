-- Add an optional icon key to roles (rendered as a badge next to the username on profiles)
ALTER TABLE "Role" ADD COLUMN "icon" TEXT;

-- Sensible defaults for the built-in roles
UPDATE "Role" SET "icon" = 'crown'   WHERE "name" = 'admin'     AND "icon" IS NULL;
UPDATE "Role" SET "icon" = 'shield'  WHERE "name" = 'moderator' AND "icon" IS NULL;
UPDATE "Role" SET "icon" = 'palette' WHERE "name" = 'artist'    AND "icon" IS NULL;
