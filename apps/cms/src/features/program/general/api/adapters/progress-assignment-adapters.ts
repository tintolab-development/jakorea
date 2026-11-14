import {
  formatBirthDisplayWithManAge,
  toPolicyMaskedBirthDisplay,
} from '@/features/user/api/format-gender-birth-display'
import { readParticipantManAge } from '@/features/program/general/api/adapters/participant-man-age'
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
import { shouldHideGiveUpParticipantFromSchedule } from '@/features/program/general/lib/general-progress-give-up-visibility'
import { buildGeneralProgressSessionTableHeader } from '@/features/program/general/lib/general-progress-session-table-header'
import { resolveSchoolDetailAttendanceSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import {
  isGeneralScheduleSingleDateProgram,
  resolveGeneralScheduleSingleDateDetailName,
} from '@/features/program/general/lib/general-progress-date-schedule-lead'
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
import { toGenderLabelOrRaw } from '@/features/user/api/map-member-gender-birth'
import { isGeneralProgressEducationSessionSchedule } from '@/features/program/general/lib/general-progress-education-session-schedule'
import { resolveEducationProgressFromScheduleBounds } from '@/features/program/general/lib/dashboard-schedule-delivery-status'

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

/** BE `assignmentPeriodStart/End` only — no curriculum/index remapping. */
function resolveAssignmentPeriodLabel(schedule: GeneralAssignmentSubmissionScheduleDto): string {
  return formatPeriodLabel(schedule.assignmentPeriodStart, schedule.assignmentPeriodEnd)
}

function isAssignmentEnabledSchedule(schedule: GeneralAssignmentSubmissionScheduleDto): boolean {
  return schedule.assignmentEnabled !== false
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
  const scheduleDirect = isGeneralScheduleSingleDateProgram(program)
  const leadLabel =
    program && scheduleDirect
      ? resolveGeneralScheduleSingleDateDetailName(program, schedule)
      : program
        ? resolveSchoolDetailAttendanceSessionLeadLabel(program, round, {
            curriculumSessionCount: (schedule as { curriculumSessionCount?: number | null })
              .curriculumSessionCount,
          })
        : `${round}회차`
  const built = buildGeneralProgressSessionTableHeader({
    round,
    leadLabel,
    scheduleName: schedule.scheduleName,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    allDay: isAllDay,
    program,
    scheduleDirect,
  })
  return {
    round,
    filterValue: String(schedule.scheduleId ?? round),
    filterLabel: built.filterLabel,
    headerTitle: built.headerTitle,
    headerDateLabel: built.dateLabel,
    headerScheduleSummary: built.headerScheduleSummary,
    headerPeriodRangeLabel: built.headerPeriodRangeLabel,
    assignmentPeriodLabel: resolveAssignmentPeriodLabel(schedule),
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
  return toGenderLabelOrRaw(gender) ?? '-'
}

function mapBirthLabel(birthDate?: string | null, age?: number | null): string {
  // BE 마스킹(yyyy-**-**)은 정책 표기(yyyy.**.**) — 날짜 파서에 넣지 않는다.
  // 만 나이는 서버 age가 있을 때만 붙인다(CMS 표기 YYYY.**.** (만 NN세)).
  const masked = toPolicyMaskedBirthDisplay(birthDate)
  if (masked && masked !== (birthDate?.trim() ?? '')) {
    return formatBirthDisplayWithManAge(birthDate, { age })
  }
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
    const mappedFiles = files.map(file => ({
      fileName: file.fileName?.trim() || file.originalFileName?.trim() || '',
      href: '#',
      fileObjectId: file.fileObjectId,
      downloadable: file.downloadable === true,
    }))
    const mappedItems: ParticipatingIndividualProgressAssignmentSubmissionItem[] = [
      ...mappedFiles.map(file => ({ ...file, kind: 'file' as const })),
      ...links.flatMap(link => {
        const url = link.url?.trim()
        if (!url) return []
        return [{ kind: 'link' as const, fileName: link.displayName?.trim() || url, href: url }]
      }),
    ]
    const [first, second] = mappedFiles
    return {
      kind: 'submitted',
      files: mappedFiles,
      items: mappedItems,
      fileName: first?.fileName || '',
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

function readAssignmentFormResponseId(
  participant: GeneralAssignmentSubmissionParticipantDto
): number | undefined {
  const raw = participant.formResponseId ?? participant.submissionId
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : undefined
}

function mapParticipantRow(
  participant: GeneralAssignmentSubmissionParticipantDto
): ParticipatingIndividualProgressAssignmentParticipantRow {
  const assignmentFormResponseId = readAssignmentFormResponseId(participant)
  // BE N7: 행 루트 `formResponseId` 키가 항상 온다(미제출 null). 키 자체가 없으면 구버전 응답
  const assignmentFeedbackFieldsProvided = Object.prototype.hasOwnProperty.call(
    participant,
    'formResponseId'
  )
  const participantId = String(participant.participantId ?? '')
  const affiliation = participant.affiliation?.trim() || participant.organizationName?.trim() || '-'
  const educationGrade = participant.grade?.trim() || '-'
  return {
    id: `asgn-${participantId}`,
    participantId,
    name: participant.memberName?.trim() || `참여자 ${participantId}`,
    genderBirthLabel: formatIndividualProgressAssignmentGenderBirthLabel(
      mapGenderLabel(participant.gender),
      mapBirthLabel(participant.birthDate, readParticipantManAge(participant))
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
    ...(assignmentFormResponseId != null ? { assignmentFormResponseId } : {}),
    ...(assignmentFeedbackFieldsProvided ? { assignmentFeedbackFieldsProvided: true } : {}),
    ...(typeof participant.hasFeedback === 'boolean'
      ? { assignmentHasFeedback: participant.hasFeedback }
      : {}),
  }
}

function mapScheduleGroup(
  schedule: GeneralAssignmentSubmissionScheduleDto,
  index: number,
  options?: {
    program?: Program | null
    giveUpById?: Map<string, GiveUpParticipantLookup>
  }
): ParticipatingIndividualProgressAssignmentSessionGroup {
  const header = formatScheduleHeader(schedule, index, options?.program)
  const giveUpById = options?.giveUpById ?? new Map()
  return {
    id: String(schedule.scheduleId),
    ...header,
    scheduleEducationProgress: resolveEducationProgressFromScheduleBounds({
      startAt: schedule.startAt,
      endAt: schedule.endAt,
    }),
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

  // Render only BE assignment-submissions items keyed by scheduleId.
  // Do not invent/remap schedules from dashboard schedules or curriculum index.
  return (data.items ?? [])
    .filter(isGeneralProgressEducationSessionSchedule)
    .filter(isAssignmentEnabledSchedule)
    .map((schedule, index) =>
      mapScheduleGroup(schedule, index, { program: options?.program, giveUpById })
    )
}
