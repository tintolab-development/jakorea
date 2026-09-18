/**
 * TODO(temp-mock): 열여라 참깨 — 참여 강사 강의보고서 검증 후 삭제
 */

import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { buildParticipatingSchoolSessionLines } from '@/features/program/general/lib/participating-school-session-display'

export const TEMP_INSTRUCTOR_LECTURE_REPORT_PREFIX = 'temp-instructor-lecture-report-'

function sessionScheduleLabel(sessions: ParticipatingSchoolSession[]): string {
  const lines = buildParticipatingSchoolSessionLines(sessions)
  return lines[0] ?? '-'
}

export function buildTemporaryParticipatingInstructorLectureReportRows(
  instructor: ParticipatingInstructorRow,
  sessions: ParticipatingSchoolSession[] = []
): ParticipatingInstructorLectureReportRow[] {
  const heldSessions = sessions.filter(session => session.status !== 'not_planned')
  const memberId =
    instructor.memberId != null && instructor.memberId !== ''
      ? Number(instructor.memberId)
      : undefined
  const baseCases: Array<
    Pick<
      ParticipatingInstructorLectureReportRow,
      'lectureProgressLabel' | 'submissionStatusLabel' | 'canViewReport'
    > & { submissionPeriodLabel: string }
  > = [
    {
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '제출 완료',
      submissionPeriodLabel: '2026. 10. 20까지',
      canViewReport: true,
    },
    {
      lectureProgressLabel: '진행 완료',
      submissionStatusLabel: '미제출',
      submissionPeriodLabel: '2026. 10. 27까지',
      canViewReport: false,
    },
    {
      lectureProgressLabel: '진행 예정',
      submissionStatusLabel: '진행 예정',
      submissionPeriodLabel: '2026. 11. 10까지',
      canViewReport: false,
    },
  ]

  const sourceSessions =
    heldSessions.length > 0
      ? heldSessions.slice(0, 3)
      : ([{ round: 1 }, { round: 2 }, { round: 3 }] as ParticipatingSchoolSession[])

  return sourceSessions.map((session, index) => {
    const caseRow = baseCases[index] ?? baseCases[baseCases.length - 1]!
    const scheduleLabel =
      heldSessions.length > 0
        ? buildParticipatingSchoolSessionLines([session])[0] ?? '-'
        : `${instructor.schoolName} | ${index + 1}회차`

    return {
      id: `${TEMP_INSTRUCTOR_LECTURE_REPORT_PREFIX}${instructor.id}-${index + 1}`,
      no: index + 1,
      reportId: 950_001 + index,
      instructorMemberId: Number.isFinite(memberId) ? memberId : undefined,
      schoolName: instructor.schoolName,
      educationGrade: instructor.educationGrade,
      educationScheduleLabel: scheduleLabel || sessionScheduleLabel(heldSessions),
      submissionPeriodLabel: caseRow.submissionPeriodLabel,
      lectureProgressLabel: caseRow.lectureProgressLabel,
      submissionStatusLabel: caseRow.submissionStatusLabel,
      canViewReport: caseRow.canViewReport,
      fileObjectIds: caseRow.canViewReport ? [880_001 + index] : [],
    }
  })
}
