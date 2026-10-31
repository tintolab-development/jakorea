import type {
  ParticipatingIndividualParticipantRow,
  ParticipatingIndividualSurveyViewKey,
} from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import type {
  ParticipatingIndividualProgressAssignmentSessionGroup,
  ParticipatingIndividualProgressAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import type {
  ParticipatingIndividualParticipantAssignmentBundle,
  ParticipatingIndividualParticipantAssignmentRow,
  ParticipatingIndividualParticipantAssignmentSummary,
  ParticipatingIndividualParticipantAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-participant-assignment-types'
import { mapDashboardScheduleDeliveryToEducationProgress } from '@/features/program/general/lib/dashboard-schedule-delivery-status'

function isSubmissionCountedAsSubmitted(
  submission: ParticipatingIndividualParticipantAssignmentSubmission
): boolean {
  if (submission.kind === 'file' || submission.kind === 'link') return true
  if (submission.kind === 'survey_view' || submission.kind === 'satisfaction_survey_view') {
    return submission.submitted
  }
  return false
}

export function buildParticipatingIndividualParticipantAssignmentSummary(
  rows: ParticipatingIndividualParticipantAssignmentRow[]
): ParticipatingIndividualParticipantAssignmentSummary {
  const assignmentRows = rows.filter(row => row.countsTowardAssignmentDenominator)
  const surveyRows = rows.filter(row => row.countsTowardSurveyDenominator)

  return {
    assignmentSubmittedCount: assignmentRows.filter(row =>
      isSubmissionCountedAsSubmitted(row.submission)
    ).length,
    assignmentTotalCount: assignmentRows.length,
    surveySubmittedCount: surveyRows.filter(row => isSubmissionCountedAsSubmitted(row.submission))
      .length,
    surveyTotalCount: surveyRows.length,
  }
}

function buildRowsFromParticipant(
  participant: ParticipatingIndividualParticipantRow
): ParticipatingIndividualParticipantAssignmentRow[] {
  const teamName = participant.detail?.teamName?.trim() || '-'
  const teamRole =
    participant.detail?.teamRole === 'leader'
      ? ('leader' as const)
      : participant.detail?.teamRole === 'member'
        ? ('member' as const)
        : ('individual' as const)

  return (participant.sessions ?? []).map((session, index) => {
    const educationProgress = mapDashboardScheduleDeliveryToEducationProgress(
      session.deliveryScheduleStatus ??
        (session.status === 'completed' ? 'COMPLETED' : 'SCHEDULED')
    )
    return {
      id: `asg-${participant.id}-${index}`,
      scheduleId:
        session.resolvedScheduleId != null && session.resolvedScheduleId > 0
          ? String(session.resolvedScheduleId)
          : undefined,
      sessionOrder: index + 1,
      teamRole,
      teamName: teamRole !== 'individual' ? teamName : '-',
      scheduleLabel: `${session.date} (${session.dayOfWeek}) | ${session.classNum}`,
      assignmentPeriodLabel: null,
      submission: { kind: 'none' as const },
      educationProgress,
      countsTowardAssignmentDenominator: educationProgress === 'completed',
      isTeamSchedule: teamRole !== 'individual',
      countsTowardSurveyDenominator: false,
    }
  })
}

export function getParticipatingIndividualParticipantAssignmentBundle(
  participant: ParticipatingIndividualParticipantRow,
  _program: Program
): ParticipatingIndividualParticipantAssignmentBundle {
  const rows = buildRowsFromParticipant(participant)

  return {
    rows,
    summary: buildParticipatingIndividualParticipantAssignmentSummary(rows),
  }
}

export function sortParticipatingIndividualParticipantAssignmentRows(
  rows: ParticipatingIndividualParticipantAssignmentRow[]
): ParticipatingIndividualParticipantAssignmentRow[] {
  return [...rows].sort((a, b) => b.sessionOrder - a.sessionOrder)
}

export function applyTeamNameFromSessionOrder(
  rows: ParticipatingIndividualParticipantAssignmentRow[],
  fromSessionOrder: number,
  teamName: string
): ParticipatingIndividualParticipantAssignmentRow[] {
  return rows.map(row => {
    if (!row.isTeamSchedule || row.sessionOrder < fromSessionOrder) return row
    return { ...row, teamName }
  })
}

function mapRemoteSubmissionToDetail(
  submission: ParticipatingIndividualProgressAssignmentSubmission
): ParticipatingIndividualParticipantAssignmentSubmission {
  if (submission.kind === 'submitted') {
    return {
      kind: 'file',
      fileName: submission.fileName,
      fileObjectId: submission.fileObjectId,
      downloadable: submission.downloadable,
      secondaryFileName: submission.secondaryFileName,
      secondaryFileObjectId: submission.secondaryFileObjectId,
      secondaryDownloadable: submission.secondaryDownloadable,
    }
  }
  if (submission.kind === 'not_submitted') return { kind: 'not_submitted' }
  return { kind: 'none' }
}

/** LNB 과제 관리 `assignment-submissions` 를 참여자 상세 과제 탭 행에 조인 */
export function mergeParticipantDetailAssignmentRowsWithRemote(input: {
  participantId: string
  localRows: ParticipatingIndividualParticipantAssignmentRow[]
  remoteSessions: ParticipatingIndividualProgressAssignmentSessionGroup[]
  surveyResponse?: ParticipatingIndividualSurveyViewKey | null
  satisfactionResponse?: ParticipatingIndividualSurveyViewKey | null
}): ParticipatingIndividualParticipantAssignmentRow[] {
  if (input.remoteSessions.length === 0) {
    return appendParticipantSurveyViewRows({
      participantId: input.participantId,
      rows: input.localRows,
      surveyResponse: input.surveyResponse,
      satisfactionResponse: input.satisfactionResponse,
    })
  }

  const localByScheduleId = new Map<string, ParticipatingIndividualParticipantAssignmentRow>()
  for (const row of input.localRows) {
    if (row.scheduleId) localByScheduleId.set(row.scheduleId, row)
  }

  const merged: ParticipatingIndividualParticipantAssignmentRow[] = []
  for (const remote of input.remoteSessions) {
    const remoteParticipant = remote.participants.find(
      item => item.participantId === input.participantId
    )
    // 팀 일정 과제는 참가자별 제출. 다른 팀원(팀장) 파일을 이 행에 복사하지 않는다.
    if (!remoteParticipant) continue
    const local = localByScheduleId.get(remote.id)
    const submission = mapRemoteSubmissionToDetail(remoteParticipant.submission)
    merged.push({
      id: local?.id ?? `asg-${input.participantId}-${remote.id}`,
      scheduleId: remote.id,
      sessionOrder: remote.round,
      teamRole: local?.teamRole ?? 'individual',
      teamName: local?.teamName ?? '-',
      scheduleLabel: local?.scheduleLabel || remote.filterLabel,
      assignmentPeriodLabel:
        remote.assignmentPeriodLabel?.trim() || local?.assignmentPeriodLabel || null,
      submission,
      educationProgress:
        remoteParticipant.submission.kind === 'scheduled' ? 'scheduled' : 'completed',
      countsTowardAssignmentDenominator: remoteParticipant.submission.kind !== 'scheduled',
      isTeamSchedule: local?.isTeamSchedule ?? false,
      countsTowardSurveyDenominator: local?.countsTowardSurveyDenominator ?? false,
    })
  }

  const withFiles =
    merged.length > 0
      ? sortParticipatingIndividualParticipantAssignmentRows(merged)
      : input.localRows

  const matchedParticipants = input.remoteSessions.flatMap(session =>
    session.participants.filter(item => item.participantId === input.participantId)
  )
  const surveyKey =
    matchedParticipants.find(item => item.surveyResponse)?.surveyResponse ?? input.surveyResponse
  const satisfactionKey =
    matchedParticipants.find(item => item.satisfactionResponse)?.satisfactionResponse ??
    input.satisfactionResponse

  return appendParticipantSurveyViewRows({
    participantId: input.participantId,
    rows: withFiles,
    surveyResponse: surveyKey,
    satisfactionResponse: satisfactionKey,
  })
}

export function appendParticipantSurveyViewRows(input: {
  participantId: string
  rows: ParticipatingIndividualParticipantAssignmentRow[]
  surveyResponse?: ParticipatingIndividualSurveyViewKey | null
  satisfactionResponse?: ParticipatingIndividualSurveyViewKey | null
}): ParticipatingIndividualParticipantAssignmentRow[] {
  const extra: ParticipatingIndividualParticipantAssignmentRow[] = []
  let sessionOrder = input.rows.reduce((max, row) => Math.max(max, row.sessionOrder), 0)

  if (input.surveyResponse) {
    extra.push({
      id: `asg-${input.participantId}-survey`,
      sessionOrder: ++sessionOrder,
      teamRole: 'individual',
      teamName: '-',
      scheduleLabel: '설문조사',
      assignmentPeriodLabel: null,
      submission: {
        kind: 'survey_view',
        submitted: true,
        templateVersionId: input.surveyResponse.templateVersionId,
        formResponseId: input.surveyResponse.formResponseId,
      },
      educationProgress: 'completed',
      countsTowardAssignmentDenominator: false,
      isTeamSchedule: false,
      countsTowardSurveyDenominator: true,
    })
  }

  if (input.satisfactionResponse) {
    extra.push({
      id: `asg-${input.participantId}-satisfaction`,
      sessionOrder: ++sessionOrder,
      teamRole: 'individual',
      teamName: '-',
      scheduleLabel: '만족도조사',
      assignmentPeriodLabel: null,
      submission: {
        kind: 'satisfaction_survey_view',
        submitted: true,
        templateVersionId: input.satisfactionResponse.templateVersionId,
        formResponseId: input.satisfactionResponse.formResponseId,
      },
      educationProgress: 'completed',
      countsTowardAssignmentDenominator: false,
      isTeamSchedule: false,
      countsTowardSurveyDenominator: true,
    })
  }

  return extra.length === 0 ? input.rows : [...input.rows, ...extra]
}

export function collectParticipantAssignmentDownloadableFiles(
  rows: ParticipatingIndividualParticipantAssignmentRow[]
): Array<{ fileObjectId: number; fileName: string }> {
  const files: Array<{ fileObjectId: number; fileName: string }> = []
  for (const row of rows) {
    if (row.submission.kind !== 'file') continue
    if (row.submission.downloadable === true && row.submission.fileObjectId != null) {
      files.push({
        fileObjectId: row.submission.fileObjectId,
        fileName: row.submission.fileName,
      })
    }
    if (
      row.submission.secondaryDownloadable === true &&
      row.submission.secondaryFileObjectId != null
    ) {
      files.push({
        fileObjectId: row.submission.secondaryFileObjectId,
        fileName: row.submission.secondaryFileName ?? `과제_${row.submission.secondaryFileObjectId}`,
      })
    }
  }
  return files
}
