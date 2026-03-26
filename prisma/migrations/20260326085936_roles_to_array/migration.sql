/*
  Warnings:

  - The `roles` column on the `AppUser` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TOURIST', 'LISTING_ADMIN', 'ADMIN');

-- AlterTable
ALTER TABLE "AppUser" DROP COLUMN "roles",
ADD COLUMN     "roles" "UserRole"[] DEFAULT ARRAY['TOURIST']::"UserRole"[];
