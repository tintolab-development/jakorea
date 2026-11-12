import type { PostsCategoryRow } from '@/features/posts/model/posts-category-row'

export const CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE =
  '한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 입력할 수 있습니다.'
export const CATEGORY_NAME_REQUIRED_MESSAGE = '카테고리명을 입력해주세요.'

export type CategoryNameValidation = 'valid' | 'empty' | 'invalid_characters'

export type CategoryManagementDraftChanges = {
  creates: Array<{
    clientKey: string
    name: string
    status: 'enabled'
    displayOrder: number | null
  }>
  updates: Array<{
    id: string
    name: string
    status: 'enabled' | 'disabled'
    displayOrder: number | null
    expectedUpdatedAt: string | null
  }>
  deleteItems: Array<{ id: string; expectedUpdatedAt: string | null }>
}

/** 서버 계약이 확정되기 전까지 모달에서만 사용하는 변경 묶음이다. */
export function validateCategoryName(value: string): CategoryNameValidation {
  const name = value.trim()
  if (!name) return 'empty'
  return /^[가-힣A-Za-z0-9_-]+$/u.test(name) ? 'valid' : 'invalid_characters'
}

/** 입력칸 에러 문구 (QA-0272) — 유효하면 null */
export function categoryNameFieldError(value: string): string | null {
  const validation = validateCategoryName(value)
  if (validation === 'empty') return CATEGORY_NAME_REQUIRED_MESSAGE
  if (validation === 'invalid_characters') return CATEGORY_NAME_INVALID_CHARACTERS_MESSAGE
  return null
}

export function buildCategoryManagementDraftChanges(
  baseRows: readonly PostsCategoryRow[],
  draftRows: readonly PostsCategoryRow[]
): CategoryManagementDraftChanges {
  const baseById = new Map(baseRows.map(row => [row.id, row]))
  const draftById = new Map(draftRows.map(row => [row.id, row]))

  return {
    creates: draftRows
      .filter(row => !baseById.has(row.id))
      .map(row => ({
        clientKey: row.id,
        name: row.name.trim(),
        status: 'enabled' as const,
        displayOrder: row.displayOrder ?? null,
      })),
    updates: draftRows
      .filter(row => {
        const base = baseById.get(row.id)
        return base != null && base.name.trim() !== row.name.trim()
      })
      .map(row => {
        const base = baseById.get(row.id)
        return {
          id: row.id,
          name: row.name.trim(),
          status: base?.useYn === false ? ('disabled' as const) : ('enabled' as const),
          displayOrder: base?.displayOrder ?? null,
          expectedUpdatedAt: base?.updatedAt ?? null,
        }
      }),
    deleteItems: baseRows
      .filter(row => !draftById.has(row.id))
      .map(row => ({ id: row.id, expectedUpdatedAt: row.updatedAt ?? null })),
  }
}

export function hasCategoryManagementDraftChanges(
  changes: CategoryManagementDraftChanges
): boolean {
  return (
    changes.creates.length > 0 ||
    changes.updates.length > 0 ||
    changes.deleteItems.length > 0
  )
}
