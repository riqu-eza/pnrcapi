import { prisma } from "@/lib/prisma";
import { Prisma, PlaceStatus } from "@prisma/client";
import { FULL_PLACE_INCLUDE, LIST_PLACE_INCLUDE, FullPlace, ListPlace } from "@/lib/placeSelect";

// ── Interfaces (unchanged from your original) ─────────────────────────────────

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
  radius?: number;
}

export interface CreatePlaceData {
  name: string;
  cityId: string;
  primaryCategory: string;
  ownerId?: string;
}

export interface UpdatePlaceBasicData {
  name?: string | null;
  slug?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  area?: string | null;
}

export interface UpdatePlaceLocationData {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
}

export interface UpdatePlaceContactData {
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  } | null;
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
  }> | null;
  coverImage?: string | null;
}

export interface UpdatePlaceBookingData {
  isBookable?: boolean;
  pricing?: {
    min?: number;
    max?: number;
    unit?: string;
    currency?: string;
  } | null;
  bookingSettings?: {
    advanceNotice?: number;
    minDuration?: number;
    maxDuration?: number;
    cancellationPolicy?: string;
  } | null;
}

export interface UpdatePlaceTaxonomyData {
  taxonomy: string[];
  tags?: string[];
  searchKeywords?: string[];
}

// ── listPlaces ────────────────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with LIST_PLACE_INCLUDE
// CHANGED: added includeAttributes param — when false, strips heavy JSON fields
//          before returning so the list payload stays lean for Flutter list screens

export async function listPlaces(
  filters: PlaceFilters = {},
  page = 1,
  limit = 20,
  includeAttributes = false,
) {
  const {
    cityId, status, isBookable, taxonomy, categoryId,
    search, minPrice, maxPrice, latitude, longitude, radius,
  } = filters;

  const where: Prisma.PlaceWhereInput = {};

  if (cityId) where.cityId = cityId;
  if (status) where.status = status;
  if (isBookable !== undefined) where.isBookable = isBookable;

  if (taxonomy && taxonomy.length > 0) {
    where.taxonomy = { hasSome: taxonomy };
  }

  if (categoryId) {
    where.categoryLinks = { some: { categoryId } };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { searchKeywords: { hasSome: [search.toLowerCase()] } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilters: any[] = [];
    if (minPrice !== undefined) {
      priceFilters.push({ pricing: { path: ["min"], gte: minPrice } });
    }
    if (maxPrice !== undefined) {
      priceFilters.push({ pricing: { path: ["max"], lte: maxPrice } });
    }
    if (priceFilters.length > 0) where.AND = priceFilters;
  }

  if (latitude && longitude && radius) {
    const latDelta = radius / 111;
    const lonDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));
    where.latitude = { gte: latitude - latDelta, lte: latitude + latDelta };
    where.longitude = { gte: longitude - lonDelta, lte: longitude + lonDelta };
  }

  const skip = (page - 1) * limit;

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      ...LIST_PLACE_INCLUDE,           // ← was a hand-written include block
      skip,
      take: limit,
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.place.count({ where }),
  ]);

  // Strip heavy JSON fields unless the caller opted in.
  // Prisma's include always returns all scalar columns — we trim at the
  // application layer rather than duplicating the entire select shape.
  const result = includeAttributes
    ? places
    : places.map(({ attributes, contact, images, description,
                    bookingSettings, searchKeywords, ...rest }) => rest);

  return {
    places: result,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getPlaceById ──────────────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with FULL_PLACE_INCLUDE

export async function getPlaceById(id: string): Promise<FullPlace | null> {
  return prisma.place.findUnique({
    where: { id },
    ...FULL_PLACE_INCLUDE,             // ← was a hand-written include block
  });
}

// ── getPlaceBySlug ────────────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with FULL_PLACE_INCLUDE

export async function getPlaceBySlug(slug: string): Promise<FullPlace | null> {
  return prisma.place.findUnique({
    where: { slug },
    ...FULL_PLACE_INCLUDE,             // ← was a hand-written include block
  });
}

// ── createDraftPlace ──────────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with FULL_PLACE_INCLUDE

export async function createDraftPlace(data: CreatePlaceData): Promise<FullPlace> {
  const { name, cityId, primaryCategory, ownerId } = data;

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw new Error("City not found");

  const category = await prisma.category.findUnique({ where: { slug: primaryCategory } });
  if (!category) throw new Error("Category not found");

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const existingSlug = await prisma.place.findUnique({ where: { slug } });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  return prisma.place.create({
    data: {
      name,
      slug: finalSlug,
      cityId,
      taxonomy: [primaryCategory],
      status: PlaceStatus.PENDING,
      ownerId,
      attributes: {},
      categoryLinks: { create: { categoryId: category.id } },
    },
    ...FULL_PLACE_INCLUDE,             // ← was a hand-written include block
  });
}

// ── updatePlaceBasicInfo ──────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with FULL_PLACE_INCLUDE

export async function updatePlaceBasicInfo(
  id: string,
  data: UpdatePlaceBasicData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.place.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new Error("Slug already exists");
  }

  return prisma.place.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.area !== undefined && { area: data.area }),
    },
    ...FULL_PLACE_INCLUDE,             // ← was a hand-written include block
  });
}

// ── updatePlaceLocation ───────────────────────────────────────────────────────
// CHANGED: was returning a bare place with no relations; now returns FullPlace

export async function updatePlaceLocation(
  id: string,
  data: UpdatePlaceLocationData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  return prisma.place.update({
    where: { id },
    data: {
      ...(data.address !== undefined && { address: data.address }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.area !== undefined && { area: data.area }),
    },
    ...FULL_PLACE_INCLUDE,             // ← was returning bare place with no include
  });
}

// ── updatePlaceContact ────────────────────────────────────────────────────────
// CHANGED: was returning a bare place with no relations; now returns FullPlace

export async function updatePlaceContact(
  id: string,
  data: UpdatePlaceContactData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  return prisma.place.update({
    where: { id },
    data: { contact: data.contact || Prisma.JsonNull },
    ...FULL_PLACE_INCLUDE,             // ← was returning bare place with no include
  });
}

// ── updatePlaceAttributes ─────────────────────────────────────────────────────
// CHANGED: was returning a bare place with no relations; now returns FullPlace

export async function updatePlaceAttributes(
  id: string,
  data: UpdatePlaceAttributesData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  return prisma.place.update({
    where: { id },
    data: { attributes: data.attributes },
    ...FULL_PLACE_INCLUDE,             // ← was returning bare place with no include
  });
}

// ── updatePlaceMedia ──────────────────────────────────────────────────────────
// CHANGED: was returning a bare place with no relations; now returns FullPlace

export async function updatePlaceMedia(
  id: string,
  data: UpdatePlaceMediaData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  return prisma.place.update({
    where: { id },
    data: {
      ...(data.images !== undefined && {
        images: data.images === null ? Prisma.JsonNull : data.images,
      }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
    },
    ...FULL_PLACE_INCLUDE,             // ← was returning bare place with no include
  });
}

// ── updatePlaceBooking ────────────────────────────────────────────────────────
// CHANGED: was returning a bare place with no relations; now returns FullPlace

export async function updatePlaceBooking(
  id: string,
  data: UpdatePlaceBookingData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  return prisma.place.update({
    where: { id },
    data: {
      ...(data.isBookable !== undefined && { isBookable: data.isBookable }),
      ...(data.pricing !== undefined && { pricing: data.pricing || Prisma.JsonNull }),
      ...(data.bookingSettings !== undefined && {
        bookingSettings: data.bookingSettings || Prisma.JsonNull,
      }),
    },
    ...FULL_PLACE_INCLUDE,             // ← was returning bare place with no include
  });
}

// ── updatePlaceTaxonomy ───────────────────────────────────────────────────────
// CHANGED: was returning a bare place with no relations; now returns FullPlace

export async function updatePlaceTaxonomy(
  id: string,
  data: UpdatePlaceTaxonomyData,
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({ where: { id } });
  if (!existing) throw new Error("Place not found");

  return prisma.place.update({
    where: { id },
    data: {
      taxonomy: data.taxonomy,
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.searchKeywords !== undefined && { searchKeywords: data.searchKeywords }),
    },
    ...FULL_PLACE_INCLUDE,             // ← was returning bare place with no include
  });
}

// ── linkPlaceToCategories ─────────────────────────────────────────────────────
// CHANGED: skipDuplicates (additive, not replace-all)
// CHANGED: categoryId existence check before write
// CHANGED: replaced hand-written include with FULL_PLACE_INCLUDE

export async function linkPlaceToCategories(
  placeId: string,
  categoryIds: string[],
): Promise<FullPlace> {
  const existing = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true },
  });
  if (!existing) throw new Error("Place not found");

  const foundCategories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });
  if (foundCategories.length !== categoryIds.length) {
    const foundIds = new Set(foundCategories.map((c) => c.id));
    const missing = categoryIds.filter((id) => !foundIds.has(id));
    throw new Error(`Categories not found: ${missing.join(", ")}`);
  }

  await prisma.placeCategory.createMany({
    data: categoryIds.map((categoryId) => ({ placeId, categoryId })),
    skipDuplicates: true,              // ← additive, not replace-all
  });

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    ...FULL_PLACE_INCLUDE,             // ← was missing parent, attributes, etc.
  });
  if (!place) throw new Error("Place not found after update");

  return place;
}

// ── validatePlace ─────────────────────────────────────────────────────────────
// Unchanged in logic; include is minimal (only needs categoryLinks count)

export async function validatePlace(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      categoryLinks: { include: { category: true } },
    },
  });

  if (!place) throw new Error("Place not found");

  const missing: string[] = [];

  if (!place.name) missing.push("name");
  if (!place.description) missing.push("description");
  if (!place.cityId) missing.push("cityId");
  if (!place.coverImage && (!place.images || (place.images as any[]).length === 0)) {
    missing.push("coverImage or images");
  }
  if (!place.address) missing.push("address");
  if (!place.latitude || !place.longitude) missing.push("location coordinates");
  if (place.categoryLinks.length === 0) missing.push("at least one category");

  return { isValid: missing.length === 0, missing };
}

// ── submitPlace ───────────────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with FULL_PLACE_INCLUDE

export async function submitPlace(id: string): Promise<FullPlace> {
  const validation = await validatePlace(id);

  if (!validation.isValid) {
    throw new Error(
      `Cannot submit place. Missing required fields: ${validation.missing.join(", ")}`,
    );
  }

  return prisma.place.update({
    where: { id },
    data: { status: PlaceStatus.ACTIVE },
    ...FULL_PLACE_INCLUDE,             // ← was a hand-written include block
  });
}

// ── updatePlaceStatus ─────────────────────────────────────────────────────────
// Unchanged — returns bare place intentionally (admin-only, no shape concern)

export async function updatePlaceStatus(id: string, status: PlaceStatus) {
  return prisma.place.update({
    where: { id },
    data: { status },
  });
}

// ── deletePlace ───────────────────────────────────────────────────────────────
// Unchanged

export async function deletePlace(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true, reviews: true } } },
  });

  if (!place) throw new Error("Place not found");

  if (place._count.bookings > 0) {
    throw new Error(
      `Cannot delete place. It has ${place._count.bookings} booking(s). Archive it instead.`,
    );
  }

  await prisma.placeCategory.deleteMany({ where: { placeId: id } });
  await prisma.review.deleteMany({ where: { placeId: id } });
  await prisma.place.delete({ where: { id } });

  return { success: true };
}

// ── getPlacesByOwner ──────────────────────────────────────────────────────────
// CHANGED: replaced hand-written include with LIST_PLACE_INCLUDE

export async function getPlacesByOwner(
  ownerId: string,
  status?: PlaceStatus,
): Promise<ListPlace[]> {
  const where: Prisma.PlaceWhereInput = { ownerId };
  if (status) where.status = status;

  return prisma.place.findMany({
    where,
    ...LIST_PLACE_INCLUDE,             // ← was a hand-written include block
    orderBy: { createdAt: "desc" },
  });
}