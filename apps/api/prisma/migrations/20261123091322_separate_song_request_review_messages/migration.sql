/*
  Warnings:

  - You are about to drop the column `reviewNotes` on the `SongRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SongRequest" DROP COLUMN "reviewNotes",
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "responseMessage" TEXT;
