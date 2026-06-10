import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import {
  SCHOOL_ATTENDANCE_FILTER_ALL,
  SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS,
  type SchoolSessionAttendanceStatusKey,
} from '../model/school-detail-types'
import {
  STUDENT_GRADE_CLASS_OPTIONS,
  STUDENT_LIST_GENDER_FILTER_OPTIONS,
} from './student-list-filter-fields'

const FILTER_CONTROL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

const attendanceStatusOptions = [
  { label: '전체', value: SCHOOL_ATTENDANCE_FILTER_ALL },
  ...(Object.entries(SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS) as [
    SchoolSessionAttendanceStatusKey,
    string,
  ][]).map(([value, label]) => ({ label, value })),
]

/** 학교 상세 > 출석 관리 탭 필터 (교육 일정·학생명·성별·학급·출결 현황) */
export function buildSchoolDetailAttendanceFilterFields(
  educationScheduleOptions: Array<{ label: string; value: string }>
): FilterFieldConfig[] {
  const scheduleOptions = [
    { label: '전체', value: SCHOOL_ATTENDANCE_FILTER_ALL },
    ...educationScheduleOptions,
  ]

  return [
    {
      key: 'educationSchedule',
      type: 'select',
      label: '교육 일정',
      placeholder: '전체',
      options: scheduleOptions,
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'studentName',
      type: 'search',
      label: '학생명',
      placeholder: '학생명을 입력하세요',
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'studentGender',
      type: 'select',
      label: '성별',
      placeholder: '전체',
      options: [
        { label: '전체', value: SCHOOL_ATTENDANCE_FILTER_ALL },
        ...STUDENT_LIST_GENDER_FILTER_OPTIONS,
      ],
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'studentClass',
      type: 'select',
      label: '학급',
      placeholder: '전체',
      options: [
        { label: '전체', value: SCHOOL_ATTENDANCE_FILTER_ALL },
        ...STUDENT_GRADE_CLASS_OPTIONS,
      ],
      width: FILTER_CONTROL_WIDTH,
    },
    {
      key: 'attendanceStatus',
      type: 'select',
      label: '출결 현황',
      placeholder: '전체',
      options: attendanceStatusOptions,
      width: FILTER_CONTROL_WIDTH,
    },
  ]
}
