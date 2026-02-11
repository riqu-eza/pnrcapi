import { prisma } from '@/lib/prisma';
import { Prisma, PlaceStatus } from '@prisma/client';

export interface PlaceFilters {
  cityId?: string;
  status?: PlaceStatus;
  isBookable?: boolean;
  taxonomy?: string[];
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
}

export interface CreatePlaceData {
  name: string;
  cityId: string;
  primaryCategory: string;
  ownerId?: string;
}

export interface UpdatePlaceBasicData {
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  area?: string;
}

export interface UpdatePlaceLocationData {
  address?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
}

export interface UpdatePlaceContactData {
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface UpdatePlaceAttributesData {
  attributes: Record<string, any>;
}

export interface UpdatePlaceMediaData {
  images?: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
    order?: number;
  }>;
  coverImage?: string;
}

export interface UpdatePlaceBookingData {
  isBookable?: boolean;
  pricing?: {
    min?: number;
    max?: number;
    unit?: string;
    currency?: string;
  };
  bookingSettings?: {
    advanceNotice?: number;
    minDuration?: number;
    maxDuration?: number;
    cancellationPolicy?: string;
  };
}

export interface UpdatePlaceTaxonomyData {
  taxonomy: string[];
  tags?: string[];
  searchKeywords?: string[];
}

// List places with filters
export async function listPlaces(filters: PlaceFilters = {}, page = 1, limit = 20) {
  const {
    cityId,
    status,
    isBookable,
    taxonomy,
    categoryId,
    search,
    minPrice,
    maxPrice,
    latitude,
    longitude,
    radius,
  } = filters;

  const where: Prisma.PlaceWhereInput = {};

  if (cityId) where.cityId = cityId;
  if (status) where.status = status;
  if (isBookable !== undefined) where.isBookable = isBookable;

  if (taxonomy && taxonomy.length > 0) {
    where.taxonomy = {
      hasSome: taxonomy,
    };
  }

  if (categoryId) {
    where.categoryLinks = {
      some: {
        categoryId,
      },
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { searchKeywords: { hasSome: [search.toLowerCase()] } },
    ];
  }

  // Price range filter (using JSONB)
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilters: any[] = [];
    if (minPrice !== undefined) {
      priceFilters.push({
        pricing: {
          path: ['min'],
          gte: minPrice,
        },
      });
    }
    if (maxPrice !== undefined) {
      priceFilters.push({
        pricing: {
          path: ['max'],
          lte: maxPrice,
        },
      });
    }
    if (priceFilters.length > 0) {
      where.AND = priceFilters;
    }
  }

  // Geo-proximity filter (simple bounding box - for production use PostGIS)
  if (latitude && longitude && radius) {
    const latDelta = radius / 111; // rough km to degrees
    const lonDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

    where.latitude = {
      gte: latitude - latDelta,
      lte: latitude + latDelta,
    };
    where.longitude = {
      gte: longitude - lonDelta,
      lte: longitude + lonDelta,
    };
  }

  const skip = (page - 1) * limit;

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            region: true,
          },
        },
        categoryLinks: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.place.count({ where }),
  ]);

  return {
    places,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get place by ID
export async function getPlaceById(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      city: true,
      categoryLinks: {
        include: {
          category: {
            include: {
              parent: true,
            },
          },
        },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  return place;
}

// Get place by slug
export async function getPlaceBySlug(slug: string) {
  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      city: true,
      categoryLinks: {
        include: {
          category: {
            include: {
              parent: true,
            },
          },
        },
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  return place;
}

// STEP 1: Create draft place (minimal data)
export async function createDraftPlace(data: CreatePlaceData) {
  const { name, cityId, primaryCategory, ownerId } = data;

  // Verify city exists
  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    throw new Error('City not found');
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { slug: primaryCategory },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check slug uniqueness
  const existingSlug = await prisma.place.findUnique({
    where: { slug },
  });

  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  // Create place
  const place = await prisma.place.create({
    data: {
      name,
      slug: finalSlug,
      cityId,
      taxonomy: [primaryCategory],
      status: PlaceStatus.PENDING,
      ownerId,
      attributes: {},
      categoryLinks: {
        create: {
          categoryId: category.id,
        },
      },
    },
    include: {
      city: true,
      categoryLinks: {
        include: {
          category: true,
        },
      },
    },
  });

  return place;
}

// Update basic info
export async function updatePlaceBasicInfo(id: string, data: UpdatePlaceBasicData) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  // Check slug uniqueness if updating
  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.place.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      throw new Error('Slug already exists');
    }
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.shortDescription !== undefined && {
        shortDescription: data.shortDescription,
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.area !== undefined && { area: data.area }),
    },
    include: {
      city: true,
      categoryLinks: {
        include: {
          category: true,
        },
      },
    },
  });

  return place;
}

// Update location
export async function updatePlaceLocation(id: string, data: UpdatePlaceLocationData) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      ...(data.address !== undefined && { address: data.address }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.area !== undefined && { area: data.area }),
    },
  });

  return place;
}

// Update contact info
export async function updatePlaceContact(id: string, data: UpdatePlaceContactData) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      contact: data.contact || Prisma.JsonNull,
    },
  });

  return place;
}

// Update attributes (JSONB)
export async function updatePlaceAttributes(
  id: string,
  data: UpdatePlaceAttributesData
) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  // TODO: Add validation based on category schema
  // const schema = AttributeSchemaRegistry[existing.taxonomy[0]];
  // const validated = schema.parse(data.attributes);

  const place = await prisma.place.update({
    where: { id },
    data: {
      attributes: data.attributes,
    },
  });

  return place;
}

// Update media
export async function updatePlaceMedia(id: string, data: UpdatePlaceMediaData) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      ...(data.images !== undefined && { images: data.images }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
    },
  });

  return place;
}

// Update booking settings
export async function updatePlaceBooking(id: string, data: UpdatePlaceBookingData) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      ...(data.isBookable !== undefined && { isBookable: data.isBookable }),
      ...(data.pricing !== undefined && { pricing: data.pricing }),
      ...(data.bookingSettings !== undefined && {
        bookingSettings: data.bookingSettings,
      }),
    },
  });

  return place;
}

// Update taxonomy and categories
export async function updatePlaceTaxonomy(id: string, data: UpdatePlaceTaxonomyData) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      taxonomy: data.taxonomy,
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.searchKeywords !== undefined && {
        searchKeywords: data.searchKeywords,
      }),
    },
  });

  return place;
}

// Link place to categories
export async function linkPlaceToCategories(id: string, categoryIds: string[]) {
  const existing = await prisma.place.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Place not found');
  }

  // Remove existing links
  await prisma.placeCategory.deleteMany({
    where: { placeId: id },
  });

  // Create new links
  await prisma.placeCategory.createMany({
    data: categoryIds.map((categoryId) => ({
      placeId: id,
      categoryId,
    })),
  });

  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      categoryLinks: {
        include: {
          category: true,
        },
      },
    },
  });

  return place;
}

// Validate place before submission
export async function validatePlace(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      categoryLinks: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  const missing: string[] = [];

  // Basic validations
  if (!place.name) missing.push('name');
  if (!place.description) missing.push('description');
  if (!place.cityId) missing.push('cityId');
  if (!place.coverImage && (!place.images || (place.images as any[]).length === 0)) {
    missing.push('coverImage or images');
  }
  if (!place.address) missing.push('address');
  if (!place.latitude || !place.longitude) missing.push('location coordinates');
  if (place.categoryLinks.length === 0) missing.push('at least one category');

  // Category-specific validations
  // TODO: Add based on attribute schemas

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// Submit place for review (change status from PENDING to ACTIVE or await approval)
export async function submitPlace(id: string) {
  const validation = await validatePlace(id);

  if (!validation.isValid) {
    throw new Error(
      `Cannot submit place. Missing required fields: ${validation.missing.join(', ')}`
    );
  }

  const place = await prisma.place.update({
    where: { id },
    data: {
      status: PlaceStatus.ACTIVE, // Or PENDING for manual approval
    },
    include: {
      city: true,
      categoryLinks: {
        include: {
          category: true,
        },
      },
    },
  });

  return place;
}

// Update place status
export async function updatePlaceStatus(id: string, status: PlaceStatus) {
  const place = await prisma.place.update({
    where: { id },
    data: { status },
  });

  return place;
}

// Delete place
export async function deletePlace(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!place) {
    throw new Error('Place not found');
  }

  // Check if place has bookings
  if (place._count.bookings > 0) {
    throw new Error(
      `Cannot delete place. It has ${place._count.bookings} booking(s). Archive it instead.`
    );
  }

  // Delete category links first
  await prisma.placeCategory.deleteMany({
    where: { placeId: id },
  });

  // Delete reviews
  await prisma.review.deleteMany({
    where: { placeId: id },
  });

  // Delete place
  await prisma.place.delete({
    where: { id },
  });

  return { success: true };
}

// Get places by owner
export async function getPlacesByOwner(ownerId: string, status?: PlaceStatus) {
  const where: Prisma.PlaceWhereInput = {
    ownerId,
  };

  if (status) {
    where.status = status;
  }

  const places = await prisma.place.findMany({
    where,
    include: {
      city: true,
      categoryLinks: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return places;
}