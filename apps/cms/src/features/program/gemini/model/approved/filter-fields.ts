import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { createInstitutionAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/components/table-filter-group-field-width'

export const GEMINI_APPROVED_TRAINING_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'institutionName',
    type: 'search',
    label: '기관명',
    placeholder: '기관명을 입력하세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  createInstitutionAddressRegionFilterField(),
  {
    key: 'status',
    type: 'select',
    label: '프로그램 진행 현황',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '프로그램 진행 예정', value: 'SCHEDULED' },
      { label: '프로그램 진행 중', value: 'IN_PROGRESS' },
      { label: '프로그램 미진행', value: 'NOT_CONDUCTED' },
      { label: '프로그램 진행 완료', value: 'COMPLETED' },
    ],
  },
  {
    key: 'officialDocumentRequired',
    type: 'select',
    label: '공문 필요 여부',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '필요', value: 'Y' },
      { label: '필요 없음', value: 'N' },
    ],
  },
  {
    key: 'trainingDateRange',
    type: 'dateRange',
    label: '연수일',
    width: FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
    defaultValue: null,
  },
]
