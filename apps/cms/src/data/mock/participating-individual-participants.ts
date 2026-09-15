/**
 * 일반 프로그램(개인) — 프로그램 진행 현황 > 참여자 목록 mock
 */

import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import { MOCK_GENERAL_INDIVIDUAL_APPLICATIONS } from '@/data/mock/general-individual-applications-mock'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { LectureAttendanceSession } from '@/features/program/general/model/school-detail-types'

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

function buildAttendanceSessions(
  sessionCount: number,
  rowIndex: number
): LectureAttendanceSession[] {
  const disqualify = rowIndex % 3 === 1
  const sessions: LectureAttendanceSession[] = []
  for (let i = 0; i < Math.max(sessionCount, 1); i++) {
    const isLast = i === Math.max(sessionCount, 1) - 1
    sessions.push({
      roundNumber: i + 1,
      status: disqualify && isLast ? 'absent' : 'attended',
    })
  }
  return sessions
}

function patchParticipantProgressDetailSessions(
  row: ParticipatingIndividualParticipantRow
): ParticipatingIndividualParticipantRow {
  if (row.id !== 'general-individual-applicant-3') return row

  const sessions: ParticipatingSchoolSession[] = [
    {
      round: 1,
      date: '2026.04.20',
      dayOfWeek: '월',
      duration: '2시간 50분',
      format: '오프라인',
      classNum: '3차시',
      timeRange: '09:30~12:20',
      status: 'completed',
    },
    {
      round: 2,
      date: '2026.04.27',
      dayOfWeek: '월',
      duration: '2시간 50분',
      format: '오프라인',
      classNum: '2차시',
      timeRange: '13:00~15:50',
      status: 'pending',
    },
  ]

  return {
    ...row,
    sessions,
    lectureAttendanceSessions: buildAttendanceSessions(sessions.length, 2),
    satisfactionSurveyCompleted: true,
  }
}

function patchScreenshotSessions(
  row: ParticipatingIndividualParticipantRow
): ParticipatingIndividualParticipantRow {
  if (row.id !== 'general-individual-applicant-1') {
    return patchParticipantProgressDetailSessions(row)
  }

  const sessions: ParticipatingSchoolSession[] = [
    {
      round: 2,
      date: '2026.01.07',
      dayOfWeek: '수',
      duration: '2시간',
      format: '오프라인',
      classNum: '2차시',
      timeRange: '09:20~11:20',
      status: 'pending',
    },
    {
      round: 2,
      date: '2026.01.08',
      dayOfWeek: '목',
      duration: '2시간',
      format: '오프라인',
      classNum: '2차시',
      timeRange: '09:20~11:20',
      status: 'pending',
    },
    {
      round: 2,
      date: '2026.01.09',
      dayOfWeek: '금',
      duration: '2시간',
      format: '오프라인',
      classNum: '2차시',
      timeRange: '09:20~11:20',
      status: 'pending',
    },
  ]

  return {
    ...row,
    applicantName: '고종욱',
    affiliation: '강서초등학교',
    educationGrade: '5학년',
    homeAddress: '서울특별시 강서구',
    sessions,
    lectureAttendanceSessions: buildAttendanceSessions(sessions.length, 0),
    satisfactionSurveyCompleted: true,
  }
}

function buildParticipatingRows(): ParticipatingIndividualParticipantRow[] {
  /** 진행 현황 참여자 — 케이스별 1건만 */
  const CASE_IDS = new Set([
    'general-individual-applicant-1', // 인증 가능·시안
    'general-individual-applicant-3', // 상세 세션 시안
    'general-individual-applicant-4', // 설문 미완료
    'general-individual-applicant-6', // 결석(인증 불가)
    'general-individual-applicant-7', // 활동 포기
  ])

  return MOCK_GENERAL_INDIVIDUAL_APPLICATIONS.filter(row => CASE_IDS.has(row.id)).map(
    (row, index) => {
      const sessionCount = row.sessions?.length ?? 1
      const isSurveyIncomplete = row.id === 'general-individual-applicant-4'
      const isAbsentCase = row.id === 'general-individual-applicant-6'
      const isWithdrawn = row.id === 'general-individual-applicant-7'
      const base: ParticipatingIndividualParticipantRow = {
        ...row,
        approvalStatus: 'approved',
        lectureAttendanceSessions: buildAttendanceSessions(
          sessionCount,
          isAbsentCase ? 1 : index
        ),
        satisfactionSurveyCompleted: !isSurveyIncomplete,
        participationAppliedAt: row.approvalNotificationSentAt ?? '2026.01.01 00:00:00',
        ...(isWithdrawn
          ? {
              activityWithdrawn: true,
              activityWithdrawStopSessionKey: '1',
              activityWithdrawStopScheduleLabel: '1회차',
            }
          : {}),
      }
      return patchScreenshotSessions(base)
    }
  )
}

const PARTICIPATING_ROWS = buildParticipatingRows()

export function getParticipatingIndividualParticipantsForProgram(
  programId: string
): ParticipatingIndividualParticipantRow[] {
  return PARTICIPATING_ROWS.map(row => ({ ...row, programId }))
}

export function findParticipatingIndividualParticipantById(
  programId: string,
  participantId: string
): ParticipatingIndividualParticipantRow | null {
  return (
    getParticipatingIndividualParticipantsForProgram(programId).find(
      row => row.id === participantId
    ) ?? null
  )
}
