-- CreateEnum
CREATE TYPE "ArtistStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ArtistApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SongStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SongSource" AS ENUM ('ADMIN_UPLOAD', 'ARTIST_SUBMISSION', 'IMPORT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AlbumStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArtistCreditRole" AS ENUM ('PRIMARY', 'FEATURED', 'REMIXER', 'PRODUCER');

-- CreateEnum
CREATE TYPE "AudioAssetStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "status" "ArtistStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerUserId" TEXT,
    "avatarImageKey" TEXT,
    "coverImageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistApplication" (
    "id" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "proposedName" TEXT NOT NULL,
    "bio" TEXT,
    "status" "ArtistApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedArtistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "coverImageKey" TEXT,
    "status" "AlbumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "durationSeconds" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "language" TEXT,
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "status" "SongStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "SongSource" NOT NULL DEFAULT 'ADMIN_UPLOAD',
    "coverImageKey" TEXT,
    "albumId" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongArtist" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "role" "ArtistCreditRole" NOT NULL DEFAULT 'PRIMARY',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SongArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumArtist" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "role" "ArtistCreditRole" NOT NULL DEFAULT 'PRIMARY',

    CONSTRAINT "AlbumArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'b2',
    "bucketName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "codec" TEXT,
    "bitrateKbps" INTEGER,
    "sampleRateHz" INTEGER,
    "channels" INTEGER,
    "durationSeconds" INTEGER,
    "versionLabel" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "AudioAssetStatus" NOT NULL DEFAULT 'UPLOADING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongSubmission" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "rightsConfirmedAt" TIMESTAMP(3),
    "rightsDeclarationVersion" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ArtistMoods" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistMoods_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SongGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SongGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SongMoods" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SongMoods_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "Artist_status_idx" ON "Artist"("status");

-- CreateIndex
CREATE INDEX "Artist_ownerUserId_idx" ON "Artist"("ownerUserId");

-- CreateIndex
CREATE INDEX "ArtistApplication_applicantUserId_status_idx" ON "ArtistApplication"("applicantUserId", "status");

-- CreateIndex
CREATE INDEX "ArtistApplication_status_createdAt_idx" ON "ArtistApplication"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Album_slug_key" ON "Album"("slug");

-- CreateIndex
CREATE INDEX "Album_status_idx" ON "Album"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Song_slug_key" ON "Song"("slug");

-- CreateIndex
CREATE INDEX "Song_status_createdAt_idx" ON "Song"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Song_albumId_idx" ON "Song"("albumId");

-- CreateIndex
CREATE INDEX "Song_releaseDate_idx" ON "Song"("releaseDate");

-- CreateIndex
CREATE INDEX "SongArtist_artistId_idx" ON "SongArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "SongArtist_songId_artistId_key" ON "SongArtist"("songId", "artistId");

-- CreateIndex
CREATE INDEX "AlbumArtist_artistId_idx" ON "AlbumArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumArtist_albumId_artistId_key" ON "AlbumArtist"("albumId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Mood_slug_key" ON "Mood"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AudioAsset_objectKey_key" ON "AudioAsset"("objectKey");

-- CreateIndex
CREATE INDEX "AudioAsset_songId_status_idx" ON "AudioAsset"("songId", "status");

-- CreateIndex
CREATE INDEX "SongSubmission_status_createdAt_idx" ON "SongSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SongSubmission_submittedByUserId_idx" ON "SongSubmission"("submittedByUserId");

-- CreateIndex
CREATE INDEX "SongSubmission_artistId_status_idx" ON "SongSubmission"("artistId", "status");

-- CreateIndex
CREATE INDEX "ActivityLog_actorUserId_createdAt_idx" ON "ActivityLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "_ArtistGenres_B_index" ON "_ArtistGenres"("B");

-- CreateIndex
CREATE INDEX "_ArtistMoods_B_index" ON "_ArtistMoods"("B");

-- CreateIndex
CREATE INDEX "_SongGenres_B_index" ON "_SongGenres"("B");

-- CreateIndex
CREATE INDEX "_SongMoods_B_index" ON "_SongMoods"("B");

-- AddForeignKey
ALTER TABLE "ArtistApplication" ADD CONSTRAINT "ArtistApplication_approvedArtistId_fkey" FOREIGN KEY ("approvedArtistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongArtist" ADD CONSTRAINT "SongArtist_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongArtist" ADD CONSTRAINT "SongArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtist" ADD CONSTRAINT "AlbumArtist_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumArtist" ADD CONSTRAINT "AlbumArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongSubmission" ADD CONSTRAINT "SongSubmission_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongSubmission" ADD CONSTRAINT "SongSubmission_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistGenres" ADD CONSTRAINT "_ArtistGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistGenres" ADD CONSTRAINT "_ArtistGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistMoods" ADD CONSTRAINT "_ArtistMoods_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistMoods" ADD CONSTRAINT "_ArtistMoods_B_fkey" FOREIGN KEY ("B") REFERENCES "Mood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SongGenres" ADD CONSTRAINT "_SongGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SongGenres" ADD CONSTRAINT "_SongGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SongMoods" ADD CONSTRAINT "_SongMoods_A_fkey" FOREIGN KEY ("A") REFERENCES "Mood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SongMoods" ADD CONSTRAINT "_SongMoods_B_fkey" FOREIGN KEY ("B") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
