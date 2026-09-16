/**
 * 참여 봉사자 — 타입 및 상수
 */

import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { GeneralVolunteerApplicationType } from '@/features/program/general/lib/volunteer-screening-constants'

export interface ParticipatingVolunteerRow {
  id: string
  /** BE 회원 ID — 참여 PK와 구분 */
  memberId?: number
  /** 프로그램 ID — 일반 기관 QA case 격리 */
  programId?: string
  no: number
  volunteerName: string
  id1365: string
  assignedInstitutionNames: string[]
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
  applicationType?: GeneralVolunteerApplicationType
  adminComment?: string
  activityWithdrawn?: boolean
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
