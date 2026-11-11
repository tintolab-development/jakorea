/**
 * 참여 봉사자 — 타입 및 상수
 */

import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { GeneralVolunteerApplicationType } from '@/features/program/general/lib/volunteer-screening-constants'
import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'

export interface ParticipatingVolunteerRow {
  id: string
  /** 봉사자 신청 PK — participants `sourceApplicationId` */
  volunteerApplicationId?: string
  /** 관리자 등록 봉사자만 GENERAL | EMPLOYEE */
  volunteerKind?: 'GENERAL' | 'EMPLOYEE'
  /** BE 회원 ID — 참여 PK와 구분 */
  memberId?: number
  /** 저장된 기존 소속 학교/기관 ID */
  affiliationOrganizationId?: number | null
  /** 저장된 기존 소속 학교/기관 표시명 */
  affiliation?: string
  /** 프로그램 ID — 일반 기관 QA case 격리 */
  programId?: string
  no: number
  volunteerName: string
  id1365: string
  assignedInstitutionNames: string[]
  /** participants `homeAddressSummary` / 시·도·군·구 — 배정 탭 봉사 지역 폴백 */
  homeRegion?: string
  sessions: ParticipatingSchoolSession[]
  contact: string
  email: string
  /** 일반 봉사자 중 재참여 여부 — 교육 실적 재참여 합산용 */
  isReturningVolunteer?: boolean
  /** 상세 — 신청 정보 탭 */
  contactRaw?: string
  emailRaw?: string
  gender?: string
  birthDate?: string
  age?: number
  scheduleChangeCancelCount?: number
  hasJaVolunteerExperience?: boolean
  previousJaProgram?: string
  evidenceAttachments?: VolunteerApplicationEvidenceAttachment[]
  applicationType?: GeneralVolunteerApplicationType
  adminComment?: string
  activityWithdrawn?: boolean
  /** participants `distanceKm` — 봉사자는 서버가 산출하지 않아 항상 null(→ '-') */
  distanceKm?: number | null
  /** participants `programDispatchCount` — 일반 기관형 봉사자: 취소되지 않은 배정 회차 수. 그 외 null */
  programDispatchCount?: number | null
  /** participants `programLongDistanceDispatchCount` — 봉사자는 항상 null(→ '-') */
  programLongDistanceDispatchCount?: number | null
  activityWithdrawStopSessionKey?: string
  performanceExcludedSessionKeys?: string[]
  essayIntro?: string
  essayEducationExperience?: string
  essayNecessity?: string
  essayJaExperience?: string
}

/** Mock 시드 제거 — 빈 배열 */
export const MOCK_PARTICIPATING_VOLUNTEERS: ParticipatingVolunteerRow[] = []

export function getParticipatingVolunteersForProgram(
  _programId: string
): ParticipatingVolunteerRow[] {
  return []
}
