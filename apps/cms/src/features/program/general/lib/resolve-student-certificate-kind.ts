import type { LectureAttendanceSession } from '../model/school-detail-types'

export type StudentCertificateKind = 'completion' | 'participation'

const CERTIFICATE_ISSUANCE_YEARS = 3

export interface ResolveStudentCertificateKindInput {
  sessions: LectureAttendanceSession[]
  satisfactionSurveyRequired: boolean
  satisfactionSurveyCompleted: boolean
}

function parseDateValue(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 프로그램 참여 신청일로부터 3년 이내 발급 가능 */
export function isWithinStudentCertificateIssuancePeriod(
  participationAppliedAt: Date | string | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  const appliedAt = parseDateValue(participationAppliedAt)
  if (appliedAt == null) return true

  const expiresAt = new Date(appliedAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + CERTIFICATE_ISSUANCE_YEARS)
  return referenceDate.getTime() <= expiresAt.getTime()
}

/**
 * 수료증 vs 참여인증서 판별
 * - 수료: 진행된 전 회차에 결석 없음(사유 불참 허용), 마지막 교육 일정까지 참여, 만족도 조사 완료(해당 시)
 * - 참여: 위 조건 미충족
 */
export function resolveStudentCertificateKind(
  input: ResolveStudentCertificateKindInput
): StudentCertificateKind {
  const { sessions, satisfactionSurveyRequired, satisfactionSurveyCompleted } = input
  if (sessions.length === 0) return 'participation'

  const lastRoundNumber = Math.max(...sessions.map(session => session.roundNumber))
  const lastSession = sessions.find(session => session.roundNumber === lastRoundNumber)
  if (lastSession == null || lastSession.status === 'not_held') {
    return 'participation'
  }

  const heldSessions = sessions.filter(session => session.status !== 'not_held')
  const hasDisqualifyingAbsence = heldSessions.some(session => session.status === 'absent')
  if (hasDisqualifyingAbsence) return 'participation'

  const completedAllHeldSessions = heldSessions.every(
    session => session.status === 'attended' || session.status === 'late'
  )
  if (!completedAllHeldSessions) return 'participation'

  if (satisfactionSurveyRequired && !satisfactionSurveyCompleted) {
    return 'participation'
  }

  return 'completion'
}
