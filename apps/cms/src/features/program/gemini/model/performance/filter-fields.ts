import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

/** Gemini 프로그램 > 실적 관리 — 스크린샷 기준 4필드 (강사·연수방식·연수장소·연수일) */
export const GEMINI_PERFORMANCE_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'instructorName',
    type: 'search',
    label: '강사',
    placeholder: '강사명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'trainingMethod',
    type: 'select',
    label: '연수방식',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '대면', value: 'OFFLINE' },
      { label: '비대면', value: 'ONLINE' },
      { label: '혼합', value: 'HYBRID' },
    ],
  },
  {
    key: 'trainingLocation',
    type: 'search',
    label: '연수장소',
    placeholder: '연수장소를 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'trainingDateRange',
    type: 'dateRange',
    label: '연수일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  },
]
