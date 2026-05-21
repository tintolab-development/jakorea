import type { UjatInstitutionApplicationRegionKey } from '../list/regions'

/** 임시 배정 기관 확인 — 일정 확인 현황 */
export type UjatInstitutionScheduleConfirmStatus =
  | 'institution_checking'
  | 'institution_confirmed'
  | 'application_rejected'

export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL: Record<
  UjatInstitutionScheduleConfirmStatus,
  string
> = {
  institution_checking: '기관 확인 중',
  institution_confirmed: '기관 확인 완료',
  application_rejected: '신청 반려',
}

/** 캘린더 우측 패널 뱃지용 짧은 라벨 */
export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_CALENDAR_STATUS_LABEL: Record<
  UjatInstitutionScheduleConfirmStatus,
  string
> = {
  institution_checking: '확인 중',
  institution_confirmed: '확인 완료',
  application_rejected: '신청 반려',
}

export const UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
] as const

export type UjatScheduleConfirmRow = {
  id: string
  regionKey: UjatInstitutionApplicationRegionKey
  no: number
  institutionName: string
  scheduleConfirmStatus: UjatInstitutionScheduleConfirmStatus
  /** 표시용 — `6월 10일, 9월 11일` */
  confirmedScheduleDisplay: string
  /** 필터용 ISO 날짜 */
  confirmedScheduleIsoDates: string[]
  assignedGradeCounts: Record<(typeof UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS)[number], number>
  totalEducationClassCount: number
  teacherName: string
}

export type UjatScheduleConfirmFilters = {
  institutionName: string
  scheduleConfirmStatus: string
  confirmedScheduleIso: string
  teacherName: string
}

/** 안내 사항 블록 — `institution_confirmed`에서만 노출 (기관 안내 사항 폼 제출 후) */
export function shouldShowScheduleConfirmGuidanceNotes(
  status: UjatInstitutionScheduleConfirmStatus
): boolean {
  return status === 'institution_confirmed'
}

export const EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS: UjatScheduleConfirmFilters = {
  institutionName: '',
  scheduleConfirmStatus: '',
  confirmedScheduleIso: '',
  teacherName: '',
}
