-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TWIN', 'SUITE', 'FAMILY', 'PENTHOUSE', 'DORMITORY');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'BUNK', 'SOFA_BED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'BRUNCH', 'SNACK', 'DESSERT', 'BEVERAGE');

-- CreateEnum
CREATE TYPE "CuisineType" AS ENUM ('AFRICAN', 'SWAHILI', 'ITALIAN', 'CHINESE', 'INDIAN', 'JAPANESE', 'MEXICAN', 'MEDITERRANEAN', 'FUSION', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "DietaryOption" AS ENUM ('VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'HALAL', 'KOSHER', 'NUT_FREE');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CONCERT', 'THEATER', 'SPORTS', 'COMEDY', 'FESTIVAL', 'EXHIBITION', 'WORKSHOP');

-- CreateTable
CREATE TABLE "AccommodationRoom" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roomType" "RoomType" NOT NULL,
    "roomNumber" TEXT,
    "floor" INTEGER,
    "maxGuests" INTEGER NOT NULL DEFAULT 2,
    "maxAdults" INTEGER NOT NULL DEFAULT 2,
    "maxChildren" INTEGER NOT NULL DEFAULT 0,
    "sizeSquareMeters" DOUBLE PRECISION,
    "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
    "hasKitchen" BOOLEAN NOT NULL DEFAULT false,
    "hasLivingRoom" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT[],
    "basePrice" DOUBLE PRECISION NOT NULL,
    "weekendPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "seasonalPricing" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT[],
    "metadata" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationBed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedType" "BedType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AccommodationBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningMenuSection" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningMenuSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningMenuItem" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "sectionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mealType" "MealType" NOT NULL,
    "cuisineType" "CuisineType",
    "ingredients" TEXT[],
    "allergens" TEXT[],
    "dietaryOptions" "DietaryOption"[],
    "spicyLevel" INTEGER DEFAULT 0,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "prepTime" INTEGER,
    "calories" INTEGER,
    "servingSize" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "priceVariations" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableDays" TEXT[],
    "availableHours" JSONB,
    "isSignatureDish" BOOLEAN NOT NULL DEFAULT false,
    "isChefSpecial" BOOLEAN NOT NULL DEFAULT false,
    "isSeasonalDish" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[],
    "pairsWith" TEXT[],
    "metadata" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntertainmentShow" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "performers" TEXT[],
    "director" TEXT,
    "producer" TEXT,
    "venueCapacity" INTEGER,
    "seatingType" TEXT,
    "ticketPricing" JSONB NOT NULL,
    "images" TEXT[],
    "trailerUrl" TEXT,
    "ageRating" TEXT,
    "language" TEXT,
    "subtitles" TEXT[],
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntertainmentShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntertainmentPerformance" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "ticketPricing" JSONB,
    "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntertainmentPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalExhibition" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT,
    "curator" TEXT,
    "organization" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,
    "entryFee" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "hasFreeEntry" BOOLEAN NOT NULL DEFAULT false,
    "freeEntryDays" TEXT[],
    "hasGuidedTours" BOOLEAN NOT NULL DEFAULT false,
    "tourSchedule" JSONB,
    "images" TEXT[],
    "virtualTourUrl" TEXT,
    "audioGuide" BOOLEAN NOT NULL DEFAULT false,
    "languages" TEXT[],
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturalExhibition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalArtifact" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "exhibitionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "period" TEXT,
    "era" TEXT,
    "origin" TEXT,
    "culture" TEXT,
    "yearCreated" INTEGER,
    "artist" TEXT,
    "maker" TEXT,
    "materials" TEXT[],
    "dimensions" JSONB,
    "weight" DOUBLE PRECISION,
    "condition" TEXT,
    "conservationNotes" TEXT,
    "location" TEXT,
    "isOnDisplay" BOOLEAN NOT NULL DEFAULT true,
    "images" TEXT[],
    "has3DModel" BOOLEAN NOT NULL DEFAULT false,
    "model3DUrl" TEXT,
    "historicalValue" TEXT,
    "significance" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionMethod" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CulturalArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccommodationRoom_placeId_isAvailable_idx" ON "AccommodationRoom"("placeId", "isAvailable");

-- CreateIndex
CREATE INDEX "AccommodationRoom_roomType_idx" ON "AccommodationRoom"("roomType");

-- CreateIndex
CREATE INDEX "AccommodationRoom_basePrice_idx" ON "AccommodationRoom"("basePrice");

-- CreateIndex
CREATE INDEX "AccommodationRoom_maxGuests_idx" ON "AccommodationRoom"("maxGuests");

-- CreateIndex
CREATE INDEX "AccommodationBed_roomId_idx" ON "AccommodationBed"("roomId");

-- CreateIndex
CREATE INDEX "DiningMenuSection_placeId_isActive_idx" ON "DiningMenuSection"("placeId", "isActive");

-- CreateIndex
CREATE INDEX "DiningMenuItem_placeId_isAvailable_idx" ON "DiningMenuItem"("placeId", "isAvailable");

-- CreateIndex
CREATE INDEX "DiningMenuItem_mealType_idx" ON "DiningMenuItem"("mealType");

-- CreateIndex
CREATE INDEX "DiningMenuItem_cuisineType_idx" ON "DiningMenuItem"("cuisineType");

-- CreateIndex
CREATE INDEX "DiningMenuItem_price_idx" ON "DiningMenuItem"("price");

-- CreateIndex
CREATE INDEX "DiningMenuItem_isVegetarian_idx" ON "DiningMenuItem"("isVegetarian");

-- CreateIndex
CREATE INDEX "DiningMenuItem_isVegan_idx" ON "DiningMenuItem"("isVegan");

-- CreateIndex
CREATE INDEX "EntertainmentShow_placeId_isActive_idx" ON "EntertainmentShow"("placeId", "isActive");

-- CreateIndex
CREATE INDEX "EntertainmentShow_category_idx" ON "EntertainmentShow"("category");

-- CreateIndex
CREATE INDEX "EntertainmentPerformance_placeId_idx" ON "EntertainmentPerformance"("placeId");

-- CreateIndex
CREATE INDEX "EntertainmentPerformance_showId_idx" ON "EntertainmentPerformance"("showId");

-- CreateIndex
CREATE INDEX "EntertainmentPerformance_startDateTime_idx" ON "EntertainmentPerformance"("startDateTime");

-- CreateIndex
CREATE INDEX "CulturalExhibition_placeId_isActive_idx" ON "CulturalExhibition"("placeId", "isActive");

-- CreateIndex
CREATE INDEX "CulturalExhibition_startDate_endDate_idx" ON "CulturalExhibition"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "CulturalExhibition_isPermanent_idx" ON "CulturalExhibition"("isPermanent");

-- CreateIndex
CREATE INDEX "CulturalArtifact_placeId_idx" ON "CulturalArtifact"("placeId");

-- CreateIndex
CREATE INDEX "CulturalArtifact_exhibitionId_idx" ON "CulturalArtifact"("exhibitionId");

-- CreateIndex
CREATE INDEX "CulturalArtifact_category_idx" ON "CulturalArtifact"("category");

-- CreateIndex
CREATE INDEX "CulturalArtifact_isOnDisplay_idx" ON "CulturalArtifact"("isOnDisplay");

-- AddForeignKey
ALTER TABLE "AccommodationRoom" ADD CONSTRAINT "AccommodationRoom_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationBed" ADD CONSTRAINT "AccommodationBed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AccommodationRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningMenuSection" ADD CONSTRAINT "DiningMenuSection_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningMenuItem" ADD CONSTRAINT "DiningMenuItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiningMenuItem" ADD CONSTRAINT "DiningMenuItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DiningMenuSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntertainmentShow" ADD CONSTRAINT "EntertainmentShow_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntertainmentPerformance" ADD CONSTRAINT "EntertainmentPerformance_showId_fkey" FOREIGN KEY ("showId") REFERENCES "EntertainmentShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntertainmentPerformance" ADD CONSTRAINT "EntertainmentPerformance_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalExhibition" ADD CONSTRAINT "CulturalExhibition_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalArtifact" ADD CONSTRAINT "CulturalArtifact_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalArtifact" ADD CONSTRAINT "CulturalArtifact_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "CulturalExhibition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
