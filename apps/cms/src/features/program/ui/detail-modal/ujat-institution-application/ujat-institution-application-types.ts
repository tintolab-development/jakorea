import type { UjatInstitutionApplicationRegionKey } from './ujat-institution-application-regions'

/** 임시 배정 평가 상태 */
export type UjatInstitutionTempAssignmentStatus =
  | 'evaluation_pending'
  | 'temp_rejected'
  | 'temp_assigned'
  | 'application_rejected'

export const UJAT_INSTITUTION_TEMP_ASSIGNMENT_STATUS_LABEL: Record<
  UjatInstitutionTempAssignmentStatus,
  string
> = {
  evaluation_pending: '평가 대기',
  temp_rejected: '임시 반려',
  temp_assigned: '임시 배정',
  application_rejected: '신청 반려',
}

export type UjatInstitutionScheduleSlotKey =
  | 'apr03'
  | 'apr17'
  | 'apr24'
  | 'may01'
  | 'may08'
  | 'may15'
  | 'may22'
  | 'may29'
  | 'jun05'
  | 'jun12'
  | 'jun19'

export const UJAT_INSTITUTION_SCHEDULE_COLUMNS: ReadonlyArray<{
  key: UjatInstitutionScheduleSlotKey
  title: string
}> = [
  { key: 'apr03', title: '4월 3일' },
  { key: 'apr17', title: '4월 17일' },
  { key: 'apr24', title: '4월 24일' },
  { key: 'may01', title: '5월 1일' },
  { key: 'may08', title: '5월 8일' },
  { key: 'may15', title: '5월 15일' },
  { key: 'may22', title: '5월 22일' },
  { key: 'may29', title: '5월 29일' },
  { key: 'jun05', title: '6월 5일' },
  { key: 'jun12', title: '6월 12일' },
  { key: 'jun19', title: '6월 19일' },
]

export type UjatInstitutionGradeClassCount = {
  gradeLabel: string
  classCount: number
}

export type UjatInstitutionApplicationRow = {
  id: string
  regionKey: UjatInstitutionApplicationRegionKey
  no: number
  institutionName: string
  tempAssignmentStatus: UjatInstitutionTempAssignmentStatus
  gradeClassCounts: UjatInstitutionGradeClassCount[]
  totalClassCount: number
  scheduleSlots: Record<UjatInstitutionScheduleSlotKey, 'O' | '-'>
  teacherName: string
}

export type UjatInstitutionApplicationFilters = {
  institutionName: string
  tempAssignmentStatus: string
  totalClassCount: string
  teacherName: string
}

export const EMPTY_UJAT_INSTITUTION_APPLICATION_FILTERS: UjatInstitutionApplicationFilters = {
  institutionName: '',
  tempAssignmentStatus: '',
  totalClassCount: '',
  teacherName: '',
}
