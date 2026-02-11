import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CreateExhibitionData {
  name: string;
  description?: string;
  theme?: string;
  curator?: string;
  organization?: string;
  startDate: Date;
  endDate: Date;
  isPermanent?: boolean;
  entryFee?: number;
  currency?: string;
  hasFreeEntry?: boolean;
  freeEntryDays?: string[];
  hasGuidedTours?: boolean;
  tourSchedule?: any;
  images?: string[];
  virtualTourUrl?: string;
  audioGuide?: boolean;
  languages?: string[];
  metadata?: any;
}

export interface CreateArtifactData {
  exhibitionId?: string;
  name: string;
  description?: string;
  category: string;
  period?: string;
  era?: string;
  origin?: string;
  culture?: string;
  yearCreated?: number;
  artist?: string;
  maker?: string;
  materials: string[];
  dimensions?: any;
  weight?: number;
  condition?: string;
  conservationNotes?: string;
  location?: string;
  isOnDisplay?: boolean;
  images?: string[];
  has3DModel?: boolean;
  model3DUrl?: string;
  historicalValue?: string;
  significance?: string;
  acquisitionDate?: Date;
  acquisitionMethod?: string;
  metadata?: any;
}

// List exhibitions
export async function listExhibitions(placeId: string, isActive?: boolean) {
  const where: Prisma.CulturalExhibitionWhereInput = {
    placeId,
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const exhibitions = await prisma.culturalExhibition.findMany({
    where,
    include: {
      artifacts: {
        where: {
          isOnDisplay: true,
        },
        take: 10,
      },
      _count: {
        select: {
          artifacts: true,
        },
      },
    },
    orderBy: [
      { isPermanent: 'desc' },
      { startDate: 'desc' },
    ],
  });

  return exhibitions;
}

// Create exhibitions
export async function createExhibitions(
  placeId: string,
  exhibitionsData: CreateExhibitionData[]
) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  await prisma.culturalExhibition.deleteMany({
    where: { placeId },
  });

  const exhibitions = await prisma.culturalExhibition.createMany({
    data: exhibitionsData.map((exhibition) => ({
      ...exhibition,
      placeId,
    })),
  });

  return exhibitions;
}

// List artifacts
export async function listArtifacts(
  placeId: string,
  filters?: {
    exhibitionId?: string;
    category?: string;
    isOnDisplay?: boolean;
  }
) {
  const where: Prisma.CulturalArtifactWhereInput = {
    placeId,
  };

  if (filters?.exhibitionId) where.exhibitionId = filters.exhibitionId;
  if (filters?.category) where.category = filters.category;
  if (filters?.isOnDisplay !== undefined) where.isOnDisplay = filters.isOnDisplay;

  const artifacts = await prisma.culturalArtifact.findMany({
    where,
    include: {
      exhibition: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return artifacts;
}

// Create artifacts
export async function createArtifacts(placeId: string, artifactsData: CreateArtifactData[]) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  // Verify exhibitions exist if provided
  const exhibitionIds = artifactsData
    .map((a) => a.exhibitionId)
    .filter((id): id is string => !!id);

  if (exhibitionIds.length > 0) {
    const exhibitions = await prisma.culturalExhibition.findMany({
      where: {
        id: { in: exhibitionIds },
        placeId,
      },
    });

    if (exhibitions.length !== new Set(exhibitionIds).size) {
      throw new Error('One or more exhibitions not found');
    }
  }

  const artifacts = await prisma.culturalArtifact.createMany({
    data: artifactsData.map((artifact) => ({
      ...artifact,
      placeId,
    })),
  });

  return artifacts;
}