/**
 * 임팩트 스토리 카테고리 도메인 순수 로직
 */

import type { ImpactStoryCategory } from '@/entities/impact-stories/model/types'

export const IMPACT_CATEGORY_NAME_REQUIRED_MESSAGE = '카테고리명을 입력해 주세요.'
export const IMPACT_CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE =
  '한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 입력할 수 있습니다.'

export type ImpactCategoryNameValidation = 'valid' | 'empty' | 'invalid_characters'

export function validateImpactCategoryName(value: string): ImpactCategoryNameValidation {
  const name = value.trim()
  if (!name) return 'empty'
  return /^[가-힣A-Za-z0-9_-]+$/u.test(name) ? 'valid' : 'invalid_characters'
}

export function hasDuplicateCategoryName(
  rows: readonly { id: string; name: string }[],
  candidate: string,
  excludeId?: string
): boolean {
  const t = candidate.trim()
  if (t === '') return false
  return rows.some(r => r.id !== excludeId && r.name.trim() === t)
}

export function hasImpactCategoryDraftChanges(
  baseline: readonly ImpactStoryCategory[],
  draft: readonly ImpactStoryCategory[]
): boolean {
  const baseById = new Map(baseline.map(row => [row.id, row.name.trim()]))
  const draftIds = new Set(draft.map(row => row.id))
  if (draft.length !== baseline.length) return true
  for (const row of baseline) {
    if (!draftIds.has(row.id)) return true
  }
  for (const row of draft) {
    const baseName = baseById.get(row.id)
    if (baseName === undefined) return true
    if (baseName !== row.name.trim()) return true
  }
  return false
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
