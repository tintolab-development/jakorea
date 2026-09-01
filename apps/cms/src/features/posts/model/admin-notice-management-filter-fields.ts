import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import type { Notice } from '@/data/mock/notices'
import type { NoticeCategoryRow } from '@/features/posts/model/admin-notice-management.types'

/** 목록 필터용: 전체 + 카테고리 (정적 기본값) */
export const ADMIN_NOTICE_CATEGORY_FILTER_OPTIONS: {
  label: string
  value: 'ALL' | Notice['category']
}[] = [
  { label: '전체', value: 'ALL' },
  { label: '필독', value: '필독' },
  { label: '안내', value: '안내' },
  { label: '정산', value: '정산' },
  { label: '시스템', value: '시스템' },
  { label: '봉사단', value: '봉사단' },
  { label: '강사단', value: '강사단' },
  { label: '최종 합격 발표', value: '최종 합격 발표' },
  { label: '서류 심사 결과', value: '서류 심사 결과' },
]

/** 등록/편집 폼용: 실제 카테고리만 */
export const ADMIN_NOTICE_CATEGORY_OPTIONS: { label: string; value: Notice['category'] }[] =
  ADMIN_NOTICE_CATEGORY_FILTER_OPTIONS.filter((o): o is { label: string; value: Notice['category'] } => o.value !== 'ALL')

/** 카테고리 관리 모달 초기 행 — mock 필터 옵션과 동일 라벨 */
export function createInitialNoticeCategoryRows(): NoticeCategoryRow[] {
  return ADMIN_NOTICE_CATEGORY_OPTIONS.map((o, i) => ({
    id: `notice-cat-${i}`,
    name: o.value,
  }))
}

/**
 * TableFilterGroup `width` % — 합 100%. 작성일(기간)은 두 입력·구분자가 들어가므로 비중 확대.
 * `categoryLabels`: 카테고리 관리 모달과 동기화된 라벨 목록
 */
export function buildAdminNoticeManagementFilterFields(
  categoryLabels: readonly string[]
): FilterFieldConfig[] {
  const categoryOptions = [
    { label: '전체', value: 'ALL' },
    ...categoryLabels.map(label => ({ label, value: label })),
  ]

  return [
    {
      key: 'title',
      type: 'search',
      label: '제목',
      placeholder: '제목을 입력하세요',
      width: '20%',
    },
    {
      key: 'visibility',
      type: 'select',
      label: '공개 여부',
      placeholder: '전체',
      width: '12%',
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
      width: '12%',
      options: categoryOptions,
    },
    {
      key: 'author',
      type: 'search',
      label: '작성자',
      placeholder: '작성자를 입력하세요',
      width: '20%',
    },
    {
      key: 'dateRange',
      type: 'dateRange',
      label: '작성일',
      defaultValue: null,
      width: '36%',
    },
  ]
}

/** 기본 카테고리 목록으로 구성한 필터 필드(테스트·레거시 호환) */
export const adminNoticeManagementFilterFields: FilterFieldConfig[] =
  buildAdminNoticeManagementFilterFields(ADMIN_NOTICE_CATEGORY_OPTIONS.map(o => o.value))
