/**
 * 참여자(개인) — 타입 및 상수
 */

import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { LectureAttendanceSession } from './school-detail-types'

export type ParticipatingIndividualSurveyViewKey = {
  templateVersionId: number
  formResponseId: number
}

export function parseParticipantSurveyViewKey(
  value: unknown
): ParticipatingIndividualSurveyViewKey | undefined {
  if (value == null || typeof value !== 'object') return undefined
  const record = value as { templateVersionId?: unknown; formResponseId?: unknown }
  const templateVersionId = Number(record.templateVersionId)
  const formResponseId = Number(record.formResponseId)
  if (!Number.isFinite(templateVersionId) || templateVersionId <= 0) return undefined
  if (!Number.isFinite(formResponseId) || formResponseId <= 0) return undefined
  return { templateVersionId, formResponseId }
}

export type ParticipatingIndividualParticipantRow = GeneralIndividualApplicantRow & {
  /** 수료증/참가인증서 발급 판별용 회차별 출석 */
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
  /** 과제 탭 설문조사 보기 — participants 또는 assignment-submissions additive */
  surveyResponse?: ParticipatingIndividualSurveyViewKey
  /** 과제 탭 만족도조사 보기 — 같은 additive */
  satisfactionResponse?: ParticipatingIndividualSurveyViewKey
}

/** Mock 시드 제거 — 빈 배열 */
export const MOCK_PARTICIPATING_INDIVIDUAL_PARTICIPANTS: ParticipatingIndividualParticipantRow[] =
  []

export function getParticipatingIndividualParticipantsForProgram(
  _programId: string
): ParticipatingIndividualParticipantRow[] {
  return []
}
