-- AlterTable
ALTER TABLE "Character" ADD COLUMN "baseCharacterId" TEXT,
ADD COLUMN "variantLabel" TEXT;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_baseCharacterId_fkey" FOREIGN KEY ("baseCharacterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
