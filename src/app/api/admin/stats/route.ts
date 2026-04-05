import { NextRequest, NextResponse } from "next/server";
import { getStats, getStatKeys, getStatGroups } from "@/lib/stats-service";
import { STAT_GROUPS, StatGroup } from "@/lib/stats-registry";

/**
 * GET /api/stats
 *
 * Query params:
 *   keys   - comma-separated stat keys   ?keys=cities_total,places_total
 *   groups - comma-separated group names ?groups=bookings,payments
 *   list   - ?list=keys | ?list=groups   (discovery endpoint)
 *
 * Examples:
 *   /api/stats                                  → all stats
 *   /api/stats?keys=cities_total,places_total   → just those two
 *   /api/stats?groups=bookings                  → all booking stats
 *   /api/stats?groups=cities,places&keys=revenue_total  → mixed
 *   /api/stats?list=keys                        → list all available keys
 *   /api/stats?list=groups                      → list all groups
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Discovery mode: let the frontend know what's available
    const list = searchParams.get("list");
    if (list === "keys") {
      return NextResponse.json({ keys: getStatKeys() });
    }
    if (list === "groups") {
      return NextResponse.json({ groups: getStatGroups() });
    }

    // Parse filter
    const rawKeys = searchParams.get("keys");
    const rawGroups = searchParams.get("groups");

    const keys = rawKeys ? rawKeys.split(",").map((k) => k.trim()).filter(Boolean) : undefined;

    const groups = rawGroups
      ? (rawGroups
          .split(",")
          .map((g) => g.trim())
          .filter((g) => (STAT_GROUPS as readonly string[]).includes(g)) as StatGroup[])
      : undefined;

    const result = await getStats(
      keys || groups ? { keys, groups } : undefined
    );

    return NextResponse.json({
      stats: result.stats,
      meta: {
        requested: result.requested,
        resolved: result.resolved,
        ...(result.unknown.length && { unknown: result.unknown }),
      },
    });
  } catch (err) {
    console.error("[stats] error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}