/*
  Warnings:

  - You are about to drop the column `reviewedByUserId` on the `ArtistApplication` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedByUserId` on the `SongSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ArtistApplication" DROP COLUMN "reviewedByUserId",
ADD COLUMN     "reviewedByAdminId" TEXT;

-- AlterTable
ALTER TABLE "SongSubmission" DROP COLUMN "reviewedByUserId",
ADD COLUMN     "reviewedByAdminId" TEXT;

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_isActive_idx" ON "Admin"("isActive");

-- AddForeignKey
ALTER TABLE "ArtistApplication" ADD CONSTRAINT "ArtistApplication_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongSubmission" ADD CONSTRAINT "SongSubmission_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
