export type ResourceType =
  | 'gold'
  | 'wood'
  | 'ore'
  | 'mercury'
  | 'sulfur'
  | 'crystal'
  | 'gems';

export type Cost = Record<ResourceType, number | undefined>;

export function isSameCost(expectedCost: Cost, actualCost: Cost): boolean {
  const allKeys = new Set([
    ...Object.keys(expectedCost),
    ...Object.keys(actualCost),
  ]);

  return Array.from(allKeys).every(
    (key) =>
      (expectedCost[key as ResourceType] ?? 0) ===
      (actualCost[key as ResourceType] ?? 0),
  );
}

export function multiplyCost(cost: Cost, multiplier: number) {
  return Object.fromEntries(
    Object.entries(cost).map(([resource, value]) => [
      resource,
      (value ?? 0) * multiplier,
    ]),
  ) as Cost;
}
