import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import {
  UJAT_ATTENDANCE_FILTER_ALL,
  UJAT_ATTENDANCE_STATUS_LABEL,
  type UjatAttendanceStatus,
} from './types'

const attendanceStatusOptions = [
  { label: '전체', value: UJAT_ATTENDANCE_FILTER_ALL },
  ...(Object.entries(UJAT_ATTENDANCE_STATUS_LABEL) as [UjatAttendanceStatus, string][]).map(
    ([value, label]) => ({ label, value })
  ),
]

export function buildUjatAttendanceFilterFields(
  educationDateOptions: Array<{ label: string; value: string }>
): FilterFieldConfig[] {
  const dateOptions = [
    { label: '전체', value: UJAT_ATTENDANCE_FILTER_ALL },
    ...educationDateOptions,
  ]

  return [
    {
      key: 'educationDate',
      type: 'select',
      label: '교육 진행일',
      placeholder: '전체',
      options: dateOptions,
      width: '33.33%',
    },
    {
      key: 'volunteerName',
      type: 'search',
      label: '봉사자명',
      placeholder: '봉사자명을 입력하세요',
      width: '33.33%',
    },
    {
      key: 'attendanceStatus',
      type: 'select',
      label: '강의 출석 현황',
      placeholder: '전체',
      options: attendanceStatusOptions,
      width: '33.33%',
    },
  ]
}
