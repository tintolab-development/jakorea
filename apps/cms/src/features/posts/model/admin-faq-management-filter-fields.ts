import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'
import { ADMIN_FAQ_CATEGORY_SEED_NAMES } from '@/features/posts/model/admin-faq-category-seeds'
import type { FaqCategoryRow } from '@/features/posts/model/admin-faq-management.types'

/** 카테고리 관리 모달 초기 행 — 목록 시드·필터 옵션과 동일 라벨 */
export function createInitialFaqCategoryRows(): FaqCategoryRow[] {
  return ADMIN_FAQ_CATEGORY_SEED_NAMES.map((name, i) => ({
    id: `faq-cat-${i}`,
    name,
  }))
}

/**
 * 시안: 공개 여부·카테고리·제목·작성자·작성일 + 조회를 한 줄 — 공통 픽셀 폭(단일 칸 `FILTER_CONTROL_MAX_WIDTH_PX`,
 * 기간 `FILTER_CONTROL_WIDE_FIELD_WIDTH_PX`). `%` 폭은 행 전체 stretch라 쓰지 않는다(filter-area-layout).
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
      type: 'select',
      label: '공개 여부',
      placeholder: '전체',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      defaultValue: 'ALL',
      options: [
        { label: '전체', value: 'ALL' },
        { label: '공개', value: 'public' },
        { label: '비공개', value: 'private' },
      ],
    },
    {
      key: 'category',
      type: 'select',
      label: '카테고리',
      placeholder: '전체',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
      options: categoryOptions,
    },
    {
      key: 'title',
      type: 'search',
      label: '제목',
      placeholder: '제목을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'author',
      type: 'search',
      label: '작성자',
      placeholder: '작성자명을 입력해 주세요',
      width: FILTER_CONTROL_MAX_WIDTH_PX,
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: '작성일',
      defaultValue: null,
      width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    },
  ]
}
