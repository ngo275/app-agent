/*
  Warnings:

  - You are about to drop the column `note` on the `App` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "App" DROP COLUMN "note",
ADD COLUMN     "shortDescription" TEXT;
