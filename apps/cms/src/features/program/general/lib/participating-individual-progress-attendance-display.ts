import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { ProgramAttendanceStatusTextKind } from '@/features/program/shared/ui/program-attendance-status-text'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_STATUS_LABELS,
  type ParticipatingIndividualProgressAttendanceFilters,
  type ParticipatingIndividualProgressAttendanceParticipantRow,
  type ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

export function formatIndividualProgressAttendanceGenderBirthLabel(
  gender?: string,
  birthDate?: string
): string {
  const genderLabel = gender?.trim() || '-'
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
  if (!contact?.trim()) return '-'
  return MASKING_POLICY.phone(contact) || contact
}

export function maskProgressAttendanceEmail(email?: string): string {
  if (!email?.trim()) return '-'
  return MASKING_POLICY.email(email) || email
}

export function toProgressAttendanceStatusTextKind(
  status: ParticipatingIndividualProgressAttendanceStatus
): ProgramAttendanceStatusTextKind {
  if (status === 'absent') return 'absent'
  if (status === 'late') return 'late'
  if (status === 'excused_absence') return 'excused_absence'
  return 'present'
}

export function resolveProgressAttendanceStatusLabel(
  row: Pick<
    ParticipatingIndividualProgressAttendanceParticipantRow,
    'attendanceStatus' | 'lateTime'
  >
): string {
  if (row.attendanceStatus === 'late' && row.lateTime?.trim()) {
    return `지각 (${row.lateTime.trim()})`
  }
  return PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_STATUS_LABELS[row.attendanceStatus]
}

export function resolveProgressAttendanceRemark(
  row: Pick<ParticipatingIndividualProgressAttendanceParticipantRow, 'attendanceStatus' | 'remark'>
): string {
  if (row.attendanceStatus === 'excused_absence') {
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

  if (
    filters.attendanceStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL &&
    row.attendanceStatus !== filters.attendanceStatus
  ) {
    return false
  }

  return true
}

export function filterProgressAttendanceParticipantsForDisplay(
  participants: ParticipatingIndividualProgressAttendanceParticipantRow[],
  filters: ParticipatingIndividualProgressAttendanceFilters
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  const hasParticipantFilter =
    filters.participantName.trim() !== '' ||
    filters.affiliation.trim() !== '' ||
    filters.educationGrade !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL ||
    filters.attendanceStatus !== PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL

  if (!hasParticipantFilter) return participants
  return participants.filter(row => participantMatchesProgressAttendanceFilters(row, filters))
}

export function cloneProgressAttendanceParticipantRows(
  rows: ParticipatingIndividualProgressAttendanceParticipantRow[]
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  return rows.map(row => ({ ...row }))
}
