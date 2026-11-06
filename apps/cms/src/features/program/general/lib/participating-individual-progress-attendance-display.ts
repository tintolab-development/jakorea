import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { ProgramAttendanceStatusTextKind } from '@/features/program/shared/ui/program-attendance-status-text'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_STATUS_LABELS,
  type ParticipatingIndividualProgressAttendanceFilters,
  type ParticipatingIndividualProgressAttendanceParticipantRow,
  type ParticipatingIndividualProgressAttendanceSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

export function formatIndividualProgressAttendanceGenderBirthLabel(
  gender?: string,
  birthDate?: string
): string {
  const genderLabel = toDisplayGender(gender)
  const birthLabel = birthDate?.trim() || '-'
  return `${genderLabel} | ${birthLabel}`
}

export function formatIndividualProgressAttendanceAffiliationGradeLabel(
  affiliation?: string,
  educationGrade?: string
): string {
  const affiliationLabel = affiliation?.trim() || '-'
  const gradeLabel = educationGrade?.trim() || '-'
  return `${affiliationLabel} | ${gradeLabel}`
}

export function maskProgressAttendanceContact(contact?: string): string {
  return displayServerPiiAsIs(contact)
}

export function maskProgressAttendanceEmail(email?: string): string {
  return displayServerPiiAsIs(email)
}

export function toProgressAttendanceStatusTextKind(
  row: Pick<
    ParticipatingIndividualProgressAttendanceParticipantRow,
    'attendanceRecorded' | 'attendanceStatus'
  >
): ProgramAttendanceStatusTextKind {
  if (!row.attendanceRecorded || row.attendanceStatus == null) return 'pending'
  if (row.attendanceStatus === 'absent') return 'absent'
  if (row.attendanceStatus === 'late') return 'late'
  if (row.attendanceStatus === 'excused_absence') return 'excused_absence'
  return 'present'
}

export function resolveProgressAttendanceStatusLabel(
  row: Pick<
    ParticipatingIndividualProgressAttendanceParticipantRow,
    'attendanceRecorded' | 'attendanceStatus' | 'lateTime' | 'lateMinutes'
  >
): string {
  if (!row.attendanceRecorded || row.attendanceStatus == null) return '-'
  if (row.attendanceStatus === 'late') {
    if (row.lateMinutes != null && Number.isFinite(row.lateMinutes)) {
      return row.lateTime?.trim()
        ? `${row.lateMinutes}분 지각 (${row.lateTime.trim()})`
        : `${row.lateMinutes}분 지각`
    }
    if (row.lateTime?.trim()) {
      return `지각 (${row.lateTime.trim()})`
    }
    return PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_STATUS_LABELS.late
  }
  return PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_STATUS_LABELS[row.attendanceStatus]
}

export function resolveProgressAttendanceRemark(
  row: Pick<
    ParticipatingIndividualProgressAttendanceParticipantRow,
    'attendanceRecorded' | 'attendanceStatus' | 'remark'
  >
): string {
  if (row.attendanceRecorded && row.attendanceStatus === 'excused_absence') {
    return row.remark?.trim() || '-'
  }
  return '-'
}

export function participantMatchesProgressAttendanceFilters(
  row: ParticipatingIndividualProgressAttendanceParticipantRow,
  filters: ParticipatingIndividualProgressAttendanceFilters
): boolean {
  const nameQ = filters.participantName.trim().toLowerCase()
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false

  const affiliationQ = filters.affiliation.trim().toLowerCase()
  if (affiliationQ && !row.affiliation.toLowerCase().includes(affiliationQ)) return false

  if (
    filters.educationGrade !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL &&
    row.educationGrade !== filters.educationGrade
  ) {
    return false
  }

  if (filters.attendanceStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL) {
    if (!row.attendanceRecorded || row.attendanceStatus !== filters.attendanceStatus) {
      return false
    }
  }

  return true
}

export function hasProgressAttendanceParticipantSearchFilters(
  filters: ParticipatingIndividualProgressAttendanceFilters
): boolean {
  return (
    filters.participantName.trim() !== '' ||
    filters.affiliation.trim() !== '' ||
    filters.educationGrade !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL ||
    filters.attendanceStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL
  )
}

export function filterProgressAttendanceParticipantsForDisplay(
  participants: ParticipatingIndividualProgressAttendanceParticipantRow[],
  filters: ParticipatingIndividualProgressAttendanceFilters
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  if (!hasProgressAttendanceParticipantSearchFilters(filters)) return participants
  return participants.filter(row => participantMatchesProgressAttendanceFilters(row, filters))
}

/** 교육 일정 필터만 적용. 참여자 검색이 없으면 빈 테이블 회차도 유지한다. */
export function filterProgressAttendanceSessionGroups(
  sessions: ParticipatingIndividualProgressAttendanceSessionGroup[],
  filters: ParticipatingIndividualProgressAttendanceFilters
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  const filteredBySchedule =
    filters.educationSchedule === PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL
      ? sessions
      : sessions.filter(session => session.filterValue === filters.educationSchedule)

  const mapped = filteredBySchedule.map(session => ({
    ...session,
    participants: filterProgressAttendanceParticipantsForDisplay(session.participants, filters),
  }))

  if (!hasProgressAttendanceParticipantSearchFilters(filters)) return mapped
  return mapped.filter(session => session.participants.length > 0)
}

export function cloneProgressAttendanceParticipantRows(
  rows: ParticipatingIndividualProgressAttendanceParticipantRow[]
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  return rows.map(row => ({ ...row }))
}
