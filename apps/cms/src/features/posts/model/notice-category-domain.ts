/**
 * 공지 카테고리 도메인 — React/UI와 무관한 순수 로직 (테스트·재사용 용이)
 */

import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'

export function hasDuplicateCategoryName(
  rows: readonly NoticeCategoryRow[],
  candidate: string,
  excludeId?: string
): boolean {
  const t = candidate.trim()
  if (t === '') return false
  return rows.some(r => r.id !== excludeId && r.name.trim() === t)
}

export function createNoticeCategoryId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `cat-${Date.now()}`
}

/** `category` 필드로 매칭되는 항목 수 (삭제 제한 판단) */
export function countByCategoryLabel<T>(
  items: readonly T[],
  getCategory: (item: T) => string,
  categoryName: string
): number {
  return items.filter(item => getCategory(item) === categoryName).length
}
