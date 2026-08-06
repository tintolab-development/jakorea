/**
 * 임팩트 스토리 카테고리 도메인 순수 로직
 */

export function hasDuplicateCategoryName(
  rows: readonly { id: string; name: string }[],
  candidate: string,
  excludeId?: string
): boolean {
  const t = candidate.trim()
  if (t === '') return false
  return rows.some(r => r.id !== excludeId && r.name.trim() === t)
}

export function createCategoryId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `is-cat-${Date.now()}`
}

export function countByCategoryId<T>(
  items: readonly T[],
  getCategoryId: (item: T) => string,
  categoryId: string
): number {
  return items.filter(item => getCategoryId(item) === categoryId).length
}
