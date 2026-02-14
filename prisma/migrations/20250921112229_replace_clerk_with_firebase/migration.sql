/*
  Warnings:

  - You are about to drop the column `clerkUserId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[firebaseUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firebaseUserId` to the `User` table without a default value. This is not possible if the table is not empty.

*/

-- First, delete all existing users and their related data
-- This is safe for development but you might want to handle this differently in production
DELETE FROM "CoverLetter";
DELETE FROM "Assessment";
DELETE FROM "Resume";
DELETE FROM "User";

-- DropIndex
DROP INDEX "User_clerkUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkUserId",
ADD COLUMN     "firebaseUserId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUserId_key" ON "User"("firebaseUserId");
