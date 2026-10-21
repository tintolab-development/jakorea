import type { UjatInstitutionApplicationRegionKey } from './regions'
import type { UjatInstitutionScheduleSlotKey } from '../education-schedule'
import type { UjatInstitutionScheduleConfirmStatus } from '../schedule-confirm/types'

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

export type { UjatInstitutionScheduleSlotKey } from '../education-schedule'
export {
  buildEmptyScheduleSlots,
  formatUjatInstitutionFridayDisplay,
  sumGradeClassCounts,
} from '../education-schedule'

export type UjatInstitutionGradeClassCount = {
  gradeLabel: string
  classCount: number | null
}

export type UjatInstitutionApplicationRow = {
  id: string
  /** `educationRegionCode`로만 결정. 코드가 없거나 매칭 실패면 빈 문자열(어느 지역 탭에도 속하지 않음) */
  regionKey: UjatInstitutionApplicationRegionKey
  no: number
  institutionName: string
  tempAssignmentStatus: UjatInstitutionTempAssignmentStatus
  gradeClassCounts: UjatInstitutionGradeClassCount[]
  totalClassCount: number
  scheduleSlots: Record<UjatInstitutionScheduleSlotKey, 'O' | '-'>
  /** GET sessions[].startAt 날짜. 없으면 빈 배열 */
  sessionIsoDates: string[]
  teacherName: string
  scheduleConfirmStatus?: UjatInstitutionScheduleConfirmStatus | null
  assignedInstructorCount?: number | null
  operatingStudentCount?: number | null
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
