import { prisma } from '@/lib/prisma';
import { EventCategory, Prisma } from '@prisma/client';

export interface CreateShowData {
  name: string;
  description?: string;
  category: EventCategory;
  durationMinutes: number;
  isRecurring?: boolean;
  performers: string[];
  director?: string;
  producer?: string;
  venueCapacity?: number;
  seatingType?: string;
  ticketPricing: any;
  images?: string[];
  trailerUrl?: string;
  ageRating?: string;
  language?: string;
  subtitles?: string[];
  metadata?: any;
}

export interface CreatePerformanceData {
  showId: string;
  startDateTime: Date;
  endDateTime: Date;
  availableSeats: number;
  totalSeats: number;
  ticketPricing?: any;
  metadata?: any;
}

// List shows for a place
export async function listShows(placeId: string, isActive?: boolean) {
  const where: Prisma.EntertainmentShowWhereInput = {
    placeId,
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const shows = await prisma.entertainmentShow.findMany({
    where,
    include: {
      performances: {
        where: {
          startDateTime: {
            gte: new Date(),
          },
          isCancelled: false,
        },
        orderBy: {
          startDateTime: 'asc',
        },
        take: 5,
      },
      _count: {
        select: {
          performances: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return shows;
}

// Create shows
export async function createShows(placeId: string, showsData: CreateShowData[]) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  // Delete existing shows
  await prisma.entertainmentShow.deleteMany({
    where: { placeId },
  });

  const shows = await prisma.entertainmentShow.createMany({
    data: showsData.map((show) => ({
      ...show,
      placeId,
    })),
  });

  return shows;
}

// List performances
export async function listPerformances(
  placeId: string,
  filters?: {
    showId?: string;
    startDate?: Date;
    endDate?: Date;
    availableOnly?: boolean;
  }
) {
  const where: Prisma.EntertainmentPerformanceWhereInput = {
    placeId,
  };

  if (filters?.showId) where.showId = filters.showId;
  if (filters?.startDate) {
    where.startDateTime = {
      gte: filters.startDate,
    };
  }
  if (filters?.endDate) {
    where.endDateTime = {
      lte: filters.endDate,
    };
  }
  if (filters?.availableOnly) {
    where.isSoldOut = false;
    where.isCancelled = false;
  }

  const performances = await prisma.entertainmentPerformance.findMany({
    where,
    include: {
      show: true,
    },
    orderBy: {
      startDateTime: 'asc',
    },
  });

  return performances;
}

// Create performances
export async function createPerformances(
  placeId: string,
  performancesData: CreatePerformanceData[]
) {
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  // Verify all shows exist
  const showIds = [...new Set(performancesData.map((p) => p.showId))];
  const shows = await prisma.entertainmentShow.findMany({
    where: {
      id: { in: showIds },
      placeId,
    },
  });

  if (shows.length !== showIds.length) {
    throw new Error('One or more shows not found');
  }

  const performances = await prisma.entertainmentPerformance.createMany({
    data: performancesData.map((perf) => ({
      ...perf,
      placeId,
    })),
  });

  return performances;
}

// Update performance
export async function updatePerformance(id: string, data: Partial<CreatePerformanceData>) {
  const performance = await prisma.entertainmentPerformance.update({
    where: { id },
    data,
    include: {
      show: true,
    },
  });

  return performance;
}