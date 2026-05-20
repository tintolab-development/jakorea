import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL } from './types'
import type { UjatInstitutionTempAssignmentStatus } from './types'

export const UJAT_INSTITUTION_APPLICATION_FILTER_ALL = ''

const tempAssignmentOptions = [
  { label: '전체', value: UJAT_INSTITUTION_APPLICATION_FILTER_ALL },
  ...(
    Object.entries(UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL) as [
      UjatInstitutionTempAssignmentStatus,
      string,
    ][]
  ).map(([value, label]) => ({ label, value })),
]

export const UJAT_INSTITUTION_APPLICATION_FILTER_FIELDS: FilterFieldConfig[] = [
  {
    key: 'institutionName',
    type: 'search',
    label: '신청 기관명',
    placeholder: '기관명을 입력하세요',
    width: '25%',
  },
  {
    key: 'tempAssignmentStatus',
    type: 'select',
    label: '임시 배정 현황',
    placeholder: '전체',
    options: tempAssignmentOptions,
    width: '25%',
  },
  {
    key: 'totalClassCount',
    type: 'search',
    label: '총 신청 학급 수',
    placeholder: '총 신청 학급 수를 입력하세요',
    searchNumericOnly: true,
    width: '25%',
  },
  {
    key: 'teacherName',
    type: 'search',
    label: '신청 교사명',
    placeholder: '교사명을 입력하세요',
    width: '25%',
  },
]
