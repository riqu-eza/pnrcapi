/*
  Warnings:

  - You are about to drop the column `authProvider` on the `AppUser` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `AppUser` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AppUser_googleId_key";

-- AlterTable
ALTER TABLE "AppUser" DROP COLUMN "authProvider",
DROP COLUMN "googleId",
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerId_key" ON "AuthIdentity"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
