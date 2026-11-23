-- CreateEnum
CREATE TYPE "SongRequestStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'FULFILLED');

-- CreateTable
CREATE TABLE "SongRequest" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requestedTitle" TEXT NOT NULL,
    "requestedArtist" TEXT,
    "message" TEXT,
    "status" "SongRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByAdminId" TEXT,
    "fulfilledSongId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SongRequest_requesterUserId_createdAt_idx" ON "SongRequest"("requesterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SongRequest_status_createdAt_idx" ON "SongRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SongRequest_reviewedByAdminId_idx" ON "SongRequest"("reviewedByAdminId");

-- CreateIndex
CREATE INDEX "SongRequest_fulfilledSongId_idx" ON "SongRequest"("fulfilledSongId");

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongRequest" ADD CONSTRAINT "SongRequest_fulfilledSongId_fkey" FOREIGN KEY ("fulfilledSongId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;
