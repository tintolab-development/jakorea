import { mapApiApplicationStatusToApprovalStatus } from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  formatApplicantSchoolApprovalNotificationSentAt,
  type ApplicantPreferredScheduleBlock,
  type ApplicantPreferredScheduleSessionTime,
  type ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { PreferredScheduleBlock } from '@/shared/api/generated/dashboard/schemas/preferredScheduleBlock'
import type { PreferredScheduleSessionTime } from '@/shared/api/generated/dashboard/schemas/preferredScheduleSessionTime'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'

/** BE DTO는 OpenAPI 축소본보다 runtime 필드가 더 있을 수 있음 — 기존 투영 유지 */
type TrainedTeacherOrganizationApplicationDto = TrainedTeacherOrganizationApplicationResponse & {
  schoolName?: string | null
  organizationName?: string | null
  schoolId?: number
  organizationId?: number
  teacherMemberId?: number
  teacherEmailMasked?: string | null
  teacherEmail?: string | null
  submittedAt?: string | null
  createdAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  regionSido?: string | null
  regionSigungu?: string | null
  schoolSido?: string | null
  schoolSigungu?: string | null
  organizationSido?: string | null
  organizationSigungu?: string | null
  requestedClassCount?: number | null
  requestedStudentCount?: number | null
  addressDetail?: string | null
  applicationReason?: string | null
  otherRequests?: string | null
}

function formatResultNotificationSentAt(iso?: string | null): string | undefined {
  const trimmed = iso?.trim()
  if (!trimmed) return undefined
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return formatApplicantSchoolApprovalNotificationSentAt(parsed)
}

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function buildTimeRange(session: PreferredScheduleSessionTime): string {
  const explicit = session.timeRange?.trim()
  if (explicit) return explicit
  const start = session.startTime?.trim()
  const end = session.endTime?.trim()
  if (start && end) return `${start} ~ ${end}`
  return start || end || ''
}

function mapPreferredScheduleSession(
  session: PreferredScheduleSessionTime,
  fallbackIndex: number
): ApplicantPreferredScheduleSessionTime | null {
  const sessionIndex =
    typeof session.sessionIndex === 'number' && Number.isFinite(session.sessionIndex)
      ? session.sessionIndex
      : fallbackIndex
  const classPeriod = session.classPeriod?.trim() || ''
  const timeRange = buildTimeRange(session)
  if (!classPeriod && !timeRange) return null
  return {
    sessionIndex,
    classPeriod: classPeriod || '-',
    timeRange: timeRange || '-',
    startTime: session.startTime?.trim() || undefined,
    endTime: session.endTime?.trim() || undefined,
  }
}

/** OpenAPI PreferredScheduleBlock[] → FE 표시 blocks. null/omit → []. memo 파싱 없음. */
export function mapPreferredScheduleBlocks(
  blocks: PreferredScheduleBlock[] | null | undefined
): ApplicantPreferredScheduleBlock[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return []
  return blocks
    .map((block, index): ApplicantPreferredScheduleBlock | null => {
      const date = block.date?.trim() || ''
      if (!date) return null
      const sessionTimes = (block.sessionTimes ?? [])
        .map((session, sessionIndex) => mapPreferredScheduleSession(session, sessionIndex + 1))
        .filter((session): session is ApplicantPreferredScheduleSessionTime => session != null)
      const preferenceRank =
        typeof block.preferenceRank === 'number' && Number.isFinite(block.preferenceRank)
          ? block.preferenceRank
          : index + 1
      const sessionCount =
        typeof block.sessionCount === 'number' && Number.isFinite(block.sessionCount)
          ? block.sessionCount
          : sessionTimes.length
      return {
        preferenceRank,
        date,
        dayOfWeek: block.dayOfWeek?.trim() || '',
        sessionCount: Math.max(sessionCount, sessionTimes.length, 1),
        sessionTimes,
      }
    })
    .filter((block): block is ApplicantPreferredScheduleBlock => block != null)
    .sort((a, b) => a.preferenceRank - b.preferenceRank)
}

/** TT organization-application DTO → ApplicantSchoolRow */
export function mapTrainedTeacherOrganizationApplicationToRow(
  dto: TrainedTeacherOrganizationApplicationDto,
  index: number,
  programId: string
): ApplicantSchoolRow {
  const schoolName =
    dto.schoolName?.trim() || dto.organizationName?.trim() || dto.institutionName?.trim() || '기관명 없음'
  const memo = dto.desiredEducationScheduleMemo?.trim()
  const region =
    [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ') ||
    [dto.schoolSido, dto.schoolSigungu].filter(Boolean).join(' ') ||
    [dto.organizationSido, dto.organizationSigungu].filter(Boolean).join(' ') ||
    dto.regionName?.trim() ||
    ''
  const preferredScheduleBlocks = mapPreferredScheduleBlocks(dto.preferredScheduleBlocks)
  const educationGrade = dto.educationGrade?.trim() || ''
  const addressDetail = dto.addressDetail?.trim() || undefined
  const applicationReason = dto.applicationReason?.trim() || undefined
  /** BE 계약: otherRequests는 answers 투영만. memo로 덮지 않음 */
  const otherRequests = dto.otherRequests?.trim() || undefined
  const lectureRound = dto.lectureRound?.trim() || undefined
  const progressLabel = dto.progressLabel?.trim() || undefined
  const textbookName = dto.textbookName?.trim() || undefined
  const educationTarget = dto.educationTarget?.trim() || undefined
  const totalEducationRoundCount = toNonNegativeCount(dto.totalEducationRoundCount)
  const completedEducationRoundCount = toNonNegativeCount(dto.completedEducationRoundCount)
  const educationJournalCount = toNonNegativeCount(dto.educationJournalCount)
  const educationCompletionCount = toNonNegativeCount(dto.educationCompletionCount)
  const journalSubmitted =
    typeof dto.journalSubmitted === 'boolean'
      ? dto.journalSubmitted
      : educationJournalCount != null
        ? educationJournalCount > 0
        : undefined
  const teacherEmailMasked =
    dto.teacherEmailMasked?.trim() || dto.teacherEmail?.trim() || undefined
  const detailFields = {
    ...(addressDetail ? { addressDetail } : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(teacherEmailMasked ? { teacherEmail: teacherEmailMasked } : {}),
  }
  return {
    id: toId(dto.applicationId),
    no: index + 1,
    schoolName,
    region,
    educationGrade,
    classCount: dto.classCount ?? dto.requestedClassCount ?? 0,
    studentCount: dto.studentCount ?? dto.requestedStudentCount ?? 0,
    teacherName: dto.teacherName?.trim() || '-',
    teacherMemberId: dto.teacherMemberId,
    contact: dto.teacherPhoneMasked?.trim() || undefined,
    appliedAt: dto.submittedAt ?? dto.createdAt ?? undefined,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    programId: toId(dto.programId) || programId,
    desiredEducationPeriod: memo || undefined,
    preferredScheduleBlocks,
    educationTarget,
    lectureRound,
    progressLabel,
    totalEducationRoundCount,
    completedEducationRoundCount,
    textbookName,
    educationJournalCount,
    journalSubmitted,
    educationCompletionCount,
    approvalNotificationSentAt: formatResultNotificationSentAt(dto.resultNotificationSentAt),
    availableActions: dto.availableActions ?? [],
    detail: Object.keys(detailFields).length > 0 ? detailFields : undefined,
  }
}

function toNonNegativeCount(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.max(0, Math.trunc(value))
}
