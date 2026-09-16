/**
 * 참여자(개인) — 타입 및 상수
 */

import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { LectureAttendanceSession } from './school-detail-types'

export type ParticipatingIndividualParticipantRow = GeneralIndividualApplicantRow & {
  /** 수료증/참여인증서 발급 판별용 회차별 출석 */
  lectureAttendanceSessions: LectureAttendanceSession[]
  satisfactionSurveyCompleted: boolean
  /** 프로그램 참여 신청일 — 발급 가능 기한(3년) 산정 */
  participationAppliedAt: string
  /** 활동 포기 처리 여부 */
  activityWithdrawn?: boolean
  /** 활동 포기 기준 교육 일정 키 */
  activityWithdrawStopSessionKey?: string
  /** 활동 포기 기준 교육 일정 표시 라벨 */
  activityWithdrawStopScheduleLabel?: string
}

/** Mock 시드 제거 — 빈 배열 */
export const MOCK_PARTICIPATING_INDIVIDUAL_PARTICIPANTS: ParticipatingIndividualParticipantRow[] =
  []

export function getParticipatingIndividualParticipantsForProgram(
  _programId: string
): ParticipatingIndividualParticipantRow[] {
  return []
}
