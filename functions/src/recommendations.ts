import { CatalogItem, RecommendationResult, CostEstimate, DesignStyle } from "./types";
import { CATALOG_SEED } from "./catalog";

// ── Budget range parsing ───────────────────────────────────────────────────────
// budgetRange strings from the frontend: "under-50k" | "50k-150k" |
// "150k-300k" | "300k-500k" | "above-500k"  (all PKR)

interface BudgetBounds {
  minPKR: number;
  maxPKR: number;
}

const BUDGET_MAP: Record<string, BudgetBounds> = {
  "under-50k":    { minPKR: 0,       maxPKR: 50_000   },
  "50k-150k":     { minPKR: 50_000,  maxPKR: 150_000  },
  "150k-300k":    { minPKR: 150_000, maxPKR: 300_000  },
  "300k-500k":    { minPKR: 300_000, maxPKR: 500_000  },
  "above-500k":   { minPKR: 500_000, maxPKR: Infinity  },
};

export function parseBudget(budgetRange: string): BudgetBounds {
  return BUDGET_MAP[budgetRange] ?? { minPKR: 0, maxPKR: Infinity };
}

// ── Recommendation scoring ────────────────────────────────────────────────────
// Score each active catalog item against the requested style and room type.
// Returns items sorted by score descending, capped at maxResults.

const ROOM_CATEGORY_WEIGHTS: Record<string, Record<string, number>> = {
  "living-room":  { seating: 1.0, tables: 0.9, lighting: 0.8, decor: 0.7, storage: 0.5 },
  "bedroom":      { storage: 1.0, lighting: 0.8, decor: 0.7, seating: 0.5, tables: 0.4 },
  "dining-room":  { tables: 1.0, seating: 0.9, lighting: 0.8, decor: 0.6, storage: 0.4 },
  "home-office":  { tables: 1.0, seating: 0.9, storage: 0.8, lighting: 0.7, decor: 0.4 },
  "kitchen":      { storage: 1.0, lighting: 0.7, tables: 0.6, decor: 0.4, seating: 0.3 },
};

const DEFAULT_CATEGORY_WEIGHT = 0.5;

function categoryWeight(roomType: string, category: string): number {
  return ROOM_CATEGORY_WEIGHTS[roomType]?.[category] ?? DEFAULT_CATEGORY_WEIGHT;
}

function styleScore(item: CatalogItem, style: string): number {
  return item.styles.includes(style as DesignStyle) ? 1.0 : 0.0;
}

function buildReason(item: CatalogItem, style: string, roomType: string): string {
  const styleMatch = item.styles.includes(style as DesignStyle);
  const catW = categoryWeight(roomType, item.category);

  if (styleMatch && catW >= 0.8) {
    return `Strong match — suits ${style} style and is ideal for a ${roomType.replace("-", " ")}.`;
  }
  if (styleMatch) {
    return `Style match — suits ${style} interiors.`;
  }
  if (catW >= 0.8) {
    return `Category match — commonly used in a ${roomType.replace("-", " ")}.`;
  }
  return `General recommendation for ${roomType.replace("-", " ")} spaces.`;
}

export function rankRecommendations(
  style: string,
  roomType: string,
  budgetRange: string,
  maxResults = 6
): RecommendationResult[] {
  const { maxPKR } = parseBudget(budgetRange);

  return CATALOG_SEED
    .filter((item) => item.isActive && item.price <= maxPKR)
    .map((item) => {
      const sScore = styleScore(item, style);
      const cScore = categoryWeight(roomType, item.category);
      // Weighted blend: style fit matters more than category fit
      const score = Math.round((sScore * 0.6 + cScore * 0.4) * 100) / 100;
      return {
        item,
        score,
        reason: buildReason(item, style, roomType),
      } satisfies RecommendationResult;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ── Cost estimation ───────────────────────────────────────────────────────────
// Given a list of selected catalog item IDs and a budget range, return a
// cost breakdown in PKR and a within-budget flag.

export function estimateCost(
  selectedItemIds: string[],
  budgetRange: string
): CostEstimate {
  const { maxPKR } = parseBudget(budgetRange);

  const items = selectedItemIds.flatMap((id) => {
    const found = CATALOG_SEED.find((c) => c.id === id && c.isActive);
    return found
      ? [{ itemId: found.id, name: found.name, price: found.price, currency: "PKR" as const }]
      : [];
  });

  const subtotalPKR = items.reduce((sum, i) => sum + i.price, 0);
  const withinBudget = subtotalPKR <= maxPKR;

  const overBy = subtotalPKR - maxPKR;
  const note = withinBudget
    ? `Total is within your ${budgetRange} budget. Remaining: PKR ${(maxPKR - subtotalPKR).toLocaleString()}.`
    : `Total exceeds your ${budgetRange} budget by PKR ${overBy.toLocaleString()}. Consider removing lower-priority items.`;

  return { items, subtotalPKR, budgetRange, withinBudget, note };
}
