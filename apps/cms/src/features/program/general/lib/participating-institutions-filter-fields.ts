import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { createInstitutionAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { TEXTBOOK_STATUS_LABELS, TEXTBOOK_STATUS_OPTION_KEYS } from '@/data/mock/participating-schools'

const GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const TEXTBOOK_OPTIONS = [
  { label: '전체', value: 'all' },
  ...TEXTBOOK_STATUS_OPTION_KEYS.map(key => ({
    label: TEXTBOOK_STATUS_LABELS[key],
    value: key,
  })),
]

const FILTER_CONTROL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

/** 참여 기관 목록 필터 (스크린샷 라벨·한 행·고정 폭) */
export const participatingInstitutionsFilterFields: FilterFieldConfig[] = [
  {
    key: 'schoolName',
    type: 'search',
    label: '참여 기관명',
    placeholder: '참여 기관명을 입력하세요',
    width: FILTER_CONTROL_WIDTH,
  },
  createInstitutionAddressRegionFilterField(),
  {
    key: 'textbookStatus',
    type: 'select',
    label: '교재 배송 현황',
    placeholder: '전체',
    options: TEXTBOOK_OPTIONS,
    width: FILTER_CONTROL_WIDTH,
  },
  {
    key: 'educationGrade',
    type: 'select',
    label: '교육 학년',
    placeholder: '전체',
    options: GRADE_OPTIONS,
    width: FILTER_CONTROL_WIDTH,
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '담당 교사명',
    placeholder: '담당 교사명을 입력하세요',
    width: FILTER_CONTROL_WIDTH,
  },
]
