import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import type { Notice } from '@/data/mock/notices'

const CATEGORY_OPTIONS: { label: string; value: 'ALL' | Notice['category'] }[] = [
  { label: '전체', value: 'ALL' },
  { label: '필독', value: '필독' },
  { label: '안내', value: '안내' },
  { label: '정산', value: '정산' },
  { label: '시스템', value: '시스템' },
  { label: '봉사단', value: '봉사단' },
  { label: '강사단', value: '강사단' },
]

/**
 * TableFilterGroup `width` % — 합 100%. 작성일(기간)은 두 입력·구분자가 들어가므로 비중 확대.
 */
export const adminNoticeManagementFilterFields: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '제목',
    placeholder: '제목을 입력하세요',
    width: '18%',
  },
  {
    key: 'visibility',
    type: 'select',
    label: '공개 여부',
    placeholder: '전체',
    width: '13%',
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
    width: '13%',
    options: CATEGORY_OPTIONS,
  },
  {
    key: 'author',
    type: 'search',
    label: '작성자',
    placeholder: '작성자를 입력하세요',
    width: '18%',
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '작성일',
    defaultValue: null,
    width: '38%',
  },
]
