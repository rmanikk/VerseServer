/*
  Warnings:

  - Added the required column `youtubeUrl` to the `SongRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SongRequest" ADD COLUMN     "youtubeUrl" TEXT NOT NULL;
