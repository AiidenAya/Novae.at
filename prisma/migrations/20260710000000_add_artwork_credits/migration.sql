-- CreateTable
CREATE TABLE "ArtworkCredit" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "artworkId" TEXT NOT NULL,
    "userId" TEXT,
    "label" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkCredit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArtworkCredit" ADD CONSTRAINT "ArtworkCredit_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkCredit" ADD CONSTRAINT "ArtworkCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
