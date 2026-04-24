import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

export const bugIssueHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'userName',
    type: 'search',
    label: '사용자',
    placeholder: '사용자를 입력하세요',
    width: '46%',
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '기간',
    defaultValue: null,
    width: '54%',
  },
]
