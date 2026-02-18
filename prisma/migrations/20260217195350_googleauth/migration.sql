/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `AppUser` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_googleId_key" ON "AppUser"("googleId");
