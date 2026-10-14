/**
 * CMS 공지사항 카테고리 — portal 결과 필터용 상수.
 * SSOT: apps/cms/src/features/posts/model/admin-notice-management-filter-fields.ts
 */

import type { NoticeCategory } from '../model/types'
import type { PFTabItem } from '@/shared/ui'

export const RESULT_ANNOUNCEMENT_CATEGORY_NAMES = [
  '최종 합격 발표',
  '서류 심사 결과',
] as const

const RESULT_FINAL_CATEGORY_ID = 'notice-cat-6'
const RESULT_DOCS_CATEGORY_ID = 'notice-cat-7'

const CMS_NOTICE_CATEGORY_SEED: readonly NoticeCategory[] = [
  { id: 'notice-cat-0', name: '필독' },
  { id: 'notice-cat-1', name: '안내' },
  { id: 'notice-cat-2', name: '정산' },
  { id: 'notice-cat-3', name: '시스템' },
  { id: 'notice-cat-4', name: '봉사단' },
  { id: 'notice-cat-5', name: '강사단' },
  { id: RESULT_FINAL_CATEGORY_ID, name: '최종 합격 발표' },
  { id: RESULT_DOCS_CATEGORY_ID, name: '서류 심사 결과' },
]

export const RESULT_CATEGORY_TAB_ITEMS: readonly PFTabItem[] = [
  { key: 'all', label: '전체' },
  { key: 'result', label: '결과발표' },
  { key: 'docs', label: '서류 심사' },
  { key: 'screening', label: '심사결과' },
]

export function resolveResultCategoryFilterId(tabKey: string): string {
  switch (tabKey) {
    case 'all':
      return 'all'
    case 'result':
    case RESULT_FINAL_CATEGORY_ID:
      return RESULT_FINAL_CATEGORY_ID
    case 'docs':
    case 'screening':
    case RESULT_DOCS_CATEGORY_ID:
      return RESULT_DOCS_CATEGORY_ID
    default:
      return 'all'
  }
}

export function getNoticeCategoryFilterOptions(): { value: string; label: string }[] {
  const resultCategories = CMS_NOTICE_CATEGORY_SEED.filter(row =>
    (RESULT_ANNOUNCEMENT_CATEGORY_NAMES as readonly string[]).includes(row.name),
  )

  return [
    { value: 'all', label: '전체' },
    ...resultCategories.map(row => ({ value: row.id, label: row.name })),
  ]
}

export function getResultCategoryTabItems(): PFTabItem[] {
  return RESULT_CATEGORY_TAB_ITEMS.map(item => ({ ...item }))
}

export function findNoticeCategoryByName(name: string): NoticeCategory | undefined {
  return CMS_NOTICE_CATEGORY_SEED.find(row => row.name === name)
}
