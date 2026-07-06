import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const GEMINI_RECRUITMENT_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'title',
    type: 'search',
    label: '공고명',
    placeholder: '공고명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  {
    key: 'status',
    type: 'select',
    label: '상태',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '예정', value: 'SCHEDULED' },
      { label: '진행 중', value: 'IN_PROGRESS' },
      { label: '종료', value: 'ENDED' },
      { label: '임시저장', value: 'DRAFT' },
    ],
  },
  {
    key: 'trainingRequestPeriodRange',
    type: 'dateRange',
    label: '연수 요청 가능기간',
    defaultValue: null,
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  },
]
