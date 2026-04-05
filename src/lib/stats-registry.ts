import { PrismaClient, BookingStatus, PaymentStatus, PlaceStatus, BlogStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface StatItem {
  key: string;
  label: string;
  value: number | string;
  group: string;
  meta?: Record<string, unknown>;
}

// Each stat is self-contained: key, group, label, and its own resolver.
// To add a new stat, just append an entry here - nothing else changes.
type StatResolver = () => Promise<StatItem>;

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

export const STATS_REGISTRY: Record<string, StatResolver> = {

  // ── Cities ───────────────────────────────────────────────────────────────
  cities_total: async () => ({
    key: "cities_total", group: "cities", label: "Total cities",
    value: await prisma.city.count(),
  }),
  cities_active: async () => ({
    key: "cities_active", group: "cities", label: "Active cities",
    value: await prisma.city.count({ where: { isActive: true } }),
  }),
  cities_with_places: async () => {
    const result = await prisma.place.groupBy({ by: ["cityId"], _count: { id: true } });
    return { key: "cities_with_places", group: "cities", label: "Cities with places", value: result.length };
  },

  // ── Places ───────────────────────────────────────────────────────────────
  places_total: async () => ({
    key: "places_total", group: "places", label: "Total places",
    value: await prisma.place.count(),
  }),
  places_active: async () => ({
    key: "places_active", group: "places", label: "Active places",
    value: await prisma.place.count({ where: { status: PlaceStatus.ACTIVE } }),
  }),
  places_pending: async () => ({
    key: "places_pending", group: "places", label: "Pending review",
    value: await prisma.place.count({ where: { status: PlaceStatus.PENDING } }),
  }),
  places_bookable: async () => ({
    key: "places_bookable", group: "places", label: "Bookable places",
    value: await prisma.place.count({ where: { isBookable: true } }),
  }),
  places_by_taxonomy: async () => {
    const rows = await prisma.place.groupBy({ by: ["taxonomy"], _count: { id: true } });
    return {
      key: "places_by_taxonomy", group: "places", label: "Places by taxonomy",
      value: rows.length, meta: { breakdown: rows },
    };
  },
  places_per_city: async () => {
    const rows = await prisma.place.groupBy({
      by: ["cityId"], _count: { id: true }, orderBy: { _count: { id: "desc" } },
    });
    return {
      key: "places_per_city", group: "places", label: "Places per city",
      value: rows.length, meta: { breakdown: rows },
    };
  },
  places_per_category: async () => {
    const rows = await prisma.placeCategory.groupBy({
      by: ["categoryId"], _count: { placeId: true }, orderBy: { _count: { placeId: "desc" } },
    });
    return {
      key: "places_per_category", group: "places", label: "Places per category",
      value: rows.length, meta: { breakdown: rows },
    };
  },

  // ── Accommodation ────────────────────────────────────────────────────────
  rooms_total: async () => ({
    key: "rooms_total", group: "accommodation", label: "Total rooms",
    value: await prisma.accommodationRoom.count(),
  }),
  rooms_available: async () => ({
    key: "rooms_available", group: "accommodation", label: "Available rooms",
    value: await prisma.accommodationRoom.count({ where: { isAvailable: true } }),
  }),
  rooms_avg_price: async () => {
    const r = await prisma.accommodationRoom.aggregate({ _avg: { basePrice: true } });
    return { key: "rooms_avg_price", group: "accommodation", label: "Avg room price (KES)", value: Math.round(r._avg.basePrice ?? 0) };
  },
  rooms_by_type: async () => {
    const rows = await prisma.accommodationRoom.groupBy({ by: ["roomType"], _count: { id: true } });
    return { key: "rooms_by_type", group: "accommodation", label: "Room types", value: rows.length, meta: { breakdown: rows } };
  },

  // ── Dining ───────────────────────────────────────────────────────────────
  menu_items_total: async () => ({
    key: "menu_items_total", group: "dining", label: "Total menu items",
    value: await prisma.diningMenuItem.count(),
  }),
  menu_items_available: async () => ({
    key: "menu_items_available", group: "dining", label: "Available items",
    value: await prisma.diningMenuItem.count({ where: { isAvailable: true } }),
  }),
  menu_items_vegetarian: async () => ({
    key: "menu_items_vegetarian", group: "dining", label: "Vegetarian items",
    value: await prisma.diningMenuItem.count({ where: { isVegetarian: true } }),
  }),
  menu_items_vegan: async () => ({
    key: "menu_items_vegan", group: "dining", label: "Vegan items",
    value: await prisma.diningMenuItem.count({ where: { isVegan: true } }),
  }),
  menu_items_signature: async () => ({
    key: "menu_items_signature", group: "dining", label: "Signature dishes",
    value: await prisma.diningMenuItem.count({ where: { isSignatureDish: true } }),
  }),
  menu_avg_price: async () => {
    const r = await prisma.diningMenuItem.aggregate({ _avg: { price: true } });
    return { key: "menu_avg_price", group: "dining", label: "Avg menu price (KES)", value: Math.round(r._avg.price ?? 0) };
  },
  menu_by_meal_type: async () => {
    const rows = await prisma.diningMenuItem.groupBy({ by: ["mealType"], _count: { id: true } });
    return { key: "menu_by_meal_type", group: "dining", label: "Items by meal type", value: rows.length, meta: { breakdown: rows } };
  },
  menu_by_cuisine: async () => {
    const rows = await prisma.diningMenuItem.groupBy({ by: ["cuisineType"], _count: { id: true } });
    return { key: "menu_by_cuisine", group: "dining", label: "Items by cuisine", value: rows.length, meta: { breakdown: rows } };
  },

  // ── Entertainment ────────────────────────────────────────────────────────
  shows_total: async () => ({
    key: "shows_total", group: "entertainment", label: "Total shows",
    value: await prisma.entertainmentShow.count(),
  }),
  shows_active: async () => ({
    key: "shows_active", group: "entertainment", label: "Active shows",
    value: await prisma.entertainmentShow.count({ where: { isActive: true } }),
  }),
  performances_upcoming: async () => ({
    key: "performances_upcoming", group: "entertainment", label: "Upcoming performances",
    value: await prisma.entertainmentPerformance.count({ where: { startDateTime: { gte: now }, isCancelled: false } }),
  }),
  performances_sold_out: async () => ({
    key: "performances_sold_out", group: "entertainment", label: "Sold-out performances",
    value: await prisma.entertainmentPerformance.count({ where: { isSoldOut: true } }),
  }),

  // ── Cultural ─────────────────────────────────────────────────────────────
  exhibitions_total: async () => ({
    key: "exhibitions_total", group: "cultural", label: "Total exhibitions",
    value: await prisma.culturalExhibition.count(),
  }),
  exhibitions_active: async () => ({
    key: "exhibitions_active", group: "cultural", label: "Active exhibitions",
    value: await prisma.culturalExhibition.count({ where: { isActive: true, endDate: { gte: now } } }),
  }),
  exhibitions_permanent: async () => ({
    key: "exhibitions_permanent", group: "cultural", label: "Permanent exhibitions",
    value: await prisma.culturalExhibition.count({ where: { isPermanent: true } }),
  }),
  exhibitions_free: async () => ({
    key: "exhibitions_free", group: "cultural", label: "Free-entry exhibitions",
    value: await prisma.culturalExhibition.count({ where: { hasFreeEntry: true } }),
  }),
  artifacts_total: async () => ({
    key: "artifacts_total", group: "cultural", label: "Total artifacts",
    value: await prisma.culturalArtifact.count(),
  }),
  artifacts_on_display: async () => ({
    key: "artifacts_on_display", group: "cultural", label: "Artifacts on display",
    value: await prisma.culturalArtifact.count({ where: { isOnDisplay: true } }),
  }),

  // ── Bookings ─────────────────────────────────────────────────────────────
  bookings_total: async () => ({
    key: "bookings_total", group: "bookings", label: "Total bookings",
    value: await prisma.booking.count(),
  }),
  bookings_confirmed: async () => ({
    key: "bookings_confirmed", group: "bookings", label: "Confirmed bookings",
    value: await prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
  }),
  bookings_pending: async () => ({
    key: "bookings_pending", group: "bookings", label: "Pending bookings",
    value: await prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
  }),
  bookings_cancelled: async () => ({
    key: "bookings_cancelled", group: "bookings", label: "Cancelled bookings",
    value: await prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
  }),
  bookings_completed: async () => ({
    key: "bookings_completed", group: "bookings", label: "Completed bookings",
    value: await prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
  }),
  bookings_this_month: async () => ({
    key: "bookings_this_month", group: "bookings", label: "Bookings this month",
    value: await prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
  }),
  bookings_per_city: async () => {
    const rows = await prisma.booking.groupBy({
      by: ["cityId"], _count: { id: true }, orderBy: { _count: { id: "desc" } },
    });
    return { key: "bookings_per_city", group: "bookings", label: "Bookings per city", value: rows.length, meta: { breakdown: rows } };
  },
  bookings_per_place: async () => {
    const rows = await prisma.booking.groupBy({
      by: ["placeId"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 20,
    });
    return { key: "bookings_per_place", group: "bookings", label: "Top 20 places by bookings", value: rows.length, meta: { breakdown: rows } };
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  payments_total: async () => ({
    key: "payments_total", group: "payments", label: "Total payments",
    value: await prisma.payment.count(),
  }),
  payments_completed: async () => ({
    key: "payments_completed", group: "payments", label: "Completed payments",
    value: await prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
  }),
  payments_failed: async () => ({
    key: "payments_failed", group: "payments", label: "Failed payments",
    value: await prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
  }),
  payments_refunded: async () => ({
    key: "payments_refunded", group: "payments", label: "Refunded payments",
    value: await prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
  }),
  revenue_total: async () => {
    const r = await prisma.payment.aggregate({ where: { status: PaymentStatus.COMPLETED }, _sum: { amount: true } });
    return { key: "revenue_total", group: "payments", label: "Total revenue (KES)", value: Math.round(r._sum.amount ?? 0) };
  },
  revenue_this_month: async () => {
    const r = await prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    return { key: "revenue_this_month", group: "payments", label: "Revenue this month (KES)", value: Math.round(r._sum.amount ?? 0) };
  },

  // ── Users ────────────────────────────────────────────────────────────────
  users_total: async () => ({
    key: "users_total", group: "users", label: "Total users",
    value: await prisma.appUser.count(),
  }),
  users_active: async () => ({
    key: "users_active", group: "users", label: "Active users",
    value: await prisma.appUser.count({ where: { isActive: true } }),
  }),
  users_verified: async () => ({
    key: "users_verified", group: "users", label: "Email-verified users",
    value: await prisma.appUser.count({ where: { emailVerified: true } }),
  }),

  // ── Reviews ──────────────────────────────────────────────────────────────
  reviews_total: async () => ({
    key: "reviews_total", group: "reviews", label: "Total reviews",
    value: await prisma.review.count(),
  }),
  reviews_verified: async () => ({
    key: "reviews_verified", group: "reviews", label: "Verified reviews",
    value: await prisma.review.count({ where: { isVerified: true } }),
  }),
  reviews_avg_rating: async () => {
    const r = await prisma.review.aggregate({ _avg: { rating: true } });
    return { key: "reviews_avg_rating", group: "reviews", label: "Average rating", value: Number((r._avg.rating ?? 0).toFixed(2)) };
  },

  // ── Events ───────────────────────────────────────────────────────────────
  events_total: async () => ({
    key: "events_total", group: "events", label: "Total events",
    value: await prisma.event.count(),
  }),
  events_upcoming: async () => ({
    key: "events_upcoming", group: "events", label: "Upcoming events",
    value: await prisma.event.count({ where: { startDate: { gte: now } } }),
  }),

  // ── Blog ─────────────────────────────────────────────────────────────────
  posts_total: async () => ({
    key: "posts_total", group: "blog", label: "Total posts",
    value: await prisma.blogPost.count({ where: { deletedAt: null } }),
  }),
  posts_published: async () => ({
    key: "posts_published", group: "blog", label: "Published posts",
    value: await prisma.blogPost.count({ where: { status: BlogStatus.PUBLISHED, deletedAt: null } }),
  }),
  posts_featured: async () => ({
    key: "posts_featured", group: "blog", label: "Featured posts",
    value: await prisma.blogPost.count({ where: { isFeatured: true, deletedAt: null } }),
  }),
  comments_total: async () => ({
    key: "comments_total", group: "blog", label: "Total comments",
    value: await prisma.blogComment.count({ where: { deletedAt: null } }),
  }),
  comments_approved: async () => ({
    key: "comments_approved", group: "blog", label: "Approved comments",
    value: await prisma.blogComment.count({ where: { isApproved: true, deletedAt: null } }),
  }),
};

// All valid groups for group-based filtering
export const STAT_GROUPS = [
  "cities", "places", "accommodation", "dining",
  "entertainment", "cultural", "bookings", "payments",
  "users", "reviews", "events", "blog",
] as const;

export type StatGroup = typeof STAT_GROUPS[number];