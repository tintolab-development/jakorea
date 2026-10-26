import dayjs from 'dayjs'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { Program } from '@/types/domain'
import type {
  GeneralAssignmentSubmissionFileDto,
  GeneralAssignmentSubmissionLinkDto,
  GeneralAssignmentSubmissionListResponse,
  GeneralAssignmentSubmissionParticipantDto,
  GeneralAssignmentSubmissionScheduleDto,
} from '@/features/program/general/api/program-progress-api-client'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { shouldHideGiveUpParticipantFromSchedule } from '@/features/program/general/lib/general-progress-give-up-visibility'
import { buildGeneralProgressSessionTableHeader } from '@/features/program/general/lib/general-progress-session-table-header'
import { resolveSchoolDetailAttendanceSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
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
  ParticipatingIndividualProgressAssignmentSubmissionItem,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'
import { parseParticipantSurveyViewKey } from '@/features/program/general/model/participating-individual-participants'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import { isGeneralProgressEducationSessionSchedule } from '@/features/program/general/lib/general-progress-education-session-schedule'

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
  return single ? formatCmsScheduleDisplayLabel(single) : ''
}

function resolveAssignmentPeriodLabel(
  schedule: GeneralAssignmentSubmissionScheduleDto,
  round: number,
  program?: Program | null
): string {
  const fromApi = formatPeriodLabel(schedule.assignmentPeriodStart, schedule.assignmentPeriodEnd)
  if (fromApi) return fromApi
  const common = program ? resolveGeneralProgramCommonInfo(program) : null
  const fromCurriculum = common?.curriculumSessions?.[round - 1]?.assignmentPeriod?.trim()
  if (fromCurriculum) return formatCmsScheduleDisplayLabel(fromCurriculum)
  const fromDetail = common?.scheduleDetails?.[round - 1]?.assignmentPeriod?.trim()
  if (fromDetail) return formatCmsScheduleDisplayLabel(fromDetail)
  return ''
}

function formatScheduleHeader(
  schedule: GeneralAssignmentSubmissionScheduleDto,
  index: number,
  program?: Program | null
) {
  const round = schedule.sessionNo ?? index + 1
  const start = schedule.startAt ? dayjs(schedule.startAt) : null
  const end = schedule.endAt ? dayjs(schedule.endAt) : null
  const hasTimeRange = start?.isValid() === true && end?.isValid() === true
  const isAllDay =
    hasTimeRange && start.format('HH:mm') === '00:00' && end.format('HH:mm') === '00:00'
  const leadLabel = program
    ? resolveSchoolDetailAttendanceSessionLeadLabel(program, round)
    : `${round}회차`
  const built = buildGeneralProgressSessionTableHeader({
    round,
    leadLabel,
    scheduleName: schedule.scheduleName,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    allDay: isAllDay,
    program,
  })
  return {
    round,
    filterValue: String(schedule.scheduleId ?? round),
    filterLabel: built.filterLabel,
    headerTitle: built.headerTitle,
    headerDateLabel: built.dateLabel,
    headerScheduleSummary: built.headerScheduleSummary,
    headerPeriodRangeLabel: built.headerPeriodRangeLabel,
    assignmentPeriodLabel: resolveAssignmentPeriodLabel(schedule, round, program),
    headerPrefix: built.headerPrefix,
  }
}

type GiveUpParticipantLookup = {
  participantId?: number
  giveUpAt?: string | null
  participantStatus?: string | null
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
  files: GeneralAssignmentSubmissionFileDto[],
  links: GeneralAssignmentSubmissionLinkDto[]
): ParticipatingIndividualProgressAssignmentSubmission {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'SCHEDULED') return { kind: 'scheduled' }
  if (normalized === 'SUBMITTED') {
    const mappedFiles = files.map((file, index) => ({
      fileName: file.originalFileName?.trim() || `제출 파일${index > 0 ? ` ${index + 1}` : ''}`,
      href: '#',
      fileObjectId: file.fileObjectId,
      downloadable: file.downloadable === true,
    }))
    const mappedItems: ParticipatingIndividualProgressAssignmentSubmissionItem[] = [
      ...mappedFiles.map(file => ({ ...file, kind: 'file' as const })),
      ...links.flatMap(link => {
        const url = link.url?.trim()
        return url ? [{ kind: 'link' as const, fileName: url, href: url }] : []
      }),
    ]
    const [first, second] = mappedFiles
    const fileName = first?.fileName || '제출 파일'
    return {
      kind: 'submitted',
      files: mappedFiles,
      items: mappedItems,
      fileName: first?.fileName || fileName,
      href: first?.href || '#',
      fileObjectId: first?.fileObjectId,
      downloadable: first?.downloadable === true,
      secondaryFileName: second?.fileName,
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
    submission: mapSubmission(
      participant.submissionStatus,
      participant.files ?? [],
      participant.links ?? []
    ),
    remarkKind: mapRemarkKind(participant.remarkKind),
    remarkDateLabel: formatDateLabel(participant.remarkAt, 'YY.MM.DD') || undefined,
    surveyResponse: parseParticipantSurveyViewKey(participant.surveyResponse),
    satisfactionResponse: parseParticipantSurveyViewKey(participant.satisfactionResponse),
  }
}

export function buildProgressAssignmentSessionsFromRemote(
  data: GeneralAssignmentSubmissionListResponse,
  options?: {
    program?: Program | null
    giveUpParticipants?: GiveUpParticipantLookup[] | null
  }
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  const giveUpById = new Map(
    (options?.giveUpParticipants ?? [])
      .filter(item => item.participantId != null)
      .map(item => [String(item.participantId), item] as const)
  )
  return (data.items ?? [])
    .filter(isGeneralProgressEducationSessionSchedule)
    .map((schedule, index) => {
      const header = formatScheduleHeader(schedule, index, options?.program)
      return {
        id: String(schedule.scheduleId),
        ...header,
        participants: (schedule.participants ?? [])
          .filter(participant => {
            const lookup = giveUpById.get(String(participant.participantId))
            return !shouldHideGiveUpParticipantFromSchedule({
              giveUpAt: participant.giveUpAt ?? lookup?.giveUpAt,
              participantStatus: participant.participantStatus ?? lookup?.participantStatus,
              scheduleStartAt: schedule.startAt,
            })
          })
          .map(mapParticipantRow),
      }
    })
}
