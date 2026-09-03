import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { ADMIN_FAQ_CATEGORY_SEED_NAMES } from '@/data/mock/admin-faq-seeds'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'

/** 카테고리 관리 모달 초기 행 — 목록 시드·필터 옵션과 동일 라벨 */
export function createInitialFaqCategoryRows(): FaqCategoryRow[] {
  return ADMIN_FAQ_CATEGORY_SEED_NAMES.map((name, i) => ({
    id: `faq-cat-${i}`,
    name,
  }))
}

/**
 * TableFilterGroup `width` % — 합 100%. 작성일시(기간)는 두 입력·구분자가 들어가므로 비중 확대.
 */
export function buildAdminFaqManagementFilterFields(
  categoryLabels: readonly string[]
): FilterFieldConfig[] {
  const categoryOptions = [
    { label: '전체', value: 'ALL' },
    ...categoryLabels.map(label => ({ label, value: label })),
  ]

  return [
    {
      key: 'visibility',
      type: 'radio',
      label: '공개 여부',
      width: '14%',
      defaultValue: 'public',
      options: [
        { label: '공개', value: 'public' },
        { label: '비공개', value: 'private' },
      ],
    },
    {
      key: 'category',
      type: 'select',
      label: '카테고리',
      placeholder: '전체',
      width: '14%',
      options: categoryOptions,
    },
    {
      key: 'title',
      type: 'search',
      label: '제목',
      placeholder: '제목을 입력하세요',
      width: '22%',
    },
    {
      key: 'author',
      type: 'search',
      label: '작성자명',
      placeholder: '작성자명을 입력하세요',
      width: '18%',
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: '작성일시',
      defaultValue: null,
      width: '32%',
    },
  ]
}
