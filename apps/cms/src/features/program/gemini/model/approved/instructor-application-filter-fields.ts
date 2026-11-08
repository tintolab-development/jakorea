import { GEMINI_INSTRUCTOR_APPROVAL_STATUS_LABEL } from '../../lib/application-status-presentation'
import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import { createHomeAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'

export const GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'instructorName',
    type: 'search',
    label: '신청 강사명',
    placeholder: '강사명을 입력해 주세요',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  },
  createHomeAddressRegionFilterField({
    label: '자택 주소지',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
  }),
  {
    key: 'experienceYears',
    type: 'select',
    label: 'JA 강의 경력',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: '1년', value: '1' },
      { label: '2년', value: '2' },
      { label: '3년', value: '3' },
      { label: '4년', value: '4' },
      { label: '5년', value: '5' },
      { label: '6년 이상', value: '6+' },
    ],
  },
  {
    key: 'grade',
    type: 'select',
    label: 'JA 평가 등급',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: 'A등급', value: 'A등급' },
      { label: 'B등급', value: 'B등급' },
      { label: 'C등급', value: 'C등급' },
    ],
  },
  {
    key: 'approvalStatus',
    type: 'select',
    label: '프로그램 승인 현황',
    placeholder: '전체',
    width: FILTER_CONTROL_MAX_WIDTH_PX,
    options: [
      { label: '전체', value: 'ALL' },
      { label: GEMINI_INSTRUCTOR_APPROVAL_STATUS_LABEL.PENDING, value: 'PENDING' },
      { label: GEMINI_INSTRUCTOR_APPROVAL_STATUS_LABEL.APPROVED, value: 'APPROVED' },
      { label: GEMINI_INSTRUCTOR_APPROVAL_STATUS_LABEL.REJECTED, value: 'REJECTED' },
    ],
  },
]
