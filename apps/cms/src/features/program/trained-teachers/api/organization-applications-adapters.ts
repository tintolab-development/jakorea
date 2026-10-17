import {
  formatRequestedEducationFormat,
  mapApiApplicationStatusToApprovalStatus,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatApplicantSchoolApprovalNotificationSentAt,
  type ApplicantPreferredScheduleBlock,
  type ApplicantPreferredScheduleSessionTime,
  type ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { PreferredScheduleBlock } from '@/shared/api/generated/dashboard/schemas/preferredScheduleBlock'
import type { PreferredScheduleSessionTime } from '@/shared/api/generated/dashboard/schemas/preferredScheduleSessionTime'
import type { TrainedTeacherOrganizationApplicationDetailResponse } from './organization-applications-types'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'

/** YYYY-MM-DD → YYYY.MM.DD (목록 세션 표시용). 이미 점 구분 문자열이면 공백만 정리. */
function formatPreferredScheduleDateForSession(raw: string): string {
  const trimmed = raw.trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (iso) return `${iso[1]}.${iso[2]}.${iso[3]}`
  return trimmed.replace(/\s+/g, '')
}

function normalizeSessionTimeRange(timeRange: string): string {
  return timeRange.replace(/\s*~\s*/, '~').trim()
}

/**
 * TT SoT `preferredScheduleBlocks` → 목록 컬럼이 읽는 `sessions`.
 * 날짜(블록)당 1행: `duration`에 총 차시, `timeRange`에 첫~끝 시간.
 * (교시 라벨 classNum을 차시 수로 합산하면 안 됨 — company-school 목록 포맷터 계약)
 */
export function mapPreferredScheduleBlocksToSessions(
  blocks: ApplicantPreferredScheduleBlock[] | undefined
): ParticipatingSchoolSession[] | undefined {
  if (!blocks?.length) return undefined
  return blocks.map((block, index) => {
    const date = formatPreferredScheduleDateForSession(block.date)
    const dayOfWeek = block.dayOfWeek || ''
    const sessionCount = Math.max(block.sessionCount, block.sessionTimes.length, 1)
    const firstTime = block.sessionTimes[0]
    const lastTime = block.sessionTimes[block.sessionTimes.length - 1]
    const startRaw = firstTime?.timeRange?.split('~')[0]?.trim() || firstTime?.startTime?.trim() || ''
    const endRaw =
      lastTime?.timeRange?.split('~')[1]?.trim() ||
      lastTime?.endTime?.trim() ||
      lastTime?.timeRange?.split('~')[0]?.trim() ||
      ''
    const timeRange =
      startRaw && endRaw
        ? normalizeSessionTimeRange(`${startRaw}~${endRaw}`)
        : normalizeSessionTimeRange(firstTime?.timeRange || '')
    return {
      round: index + 1,
      date,
      dayOfWeek,
      duration: `${sessionCount}차시`,
      format: '',
      classNum: firstTime?.classPeriod || '',
      timeRange,
    }
  })
}

/** BE DTO는 OpenAPI 축소본보다 runtime 필드가 더 있을 수 있음 — 기존 투영 유지 */
type TrainedTeacherOrganizationApplicationDto = (
  | TrainedTeacherOrganizationApplicationDetailResponse
  | TrainedTeacherOrganizationApplicationResponse
) & {
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
  requestedEducationFormat?: string | null
  textbookId?: number | string | null
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
  const sessions = mapPreferredScheduleBlocksToSessions(preferredScheduleBlocks)
  const educationGrade = formatApplicantGradeLabel(dto.educationGrade)
  const addressDetail = dto.addressDetail?.trim() || undefined
  const applicationReason = dto.applicationReason?.trim() || undefined
  /** BE 계약: otherRequests는 answers 투영만. memo로 덮지 않음 */
  const otherRequests = dto.otherRequests?.trim() || undefined
  const educationType =
    formatRequestedEducationFormat(dto.requestedEducationFormat) || undefined
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
  const textbookId = dto.textbookId == null ? undefined : String(dto.textbookId)
  const detailFields = {
    ...(addressDetail ? { addressDetail } : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(educationType ? { educationType } : {}),
    ...(teacherEmailMasked ? { teacherEmail: teacherEmailMasked } : {}),
    ...(textbookId ? { textbookId } : {}),
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
    organizationId: dto.organizationId ?? dto.schoolId,
    contact: dto.teacherPhoneMasked?.trim() || undefined,
    appliedAt: dto.submittedAt ?? dto.createdAt ?? undefined,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    programId: toId(dto.programId) || programId,
    desiredEducationPeriod: memo || undefined,
    preferredScheduleBlocks,
    ...(sessions?.length ? { sessions } : {}),
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
    activityWithdrawn:
      dto.activityWithdrawn === true || Boolean(dto.giveUpAt?.trim()),
    ...(dto.giveUpAt?.trim() ? { giveUpAt: dto.giveUpAt.trim() } : {}),
    ...(dto.giveUpStopScheduleId != null && Number.isFinite(dto.giveUpStopScheduleId)
      ? { giveUpStopScheduleId: dto.giveUpStopScheduleId }
      : {}),
    detail: Object.keys(detailFields).length > 0 ? detailFields : undefined,
  }
}

function formatApplicantGradeLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  if (trimmed.endsWith('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

function toNonNegativeCount(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.max(0, Math.trunc(value))
}
