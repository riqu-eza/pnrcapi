import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// FULL PLACE — used by every single-place response:
//   getPlaceById, getPlaceBySlug, createDraftPlace, updatePlaceBasicInfo,
//   updatePlaceLocation, updatePlaceContact, updatePlaceAttributes,
//   updatePlaceMedia, updatePlaceBooking, updatePlaceTaxonomy,
//   linkPlaceToCategories, submitPlace
//
// This is what fixes "attributes and taxonomy silently zeroed out".
// Every update function had its own hand-written include — some had
// category.parent, some didn't; none consistently included attributes.
// One object used everywhere = one shape Flutter can always rely on.
// ─────────────────────────────────────────────────────────────────────────────
export const FULL_PLACE_INCLUDE = {
  include: {
    city: {
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        region: true,
        latitude: true,
        longitude: true,
      },
    },
    categoryLinks: {
      include: {
        category: {
          include: {
            // parent nested inside each category —
            // what the frontend asked for, was missing from PUT response
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
      },
    },
    reviews: {
      take: 10,
      orderBy: { createdAt: "desc" as const },
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
} satisfies Omit<Prisma.PlaceFindUniqueArgs, "where">;

// ─────────────────────────────────────────────────────────────────────────────
// LIST PLACE — used by listPlaces and getPlacesByOwner
// No reviews. Category includes parent for nav/breadcrumb.
// ─────────────────────────────────────────────────────────────────────────────
export const LIST_PLACE_INCLUDE = {
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
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
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
} satisfies Omit<Prisma.PlaceFindManyArgs, "where">;

// ─────────────────────────────────────────────────────────────────────────────
// Inferred TypeScript types — use these instead of writing interfaces by hand
// ─────────────────────────────────────────────────────────────────────────────
export type FullPlace = Prisma.PlaceGetPayload<{
  include: typeof FULL_PLACE_INCLUDE.include;
}>;

export type ListPlace = Prisma.PlaceGetPayload<{
  include: typeof LIST_PLACE_INCLUDE.include;
}>;