import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

export const bugIssueHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'userName',
    type: 'search',
    label: '사용자',
    placeholder: '',
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
