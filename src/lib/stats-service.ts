import { STATS_REGISTRY, STAT_GROUPS, StatItem, StatGroup } from "./stats-registry";

export interface StatsFilter {
  keys?: string[];           // ["cities_total", "places_total"]
  groups?: StatGroup[];      // ["cities", "bookings"]
}

export interface StatsResult {
  stats: StatItem[];
  requested: number;
  resolved: number;
  unknown: string[];         // keys that didn't exist in the registry
}

/**
 * Run only the stats the caller actually needs.
 * All resolved queries fire in parallel via Promise.all.
 *
 * @example
 * // Just two stats
 * getStats({ keys: ["cities_total", "places_total"] })
 *
 * // All booking stats
 * getStats({ groups: ["bookings"] })
 *
 * // Mix: explicit keys + a whole group
 * getStats({ keys: ["revenue_total"], groups: ["cities", "places"] })
 *
 * // Everything (no filter = all 50+)
 * getStats()
 */
export async function getStats(filter?: StatsFilter): Promise<StatsResult> {
  const allKeys = Object.keys(STATS_REGISTRY);

  let requestedKeys: string[];

  if (!filter || (!filter.keys?.length && !filter.groups?.length)) {
    // No filter → run everything
    requestedKeys = allKeys;
  } else {
    const keySet = new Set<string>();

    // Explicit keys
    if (filter.keys?.length) {
      for (const k of filter.keys) keySet.add(k);
    }

    // Group expansion
    if (filter.groups?.length) {
      // We need group metadata, so peek into the registry per-group
      // Each stat resolver is async - we can't call it just to get group,
      // so we maintain a lightweight group index here.
      const groupIndex = buildGroupIndex();
      for (const g of filter.groups) {
        for (const k of (groupIndex[g] ?? [])) keySet.add(k);
      }
    }

    requestedKeys = [...keySet];
  }

  // Split into known and unknown
  const known = requestedKeys.filter((k) => k in STATS_REGISTRY);
  const unknown = requestedKeys.filter((k) => !(k in STATS_REGISTRY));

  // Fire all known resolvers in parallel
  const stats = await Promise.all(known.map((k) => STATS_REGISTRY[k]()));

  return {
    stats,
    requested: requestedKeys.length,
    resolved: stats.length,
    unknown,
  };
}

// Static group → keys mapping (derived once from registry key naming convention).
// Each key is prefixed with its group name, e.g. "bookings_total" → group "bookings".
// For keys that don't follow this pattern, they're in STATS_REGISTRY with explicit group fields,
// so we resolve group by running a dry lookup against STAT_GROUPS prefixes.
function buildGroupIndex(): Record<string, string[]> {
  const index: Record<string, string[]> = {};
  for (const group of STAT_GROUPS) index[group] = [];

  for (const key of Object.keys(STATS_REGISTRY)) {
    const matchedGroup = STAT_GROUPS.find((g) => key.startsWith(g + "_") || key === g);
    if (matchedGroup) {
      index[matchedGroup].push(key);
    } else {
      // Fallback: handle aliases like "revenue_*" → payments, "menu_*" → dining, etc.
      const aliases: Record<string, StatGroup> = {
        revenue: "payments",
        payments: "payments",
        menu: "dining",
        rooms: "accommodation",
        shows: "entertainment",
        performances: "entertainment",
        exhibitions: "cultural",
        artifacts: "cultural",
        posts: "blog",
        comments: "blog",
      };
      const prefix = key.split("_")[0];
      const group = aliases[prefix];
      if (group) index[group].push(key);
    }
  }

  return index;
}

// Convenience: list all registered stat keys (useful for the frontend to discover what's available)
export function getStatKeys(): string[] {
  return Object.keys(STATS_REGISTRY);
}

// Convenience: list all groups
export function getStatGroups(): typeof STAT_GROUPS {
  return STAT_GROUPS;
}