/**
 * CMS 관리자 FAQ 카테고리 mock 저장소 — 필터·카테고리 관리 모달이 동일 목록 참조
 */

import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'
import { createInitialFaqCategoryRows } from '@/features/posts/model/admin-faq-management-filter-fields'

let categoryRows: FaqCategoryRow[] | null = null

function seed(): FaqCategoryRow[] {
  if (!categoryRows) {
    categoryRows = createInitialFaqCategoryRows()
  }
  return categoryRows
}

export function listFaqCategoryRows(): FaqCategoryRow[] {
  return seed().map(r => ({ ...r }))
}

/** 전체 교체(모달에서 추가·수정·삭제 후 호출) */
export function replaceFaqCategoryRows(next: FaqCategoryRow[]): void {
  categoryRows = next.map(r => ({ ...r }))
}

/** CmsSelect / 필터용 — 현재 저장된 카테고리 라벨 */
export function getFaqCategorySelectOptions(): { label: string; value: string }[] {
  return listFaqCategoryRows().map(r => ({ label: r.name, value: r.name }))
}
