import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const memberLoginHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'adminName',
    type: 'search',
    label: '관리자명',
    placeholder: '관리자명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'loginId',
    type: 'search',
    label: '아이디',
    placeholder: '아이디를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '로그인 일시',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
