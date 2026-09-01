import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  type ParticipatingIndividualProgressAssignmentFilters,
  type ParticipatingIndividualProgressAssignmentParticipantRow,
  type ParticipatingIndividualProgressAssignmentRemarkKind,
  type ParticipatingIndividualProgressAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'

export {
  formatIndividualProgressAttendanceAffiliationGradeLabel as formatIndividualProgressAssignmentAffiliationGradeLabel,
  formatIndividualProgressAttendanceGenderBirthLabel as formatIndividualProgressAssignmentGenderBirthLabel,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'

export function resolveProgressAssignmentSubmissionFilterValue(
  submission: ParticipatingIndividualProgressAssignmentSubmission
): ParticipatingIndividualProgressAssignmentFilters['submissionStatus'] {
  if (submission.kind === 'submitted') return 'submitted'
  if (submission.kind === 'not_submitted') return 'not_submitted'
  return PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL
}

export function resolveProgressAssignmentRemark(
  row: Pick<
    ParticipatingIndividualProgressAssignmentParticipantRow,
    'remarkKind' | 'remarkDateLabel'
  >
): string {
  if (row.remarkKind === 'none') return '-'
  const dateLabel = row.remarkDateLabel?.trim()
  if (!dateLabel) return '-'

  const labels: Record<
    Exclude<ParticipatingIndividualProgressAssignmentRemarkKind, 'none'>,
    string
  > = {
    deadline_missed: '과제 기한 미준수',
    revision_submitted: '과제 수정 제출',
    feedback_delivered: '피드백 전달 완료',
  }

  return `${labels[row.remarkKind]} (${dateLabel})`
}

export function resolveProgressAssignmentSubmissionExportLabel(
  submission: ParticipatingIndividualProgressAssignmentSubmission
): string {
  if (submission.kind === 'not_submitted') return '미제출'
  if (submission.kind === 'scheduled') return '교육 진행 예정'
  if (submission.secondaryFileName) {
    return `${submission.fileName}, ${submission.secondaryFileName}`
  }
  return submission.fileName
}

export function participantMatchesProgressAssignmentFilters(
  row: ParticipatingIndividualProgressAssignmentParticipantRow,
  filters: ParticipatingIndividualProgressAssignmentFilters
): boolean {
  const nameQ = filters.participantName.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false

  const affiliationQ = filters.affiliation.trim().toLowerCase()
  if (affiliationQ && !row.affiliation.toLowerCase().includes(affiliationQ)) return false

  if (
    filters.educationGrade !== PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL &&
    row.educationGrade !== filters.educationGrade
  ) {
    return false
  }

  if (filters.submissionStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL) {
    const submissionFilter = resolveProgressAssignmentSubmissionFilterValue(row.submission)
    if (submissionFilter !== filters.submissionStatus) return false
  }

  return true
}

export function filterProgressAssignmentParticipantsForDisplay(
  participants: ParticipatingIndividualProgressAssignmentParticipantRow[],
  filters: ParticipatingIndividualProgressAssignmentFilters
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  const hasParticipantFilter =
    filters.participantName.trim() !== '' ||
    filters.affiliation.trim() !== '' ||
    filters.educationGrade !== PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL ||
    filters.submissionStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL

  if (!hasParticipantFilter) return participants
  return participants.filter(row => participantMatchesProgressAssignmentFilters(row, filters))
}

export function cloneProgressAssignmentParticipantRows(
  rows: ParticipatingIndividualProgressAssignmentParticipantRow[]
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  return rows.map(row => ({ ...row, submission: { ...row.submission } }))
}
