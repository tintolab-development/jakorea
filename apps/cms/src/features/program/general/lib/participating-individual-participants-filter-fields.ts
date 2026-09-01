import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { createHomeAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'

const GRADE_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '1학년', value: '1학년' },
  { label: '2학년', value: '2학년' },
  { label: '3학년', value: '3학년' },
  { label: '4학년', value: '4학년' },
  { label: '5학년', value: '5학년' },
  { label: '6학년', value: '6학년' },
]

const FILTER_CONTROL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

/** 참여자(개인) 목록 필터 — 스크린샷 라벨 */
export const participatingIndividualParticipantsFilterFields: FilterFieldConfig[] = [
  {
    key: 'participantName',
    type: 'search',
    label: '참여자명',
    placeholder: '참여자명을 입력하세요',
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
  createHomeAddressRegionFilterField({ label: '자택 주소지' }),
]
