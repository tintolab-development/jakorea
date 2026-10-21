import dayjs from 'dayjs'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
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
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'

function formatDateLabel(value: string | null | undefined, pattern: string): string {
  if (!value?.trim()) return ''
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(pattern) : value.trim()
}

function formatPeriodLabel(start?: string | null, end?: string | null): string {
  const startDay = start?.trim() ? dayjs(start) : null
  const endDay = end?.trim() ? dayjs(end) : null
  if (startDay?.isValid() && endDay?.isValid()) {
    return formatCmsScheduleDisplayLabel(
      `${startDay.format('YYYY-MM-DD')} ~ ${endDay.format('YYYY-MM-DD')}`
    )
  }
  const startLabel = formatDateLabel(start, 'YYYY-MM-DD')
  const endLabel = formatDateLabel(end, 'YYYY-MM-DD')
  if (startLabel && endLabel) {
    return formatCmsScheduleDisplayLabel(`${startLabel} ~ ${endLabel}`)
  }
  const single = startLabel || endLabel
  return single ? formatCmsScheduleDisplayLabel(single) : '-'
}

function formatScheduleHeader(schedule: GeneralAssignmentSubmissionScheduleDto, index: number) {
  const round = schedule.sessionNo ?? index + 1
  const start = schedule.startAt ? dayjs(schedule.startAt) : null
  const end = schedule.endAt ? dayjs(schedule.endAt) : null
  const hasTimeRange = start?.isValid() === true && end?.isValid() === true
  // 응답에 종일 여부가 없어 시작·종료가 모두 자정이면 종일 회차로 보고 시간을 생략한다.
  const isAllDay =
    hasTimeRange && start.format('HH:mm') === '00:00' && end.format('HH:mm') === '00:00'
  const dateLabel =
    start?.isValid() === true
      ? formatCmsScheduleDisplayLabel(
          isAllDay || end?.isValid() !== true
            ? start.format('YYYY-MM-DD')
            : end.isSame(start, 'day')
              ? `${start.format('YYYY-MM-DD HH:mm')} ~ ${end.format('HH:mm')}`
              : `${start.format('YYYY-MM-DD HH:mm')} ~ ${end.format('YYYY-MM-DD HH:mm')}`
        )
      : (schedule.scheduleName ?? `${round}회차`)
  const periodLabel =
    start?.isValid() === true
      ? formatCmsScheduleDisplayLabel(
          end?.isValid() === true && !start.isSame(end, 'day')
            ? `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
            : start.format('YYYY-MM-DD')
        )
      : dateLabel
  const filterValue = String(schedule.scheduleId ?? round)
  const filterLabel = `${round}회차 · ${dateLabel}`
  return {
    round,
    filterValue,
    filterLabel,
    headerTitle: `${round}회차 과제`,
    headerScheduleSummary: filterLabel,
    headerPeriodRangeLabel: periodLabel,
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
  return toDisplayGender(gender)
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
