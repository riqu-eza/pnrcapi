import { prisma } from '@/lib/prisma';
import { RoomType, BedType, Prisma } from '@prisma/client';

export interface CreateRoomData {
  name: string;
  description?: string;
  roomType: RoomType;
  roomNumber?: string;
  floor?: number;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  beds: Array<{
    bedType: BedType;
    quantity: number;
  }>;
  sizeSquareMeters?: number;
  hasBalcony?: boolean;
  hasKitchen?: boolean;
  hasLivingRoom?: boolean;
  amenities: string[];
  basePrice: number;
  weekendPrice?: number;
  currency?: string;
  seasonalPricing?: any;
  images?: string[];
  metadata?: any;
  sortOrder?: number;
}

export async function listRooms(placeId: string, isAvailable?: boolean) {
  const where: Prisma.AccommodationRoomWhereInput = {
    placeId,
  };

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable;
  }

  const rooms = await prisma.accommodationRoom.findMany({
    where,
    include: {
      beds: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return rooms;
}

export async function getRoomById(id: string) {
  const room = await prisma.accommodationRoom.findUnique({
    where: { id },
    include: {
      beds: true,
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return room;
}

export async function createRooms(placeId: string, roomsData: CreateRoomData[]) {
  // Verify place exists
  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  // Delete existing rooms and create new ones (replace strategy)
  await prisma.accommodationRoom.deleteMany({
    where: { placeId },
  });

  // Create rooms with beds
  const createdRooms = await Promise.all(
    roomsData.map(async (roomData) => {
      const { beds, ...roomInfo } = roomData;

      return await prisma.accommodationRoom.create({
        data: {
          ...roomInfo,
          placeId,
          beds: {
            create: beds,
          },
        },
        include: {
          beds: true,
        },
      });
    })
  );

  return createdRooms;
}

export async function updateRoom(id: string, data: Partial<CreateRoomData>) {
  const { beds, ...roomData } = data;

  const room = await prisma.accommodationRoom.update({
    where: { id },
    data: roomData,
    include: {
      beds: true,
    },
  });

  // Update beds if provided
  if (beds) {
    // Delete existing beds
    await prisma.accommodationBed.deleteMany({
      where: { roomId: id },
    });

    // Create new beds
    await prisma.accommodationBed.createMany({
      data: beds.map((bed) => ({
        ...bed,
        roomId: id,
      })),
    });
  }

  return await getRoomById(id);
}

export async function deleteRoom(id: string) {
  await prisma.accommodationRoom.delete({
    where: { id },
  });

  return { success: true };
}

export async function searchRooms(filters: {
  placeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  roomType?: RoomType;
  hasBalcony?: boolean;
  hasKitchen?: boolean;
}) {
  const where: Prisma.AccommodationRoomWhereInput = {
    isAvailable: true,
  };

  if (filters.placeId) where.placeId = filters.placeId;

  // Build a basePrice filter object safely instead of spreading potentially undefined values
  const basePriceFilter: any = {};
  if (filters.minPrice !== undefined) basePriceFilter.gte = filters.minPrice;
  if (filters.maxPrice !== undefined) basePriceFilter.lte = filters.maxPrice;
  if (Object.keys(basePriceFilter).length > 0) where.basePrice = basePriceFilter;

  if (filters.minGuests) where.maxGuests = { gte: filters.minGuests };
  if (filters.roomType) where.roomType = filters.roomType;
  if (filters.hasBalcony !== undefined) where.hasBalcony = filters.hasBalcony;
  if (filters.hasKitchen !== undefined) where.hasKitchen = filters.hasKitchen;

  const rooms = await prisma.accommodationRoom.findMany({
    where,
    include: {
      beds: true,
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
          coverImage: true,
        },
      },
    },
    orderBy: { basePrice: 'asc' },
  });

  return rooms;
}