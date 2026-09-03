import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const bugIssueHistoryFilterFields: FilterFieldConfig[] = [
  {
    key: 'userName',
    type: 'search',
    // 시안: 사용자명 / 노션 솔팅: 사용자 — 시안 우선 (테이블 컬럼은 시안·노션 모두 사용자명)
    label: '사용자명',
    placeholder: '사용자명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'dateRange',
    type: 'dateRange',
    label: '발생일시',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
