/*
  Warnings:

  - You are about to drop the column `relatedListings` on the `BlogPost` table. All the data in the column will be lost.
  - You are about to alter the column `excerpt` on the `BlogPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `metaTitle` on the `BlogPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.
  - You are about to alter the column `metaDescription` on the `BlogPost` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(160)`.
  - The `status` column on the `BlogPost` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `lastEditedAt` to the `BlogPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BlogPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "relatedListings",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastEditedBy" TEXT,
ADD COLUMN     "metaKeywords" TEXT[],
ADD COLUMN     "pinnedUntil" TIMESTAMP(3),
ADD COLUMN     "readingTimeMinutes" INTEGER,
ADD COLUMN     "relatedPlaceIds" TEXT[],
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "excerpt" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "metaTitle" SET DATA TYPE VARCHAR(60),
ALTER COLUMN "metaDescription" SET DATA TYPE VARCHAR(160),
DROP COLUMN "status",
ADD COLUMN     "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogComment_postId_isApproved_idx" ON "BlogComment"("postId", "isApproved");

-- CreateIndex
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");

-- CreateIndex
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_relatedCityId_idx" ON "BlogPost"("relatedCityId");

-- CreateIndex
CREATE INDEX "BlogPost_categories_idx" ON "BlogPost" USING GIN ("categories");

-- CreateIndex
CREATE INDEX "BlogPost_tags_idx" ON "BlogPost" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "BlogPost_isFeatured_isPinned_idx" ON "BlogPost"("isFeatured", "isPinned");

-- CreateIndex
CREATE INDEX "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
