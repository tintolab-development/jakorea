import type { UjatInstitutionApplicationDetail } from '../../../application-institution/detail/detail-types'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatInstitutionParticipantState } from './participant-status'

export const UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TABS = [
  'application',
  'assignment',
  'posts',
] as const

export type UjatEducationProgressInstitutionDetailTab =
  (typeof UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TABS)[number]

export const UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS: Record<
  UjatEducationProgressInstitutionDetailTab,
  string
> = {
  application: '신청 정보',
  assignment: '교육 배정 및 진행 현황',
  posts: '게시글',
}

export type UjatEducationProgressInstitutionGuidance = {
  deviceAvailability: string
  waitingAreaGuide: string
  leftoverTextbookDisposal: string
  parkingAndNotes: string
  snackAvailability: string
  criminalRecordCheckRequest: string
}

export type UjatEducationProgressInstitutionConfirmedScheduleRow = {
  id: string
  dateDisplay: string
  classLabels: string[]
  /** temporary-schedule slot.scheduleId — 활동 포기 stopScheduleId. 없거나 특정 불가면 생략 */
  scheduleId?: number
}

export type UjatEducationProgressInstitutionDetail = {
  institutionId: string
  half: EducationProgressHalfKey
  institutionName: string
  /** 기관 신청 상세 GET `participantId` — 활동 포기 POST 대상. 응답에 없으면 null */
  participantId?: number | null
  /** 기관 신청 상세 GET participantStatus·participantAvailableActions. 없으면 null */
  participantState?: UjatInstitutionParticipantState
  /** 기관 신청 상세 GET `organizationId` — 소속 교사 목록 조회 키. 응답에 없으면 null */
  organizationId?: number | null
  /** 기관 신청 상세 GET `teacherMemberId` — 현재 담당 교사 회원 ID. 응답에 없으면 null */
  teacherMemberId?: number | null
  educationRegion: string
  adminComment: string
  applicationDetail: UjatInstitutionApplicationDetail
  confirmedScheduleRows: UjatEducationProgressInstitutionConfirmedScheduleRow[]
  guidance: UjatEducationProgressInstitutionGuidance
}
