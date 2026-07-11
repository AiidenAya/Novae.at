-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows to preserve current alphabetical display order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "characterId" ORDER BY name ASC) - 1 AS rn
  FROM "Gallery"
)
UPDATE "Gallery" g SET "order" = ranked.rn
FROM ranked WHERE ranked.id = g.id;
