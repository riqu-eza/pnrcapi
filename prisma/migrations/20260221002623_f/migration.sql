/*
  Warnings:

  - You are about to drop the column `passwordResetExpiresAt` on the `AppUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppUser" DROP COLUMN "passwordResetExpiresAt",
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3);
