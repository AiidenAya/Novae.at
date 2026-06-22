-- CreateTable: implicit M2M join table for Artwork <-> Character
CREATE TABLE "_ArtworkCharacters" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ArtworkCharacters_AB_unique" ON "_ArtworkCharacters"("A", "B");
CREATE INDEX "_ArtworkCharacters_B_index" ON "_ArtworkCharacters"("B");

-- Migrate existing single-character relations
INSERT INTO "_ArtworkCharacters" ("A", "B")
SELECT "id", "characterId" FROM "Artwork" WHERE "characterId" IS NOT NULL;

-- Drop old column
ALTER TABLE "Artwork" DROP COLUMN "characterId";
