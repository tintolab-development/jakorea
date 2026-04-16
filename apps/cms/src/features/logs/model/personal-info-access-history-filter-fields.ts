import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

/**
 * 필터 행 너비 합 100%
 */
export const personalInfoAccessHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'accessPurpose',
    type: 'search',
    label: '조회 목적',
    placeholder: '조회 목적을 입력하세요',
    width: '34%',
  },
  {
    key: 'accessorName',
    type: 'search',
    label: '조회자',
    placeholder: '조회자를 입력하세요',
    width: '26%',
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '기간',
    defaultValue: null,
    width: '40%',
  },
]
