import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const personalInfoAccessHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'accessPurpose',
    type: 'search',
    label: '조회 목적',
    placeholder: '조회 목적을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'accessorName',
    type: 'search',
    // 시안: 조회자명 / 노션: 조회자 — 시안 우선
    label: '조회자명',
    placeholder: '조회자명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '조회 일시',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
