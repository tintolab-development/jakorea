import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  type ParticipatingIndividualProgressAssignmentFilters,
  type ParticipatingIndividualProgressAssignmentParticipantRow,
  type ParticipatingIndividualProgressAssignmentRemarkKind,
  type ParticipatingIndividualProgressAssignmentSessionGroup,
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
  if (submission.items?.length) {
    return submission.items.map(item => item.fileName).join(', ')
  }
  if (submission.files?.length) {
    return submission.files.map(file => file.fileName).join(', ')
  }
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

export function hasProgressAssignmentParticipantSearchFilters(
  filters: ParticipatingIndividualProgressAssignmentFilters
): boolean {
  return (
    filters.participantName.trim() !== '' ||
    filters.affiliation.trim() !== '' ||
    filters.educationGrade !== PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL ||
    filters.submissionStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL
  )
}

export function filterProgressAssignmentParticipantsForDisplay(
  participants: ParticipatingIndividualProgressAssignmentParticipantRow[],
  filters: ParticipatingIndividualProgressAssignmentFilters
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  if (!hasProgressAssignmentParticipantSearchFilters(filters)) return participants
  return participants.filter(row => participantMatchesProgressAssignmentFilters(row, filters))
}

/** 교육 일정 필터만 적용. 참여자 검색이 없으면 빈 테이블 회차도 유지한다. */
export function filterProgressAssignmentSessionGroups(
  sessions: ParticipatingIndividualProgressAssignmentSessionGroup[],
  filters: ParticipatingIndividualProgressAssignmentFilters
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  const filteredBySchedule =
    filters.educationSchedule === PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  const mapped = filteredBySchedule.map(session => ({
    ...session,
    participants: filterProgressAssignmentParticipantsForDisplay(session.participants, filters),
  }))

  if (!hasProgressAssignmentParticipantSearchFilters(filters)) return mapped
  return mapped.filter(session => session.participants.length > 0)
}

export function cloneProgressAssignmentParticipantRows(
  rows: ParticipatingIndividualProgressAssignmentParticipantRow[]
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  return rows.map(row => ({ ...row, submission: { ...row.submission } }))
}
