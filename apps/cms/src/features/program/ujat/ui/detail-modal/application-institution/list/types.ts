import type { UjatInstitutionApplicationRegionKey } from './regions'
import type { UjatInstitutionScheduleSlotKey } from '../education-schedule'

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

export type {
  UjatInstitutionScheduleSlotKey,
} from '../education-schedule'
export {
  UJAT_INSTITUTION_EDUCATION_PERIOD_MOCK,
  UJAT_INSTITUTION_SCHEDULE_COLUMNS,
  buildEmptyScheduleSlots,
  formatUjatInstitutionFridayDisplay,
  sumGradeClassCounts,
} from '../education-schedule'

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
