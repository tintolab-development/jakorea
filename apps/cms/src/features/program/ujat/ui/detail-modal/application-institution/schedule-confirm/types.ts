import type { UjatInstitutionApplicationRegionKey } from '../list/regions'

/** 임시 배정 기관 확인 — 일정 확인 현황 */
export type UjatInstitutionScheduleConfirmStatus =
  | 'institution_checking'
  | 'institution_confirmed'
  | 'approval_completed'
  | 'revision_requested'
  | 'application_rejected'

export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_LABEL: Record<
  UjatInstitutionScheduleConfirmStatus,
  string
> = {
  institution_confirmed: '기관 확인 완료',
  institution_checking: '기관 확인 중',
  approval_completed: '승인 완료',
  revision_requested: '수정 요청',
  application_rejected: '신청 반려',
}

/** 필터·셀렉트 옵션 노출 순서 */
export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_ORDER: readonly UjatInstitutionScheduleConfirmStatus[] =
  [
    'institution_confirmed',
    'institution_checking',
    'approval_completed',
    'revision_requested',
    'application_rejected',
  ]

/** 캘린더 우측 패널 뱃지용 짧은 라벨 */
export const UJAT_INSTITUTION_SCHEDULE_CONFIRM_CALENDAR_STATUS_LABEL: Record<
  UjatInstitutionScheduleConfirmStatus,
  string
> = {
  institution_checking: '확인 중',
  institution_confirmed: '확인 완료',
  approval_completed: '승인 완료',
  revision_requested: '수정 요청',
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
  /** 교육 진행 확정 일정 — 다중 선택 ISO */
  confirmedScheduleIsoDates: string[]
  teacherName: string
}

/** 안내 사항 블록 — 기관 확인 완료·승인 완료에서 노출 */
export function shouldShowScheduleConfirmGuidanceNotes(
  status: UjatInstitutionScheduleConfirmStatus
): boolean {
  return status === 'institution_confirmed' || status === 'approval_completed'
}

export const EMPTY_UJAT_SCHEDULE_CONFIRM_FILTERS: UjatScheduleConfirmFilters = {
  institutionName: '',
  scheduleConfirmStatus: '',
  confirmedScheduleIsoDates: [],
  teacherName: '',
}
