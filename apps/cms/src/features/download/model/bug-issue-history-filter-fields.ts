import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const bugIssueHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'userName',
    type: 'search',
    label: '사용자',
    placeholder: '사용자를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '기간',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
