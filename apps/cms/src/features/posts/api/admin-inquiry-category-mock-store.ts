/**
 * CMS 관리자 문의 카테고리 mock 저장소 — 필터·카테고리 관리 모달이 동일 목록 참조
 */

import type { InquiryCategoryRow } from '@/features/posts/model/admin-inquiry-management.types'
import { createInitialInquiryCategoryRows } from '@/features/posts/model/admin-inquiry-management-filter-fields'

let categoryRows: InquiryCategoryRow[] | null = null

function seed(): InquiryCategoryRow[] {
  if (!categoryRows) {
    categoryRows = createInitialInquiryCategoryRows()
  }
  return categoryRows
}

export function listInquiryCategoryRows(): InquiryCategoryRow[] {
  return seed().map(r => ({ ...r }))
}

export function replaceInquiryCategoryRows(next: InquiryCategoryRow[]): void {
  categoryRows = next.map(r => ({ ...r }))
}
