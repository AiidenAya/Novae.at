-- AlterTable
ALTER TABLE "Character" ADD COLUMN "isWriter" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Character" ADD COLUMN "writerCredit" TEXT;
