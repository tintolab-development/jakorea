/** JABACK v2 catalog — GET current 활성 13건 enum 순서 SSOT */
export const WAGE_ITEM_TYPE_ORDER = [
  'TIER1',
  'TIER2',
  'TIER3',
  'SPECIAL_LECTURE',
  'OTHER_LABOR',
  'GEMINI',
] as const

export const PAYMENT_ITEM_TYPE_ORDER = [
  'TRANSPORT_INSTRUCTOR',
  'TRANSPORT_STUDENT',
  'MEAL',
  'LODGING_GENERAL',
  'LODGING_1C1S',
  'ACTIVITY',
] as const

export type CatalogWageItemType = (typeof WAGE_ITEM_TYPE_ORDER)[number]
export type CatalogPaymentItemType = (typeof PAYMENT_ITEM_TYPE_ORDER)[number]

export function sortByCatalogOrder<T>(
  items: T[],
  resolveType: (item: T) => string | undefined,
  order: readonly string[]
): T[] {
  const rank = new Map(order.map((value, index) => [value, index]))
  return [...items].sort((a, b) => {
    const aRank = rank.get(resolveType(a) ?? '') ?? Number.MAX_SAFE_INTEGER
    const bRank = rank.get(resolveType(b) ?? '') ?? Number.MAX_SAFE_INTEGER
    return aRank - bRank
  })
}
