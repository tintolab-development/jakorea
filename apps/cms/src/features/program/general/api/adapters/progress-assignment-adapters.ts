import dayjs from 'dayjs'
import type {
  GeneralAssignmentSubmissionFileDto,
  GeneralAssignmentSubmissionListResponse,
  GeneralAssignmentSubmissionParticipantDto,
  GeneralAssignmentSubmissionScheduleDto,
} from '@/features/program/general/api/program-progress-api-client'
import {
  formatIndividualProgressAssignmentAffiliationGradeLabel,
  formatIndividualProgressAssignmentGenderBirthLabel,
} from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import {
  mapApiGenderToStudentGenderKey,
} from '@/features/program/general/api/adapters/student-roster-adapters'
import { STUDENT_GENDER_LABELS } from '@/features/program/general/model/school-detail-types'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentRemarkKind,
  ParticipatingIndividualProgressAssignmentSessionGroup,
  ParticipatingIndividualProgressAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import { parseParticipantSurveyViewKey } from '@/features/program/general/model/participating-individual-participants'

function formatDateLabel(value: string | null | undefined, pattern: string): string {
  if (!value?.trim()) return ''
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(pattern) : value.trim()
}

function formatPeriodLabel(start?: string | null, end?: string | null): string {
  const startLabel = formatDateLabel(start, 'YYYY.MM.DD')
  const endLabel = formatDateLabel(end, 'YYYY.MM.DD')
  if (startLabel && endLabel) return `${startLabel} ~ ${endLabel}`
  return startLabel || endLabel || '-'
}

function formatScheduleHeader(schedule: GeneralAssignmentSubmissionScheduleDto, index: number) {
  const round = schedule.sessionNo ?? index + 1
  const start = schedule.startAt ? dayjs(schedule.startAt) : null
  const end = schedule.endAt ? dayjs(schedule.endAt) : null
  const dateLabel =
    start?.isValid() === true
      ? start.format('YYYY.MM.DD')
      : (schedule.scheduleName ?? `${round}회차`)
  const timeLabel =
    start?.isValid() === true && end?.isValid() === true
      ? `${start.format('HH:mm')}~${end.format('HH:mm')}`
      : ''
  const filterValue = String(schedule.scheduleId ?? round)
  const filterLabel = `${round}회차 · ${dateLabel}${timeLabel ? ` ${timeLabel}` : ''}`
  return {
    round,
    filterValue,
    filterLabel,
    headerTitle: `${round}회차 과제`,
    headerScheduleSummary: filterLabel,
    headerPeriodRangeLabel: dateLabel,
    assignmentPeriodLabel: formatPeriodLabel(
      schedule.assignmentPeriodStart,
      schedule.assignmentPeriodEnd
    ),
    headerPrefix: `${round}회차`,
  }
}

function mapGenderLabel(gender?: string | null): string {
  const key = mapApiGenderToStudentGenderKey(gender)
  if (key) return STUDENT_GENDER_LABELS[key]
  return gender?.trim() || '-'
}

function mapBirthLabel(birthDate?: string | null): string {
  return formatDateLabel(birthDate, 'YYYY.MM.DD') || '-'
}

function mapRemarkKind(
  kind: string | null | undefined
): ParticipatingIndividualProgressAssignmentRemarkKind {
  const normalized = (kind ?? '').trim().toUpperCase()
  if (normalized === 'DEADLINE_MISSED') return 'deadline_missed'
  if (normalized === 'REVISION_SUBMITTED') return 'revision_submitted'
  if (normalized === 'FEEDBACK_DELIVERED') return 'feedback_delivered'
  return 'none'
}

function mapSubmission(
  status: string | null | undefined,
  files: GeneralAssignmentSubmissionFileDto[]
): ParticipatingIndividualProgressAssignmentSubmission {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'SCHEDULED') return { kind: 'scheduled' }
  if (normalized === 'SUBMITTED') {
    const [first, second] = files
    const fileName = first?.originalFileName?.trim() || '제출 파일'
    return {
      kind: 'submitted',
      fileName,
      href: '#',
      fileObjectId: first?.fileObjectId,
      downloadable: first?.downloadable === true,
      secondaryFileName: second?.originalFileName?.trim() || undefined,
      secondaryHref: second ? '#' : undefined,
      secondaryFileObjectId: second?.fileObjectId,
      secondaryDownloadable: second?.downloadable === true,
    }
  }
  return { kind: 'not_submitted' }
}

function mapParticipantRow(
  participant: GeneralAssignmentSubmissionParticipantDto
): ParticipatingIndividualProgressAssignmentParticipantRow {
  const participantId = String(participant.participantId ?? '')
  const affiliation = participant.affiliation?.trim() || participant.organizationName?.trim() || '-'
  const educationGrade = participant.grade?.trim() || '-'
  return {
    id: `asgn-${participantId}`,
    participantId,
    name: participant.memberName?.trim() || `참여자 ${participantId}`,
    genderBirthLabel: formatIndividualProgressAssignmentGenderBirthLabel(
      mapGenderLabel(participant.gender),
      mapBirthLabel(participant.birthDate)
    ),
    affiliationGradeLabel: formatIndividualProgressAssignmentAffiliationGradeLabel(
      affiliation,
      educationGrade
    ),
    affiliation,
    educationGrade,
    submission: mapSubmission(participant.submissionStatus, participant.files ?? []),
    remarkKind: mapRemarkKind(participant.remarkKind),
    remarkDateLabel: formatDateLabel(participant.remarkAt, 'YY.MM.DD') || undefined,
    surveyResponse: parseParticipantSurveyViewKey(participant.surveyResponse),
    satisfactionResponse: parseParticipantSurveyViewKey(participant.satisfactionResponse),
  }
}

export function buildProgressAssignmentSessionsFromRemote(
  data: GeneralAssignmentSubmissionListResponse
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  return (data.items ?? [])
    .filter(schedule => schedule.scheduleId != null)
    .map((schedule, index) => {
      const header = formatScheduleHeader(schedule, index)
      return {
        id: String(schedule.scheduleId),
        ...header,
        participants: (schedule.participants ?? []).map(mapParticipantRow),
      }
    })
}
