/**
 * TODO(temp-mock): 열여라 참깨 — 개인 프로그램 진행 출석·과제 시드 (검증 후 삭제)
 */

import { isGeneralProgramTempMockIndividualProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import type {
  ParticipatingIndividualProgressAttendanceParticipantRow,
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import { getTempMockShowcaseIndividualProgressParticipants } from '@/features/program/general/lib/temp-mock-program-resolve'
import type { Program } from '@/types/domain'

function mapAttendanceStatus(
  sessionIndex: number,
  participantIndex: number
): ParticipatingIndividualProgressAttendanceStatus {
  const code = (sessionIndex + participantIndex) % 4
  if (code === 0) return 'present'
  if (code === 1) return 'late'
  if (code === 2) return 'absent'
  return 'excused_absence'
}

function toAttendanceParticipantRow(
  participant: ParticipatingIndividualParticipantRow,
  sessionIndex: number,
  participantIndex: number
): ParticipatingIndividualProgressAttendanceParticipantRow {
  const genderBirth = [participant.detail?.gender, participant.detail?.birthDate]
    .filter(Boolean)
    .join(' · ')
  const affiliationGrade = [participant.affiliation, participant.educationGrade]
    .filter(Boolean)
    .join(' · ')
  const status = mapAttendanceStatus(sessionIndex, participantIndex)
  return {
    id: `${participant.id}-attendance-session-${sessionIndex + 1}`,
    participantId: participant.id,
    name: participant.applicantName,
    genderBirthLabel: genderBirth || '-',
    affiliationGradeLabel: affiliationGrade || '-',
    affiliation: participant.affiliation ?? '-',
    educationGrade: participant.educationGrade ?? '-',
    contact: participant.detail?.contact,
    email: participant.detail?.email,
    attendanceStatus: status,
    lateTime: status === 'late' ? '09:15' : undefined,
    remark: status === 'excused_absence' ? '사유서 제출' : undefined,
  }
}

function toAssignmentParticipantRow(
  participant: ParticipatingIndividualParticipantRow,
  sessionIndex: number,
  participantIndex: number
): ParticipatingIndividualProgressAssignmentParticipantRow {
  const genderBirth = [participant.detail?.gender, participant.detail?.birthDate]
    .filter(Boolean)
    .join(' · ')
  const affiliationGrade = [participant.affiliation, participant.educationGrade]
    .filter(Boolean)
    .join(' · ')
  const submitted = (sessionIndex + participantIndex) % 3 !== 0
  return {
    id: `${participant.id}-assignment-session-${sessionIndex + 1}`,
    participantId: participant.id,
    name: participant.applicantName,
    genderBirthLabel: genderBirth || '-',
    affiliationGradeLabel: affiliationGrade || '-',
    affiliation: participant.affiliation ?? '-',
    educationGrade: participant.educationGrade ?? '-',
    submission: submitted
      ? {
          kind: 'submitted',
          fileName: '과제_제출.pdf',
          href: '#temp-mock-assignment',
        }
      : { kind: 'not_submitted' },
    remarkKind: submitted ? 'feedback_delivered' : 'none',
    remarkDateLabel: submitted ? '26.10.20' : undefined,
  }
}

function buildSessionMeta(program: Program, roundNumber: number, index: number) {
  const scheduleLine =
    program.generalCommonInfo?.educationScheduleLines?.[index] ??
    `${roundNumber}회차 교육 일정`
  const round = program.rounds?.find(r => r.roundNumber === roundNumber)
  const filterValue = round?.id ?? `round-${roundNumber}`
  const sessionId = `temp-mock-individual-attendance-round-${roundNumber}`
  return {
    scheduleLine,
    filterValue,
    sessionId,
    headerPeriodRangeLabel: round?.startDate && round?.endDate ? `${round.startDate} ~ ${round.endDate}` : '',
  }
}

export function buildTempMockIndividualProgressAttendanceSessions(
  program: Program
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  if (!isGeneralProgramTempMockIndividualProgramId(program.id)) return []
  const participants = getTempMockShowcaseIndividualProgressParticipants(program.id)
  const roundNumbers = program.rounds?.map(r => r.roundNumber) ?? [1, 2, 3, 4]

  return roundNumbers.map((roundNumber, index) => {
    const meta = buildSessionMeta(program, roundNumber, index)
    return {
      id: meta.sessionId,
      round: roundNumber,
      filterValue: meta.filterValue,
      filterLabel: meta.scheduleLine,
      headerTitle: `${roundNumber}회차`,
      headerScheduleSummary: meta.scheduleLine,
      headerPeriodRangeLabel: meta.headerPeriodRangeLabel,
      headerPrefix: '교육 일정',
      participants: participants.map((p, pIndex) =>
        toAttendanceParticipantRow(p, index, pIndex)
      ),
    }
  })
}

export function buildTempMockIndividualProgressAssignmentSessions(
  program: Program
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  if (!isGeneralProgramTempMockIndividualProgramId(program.id)) return []
  const participants = getTempMockShowcaseIndividualProgressParticipants(program.id)
  const roundNumbers = program.rounds?.map(r => r.roundNumber) ?? [1, 2, 3, 4]

  return roundNumbers.map((roundNumber, index) => {
    const meta = buildSessionMeta(program, roundNumber, index)
    const assignmentSessionId = `temp-mock-individual-assignment-round-${roundNumber}`
    return {
      id: assignmentSessionId,
      round: roundNumber,
      filterValue: meta.filterValue,
      filterLabel: meta.scheduleLine,
      headerTitle: `${roundNumber}회차 과제`,
      headerScheduleSummary: meta.scheduleLine,
      headerPeriodRangeLabel: meta.headerPeriodRangeLabel,
      assignmentPeriodLabel: '제출 기간: 교육일 ~ 7일 이내',
      headerPrefix: '과제',
      participants: participants.map((p, pIndex) =>
        toAssignmentParticipantRow(p, index, pIndex)
      ),
    }
  })
}
