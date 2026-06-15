import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { createHomeAddressRegionFilterField } from '@/shared/config/institution-address-region-filter-field'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  INSTRUCTOR_JA_EVALUATION_GRADE_FILTER_OPTIONS,
  INSTRUCTOR_JA_EXPERIENCE_FILTER_OPTIONS,
} from '@/features/program/general/lib/instructor-application-filter-options'
import { INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS } from '@/shared/constants/instructor-settlement-status'

const COL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

const SELECT_FIELD_STYLE = {
  width: COL_WIDTH,
} as const

/** 참여 강사 목록 필터 */
export const participatingInstructorsFilterFields: FilterFieldConfig[] = [
  {
    key: 'instructorName',
    type: 'search',
    label: '참여 강사명',
    placeholder: '강사명을 입력하세요',
    width: COL_WIDTH,
  },
  createHomeAddressRegionFilterField({ label: '자택 주소지' }),
  {
    key: 'experienceYears',
    type: 'select',
    label: 'JA 강의 경력',
    placeholder: '전체',
    options: [...INSTRUCTOR_JA_EXPERIENCE_FILTER_OPTIONS],
    width: COL_WIDTH,
    style: SELECT_FIELD_STYLE,
  },
  {
    key: 'evaluationGrade',
    type: 'select',
    label: 'JA 평가 등급',
    placeholder: '전체',
    options: [...INSTRUCTOR_JA_EVALUATION_GRADE_FILTER_OPTIONS],
    width: COL_WIDTH,
    style: SELECT_FIELD_STYLE,
  },
  {
    key: 'settlementStatus',
    type: 'select',
    label: '정산 현황',
    placeholder: '전체',
    options: INSTRUCTOR_SETTLEMENT_FILTER_STATUS_OPTIONS.map(option => ({
      label: option.label,
      value: option.value,
    })),
    width: COL_WIDTH,
    style: SELECT_FIELD_STYLE,
  },
]
