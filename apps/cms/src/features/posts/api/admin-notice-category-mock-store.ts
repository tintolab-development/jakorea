/**
 * CMS 관리자 공지 카테고리 mock 저장소 — 필터·카테고리 관리 모달·공지 등록 폼이 동일 목록 참조
 * 실 API 연동 시 동일 시그니처 서비스로 교체 가능
 */

import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'
import { createInitialNoticeCategoryRows } from '@/features/posts/model/admin-notice-management-filter-fields'

let categoryRows: NoticeCategoryRow[] | null = null

function seed(): NoticeCategoryRow[] {
  if (!categoryRows) {
    categoryRows = createInitialNoticeCategoryRows()
  }
  return categoryRows
}

export function listNoticeCategoryRows(): NoticeCategoryRow[] {
  return seed().map(r => ({ ...r }))
}

/** 전체 교체(모달에서 추가·수정·삭제 후 호출) */
export function replaceNoticeCategoryRows(next: NoticeCategoryRow[]): void {
  categoryRows = next.map(r => ({ ...r }))
}

/** CmsSelect / 필터용 — 현재 저장된 카테고리 라벨 */
export function getNoticeCategorySelectOptions(): { label: string; value: string }[] {
  return listNoticeCategoryRows().map(r => ({ label: r.name, value: r.name }))
}
