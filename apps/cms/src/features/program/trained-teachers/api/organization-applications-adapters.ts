import {
  mapApiApplicationStatusToApprovalStatus,
  mapTextbookDeliveryStatusToBadge,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import {
  stripDefaultEducationSlotNameFromLabel,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  formatApplicantSchoolApprovalNotificationSentAt,
  type ApplicantPreferredScheduleBlock,
  type ApplicantPreferredScheduleSessionTime,
  type ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import type { PreferredScheduleBlock } from '@/shared/api/generated/dashboard/schemas/preferredScheduleBlock'
import type { TrainedTeacherOrganizationEducationSchedule } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationEducationSchedule'
import type { PreferredScheduleSessionTime } from '@/shared/api/generated/dashboard/schemas/preferredScheduleSessionTime'
import type { ProgramSchedule } from '@/types/domain'
import {
  formatTrainedTeacherClassPeriod,
  resolveTrainedTeacherBlockSessionCount,
} from '@/features/program/trained-teachers/lib/preferred-schedule-display'
import type { TrainedTeacherOrganizationApplicationDetailResponse } from './organization-applications-types'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'
import type { GradeBlock } from '@/shared/api/generated/dashboard/schemas/gradeBlock'

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
 * 날짜(블록)당 1행: `duration`에 그날 차시 수(시간 줄 수 — {@link resolveTrainedTeacherBlockSessionCount}),
 * `classNum`에 첫 차시 교시, `timeRange`에 첫~끝 시간.
 * (교시 라벨 classNum을 차시 수로 합산하면 안 됨 — company-school 목록 포맷터 계약)
 */
export function mapPreferredScheduleBlocksToSessions(
  blocks: ApplicantPreferredScheduleBlock[] | undefined
): ParticipatingSchoolSession[] | undefined {
  if (!blocks?.length) return undefined
  return blocks.map((block, index) => {
    const date = formatPreferredScheduleDateForSession(block.date)
    const dayOfWeek = block.dayOfWeek || ''
    const sessionCount = resolveTrainedTeacherBlockSessionCount(block)
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
      duration: sessionCount != null ? `${sessionCount}차시` : '',
      format: '',
      classNum: formatTrainedTeacherClassPeriod(firstTime?.classPeriod),
      timeRange,
      resolvedScheduleId:
        typeof block.scheduleId === 'number' &&
        Number.isFinite(block.scheduleId) &&
        block.scheduleId > 0
          ? Math.trunc(block.scheduleId)
          : null,
    }
  })
}

function dateFromProgramSchedule(schedule: ProgramSchedule): string {
  const raw = schedule.startDate?.trim() || schedule.startAt?.slice(0, 10) || ''
  return raw.slice(0, 10)
}

function dayOfWeekFromIsoDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00+09:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()] ?? ''
}

function timeFromDateTime(value: string | null | undefined): string {
  const raw = value?.trim() ?? ''
  if (!raw) return ''
  const time = raw.includes('T') ? raw.split('T')[1] : raw.split(' ')[1]
  return time?.slice(0, 5) ?? ''
}

function numericScheduleId(value: string | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) ? parsed : null
  }
  return null
}

const KST_DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** ISO date-time → KST `YYYY-MM-DD` / `HH:mm`. 오프셋 없는 값은 이미 KST로 본다. */
function kstDateTimeParts(value: string | null | undefined): { date: string; time: string } | null {
  const raw = value?.trim() ?? ''
  if (!raw) return null
  if (!/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(raw)) {
    const [date = '', time = ''] = raw.split(/[T ]/)
    return { date: date.slice(0, 10), time: time.slice(0, 5) }
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  const parts = Object.fromEntries(
    KST_DATE_TIME_FORMAT.formatToParts(parsed).map(part => [part.type, part.value])
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

/**
 * TT 상세 `educationSchedules[]`(승인으로 확정된 운영 일정) → 출석 세션.
 * 출석 조회 scheduleIds SSOT — 희망 일정(preferredScheduleBlocks)으로 채우거나 자르지 않는다.
 */
export function mapTrainedTeacherEducationSchedulesToSessions(
  schedules: ReadonlyArray<TrainedTeacherOrganizationEducationSchedule> | null | undefined
): ParticipatingSchoolSession[] {
  return (schedules ?? [])
    .filter(
      schedule =>
        typeof schedule.scheduleId === 'number' &&
        Number.isSafeInteger(schedule.scheduleId) &&
        schedule.scheduleId > 0
    )
    .map((schedule, index) => {
      const start = kstDateTimeParts(schedule.startAt)
      const end = kstDateTimeParts(schedule.endAt)
      const isoDate = start?.date ?? ''
      const startTime = start?.time ?? ''
      const endTime = end?.time ?? ''
      const scheduleStatus =
        typeof schedule.scheduleStatus === 'string' ? schedule.scheduleStatus.trim() : ''
      const hasRound =
        typeof schedule.round === 'number' && Number.isFinite(schedule.round)
      const strippedLabel = stripDefaultEducationSlotNameFromLabel(schedule.label)
      return {
        round:
          hasRound && schedule.round != null && schedule.round > 0
            ? Math.trunc(schedule.round)
            : index + 1,
        date: isoDate ? formatPreferredScheduleDateForSession(isoDate) : '',
        dayOfWeek: isoDate ? dayOfWeekFromIsoDate(isoDate) : '',
        duration: hasRound ? '' : strippedLabel || '',
        format: '',
        classNum: '',
        timeRange: startTime && endTime ? `${startTime}~${endTime}` : startTime || endTime,
        resolvedScheduleId: schedule.scheduleId,
        startAt: schedule.startAt ?? null,
        endAt: schedule.endAt ?? null,
        ...(scheduleStatus ? { deliveryScheduleStatus: scheduleStatus } : {}),
        ...(strippedLabel ? { educationScheduleLabel: strippedLabel } : {}),
      }
    })
}

/** 프로그램 상세 schedules[] → 교육 진행 일정 표시용 block. 신청 희망 일정은 사용하지 않는다. */
export function mapProgramSchedulesToPreferredScheduleBlocks(
  schedules: ReadonlyArray<ProgramSchedule> | undefined
): ApplicantPreferredScheduleBlock[] {
  const activeSchedules = (schedules ?? [])
    .filter(schedule => schedule.scheduleStatus === 'ACTIVE')
    .filter(schedule => dateFromProgramSchedule(schedule) !== '')
    .sort((a, b) => String(a.startAt ?? '').localeCompare(String(b.startAt ?? '')))

  const grouped = new Map<string, ProgramSchedule[]>()
  for (const schedule of activeSchedules) {
    const date = dateFromProgramSchedule(schedule)
    const current = grouped.get(date) ?? []
    current.push(schedule)
    grouped.set(date, current)
  }

  return [...grouped.entries()].map(([date, dateSchedules], index) => ({
    preferenceRank: index + 1,
    date,
    dayOfWeek: dayOfWeekFromIsoDate(date),
    sessionCount: dateSchedules.length,
    sessionTimes: dateSchedules.map((schedule, sessionIndex) => {
      const startTime = timeFromDateTime(schedule.startAt)
      const endTime = timeFromDateTime(schedule.endAt)
      // sessionIndex = 그날 차시 순서, classPeriod = 교시(학교 시간표 번호).
      // 프로그램 일정에는 교시 정보가 없다 — session_no(회차)를 차시·교시 자리에 넣지 않는다
      // (OpenAPI TrainedTeacherOrganizationEducationSchedule.round).
      return {
        sessionIndex: sessionIndex + 1,
        classPeriod: '',
        timeRange: startTime && endTime ? `${startTime} ~ ${endTime}` : startTime || endTime || '-',
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
      }
    }),
    scheduleId: numericScheduleId(dateSchedules[0]?.id),
    startAt: dateSchedules[0]?.startAt ?? null,
    endAt: dateSchedules[dateSchedules.length - 1]?.endAt ?? null,
    round: dateSchedules[0]?.sessionNo ?? null,
    label: toDisplayEducationScheduleName(dateSchedules[0]?.scheduleName) ?? null,
    scheduleStatus: 'ACTIVE',
  }))
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
  /** 신청 답 educationFormat (online|offline|hybrid). requestedEducationFormat과 동일 의미 */
  educationFormat?: string | null
  /** 상세 전용 — 신청 답 기본 정보의 교육 장소 코드 원문(inside|outside|custom). 구버전 응답은 없음 */
  educationPlace?: string | null
  /** 상세 전용 — 교육 장소 상세(직접 입력) */
  educationPlaceDetail?: string | null
  textbookId?: number | string | null
  textbookDeliveryStatus?: string | null
  textbookKits?: number | null
  textbookQuantity?: number | null
  kitCount?: number | null
  bookCount?: number | null
  gradeBlocks?: GradeBlock[] | null
}

function ownDeliveryStatus(source: object, key = 'textbookDeliveryStatus'): unknown {
  return Object.prototype.hasOwnProperty.call(source, key)
    ? (source as Record<string, unknown>)[key]
    : undefined
}

/**
 * TT 신청 교육 형태. ONLINE→온라인, OFFLINE→오프라인, HYBRID→혼합.
 * 이미 한글이면 그대로. 프로그램 공통 교육 형태로 채우지 않는다.
 */
export function formatTrainedTeacherRequestedEducationFormat(
  raw: string | null | undefined
): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed || trimmed === '-') return ''
  if (
    trimmed === '온라인' ||
    trimmed === '오프라인' ||
    trimmed === '혼합' ||
    trimmed === '온/오프라인' ||
    trimmed === '온·오프라인' ||
    trimmed === '온오프라인'
  ) {
    return trimmed === '온·오프라인' || trimmed === '온오프라인' ? '온/오프라인' : trimmed
  }
  switch (trimmed.toUpperCase()) {
    case 'ONLINE':
      return '온라인'
    case 'OFFLINE':
      return '오프라인'
    case 'HYBRID':
      return '혼합'
    default:
      return ''
  }
}

/** 홈페이지 신청 폼 교육 장소 코드 ↔ 라벨 (apps/platform `EDUCATION_PLACE_OPTIONS`와 같은 코드) */
const TRAINED_TEACHER_EDUCATION_PLACE_LABELS: Record<string, string> = {
  inside: '기관 안',
  outside: '기관 밖',
  custom: '기타',
}

/**
 * TT 신청 교육 장소 표시 — 「라벨」 + (상세 있으면 ` / 상세`). 둘 다 없으면 ''.
 * 모르는 코드는 원문 그대로 둔다(라벨을 지어내지 않음).
 */
export function formatTrainedTeacherEducationPlace(
  place: string | null | undefined,
  placeDetail: string | null | undefined
): string {
  const normalize = (raw: string | null | undefined): string => {
    const trimmed = typeof raw === 'string' ? raw.trim() : ''
    return trimmed === '-' ? '' : trimmed
  }
  const code = normalize(place)
  const detail = normalize(placeDetail)
  const label = code ? (TRAINED_TEACHER_EDUCATION_PLACE_LABELS[code.toLowerCase()] ?? code) : ''
  if (label && detail) return `${label} / ${detail}`
  return label || detail
}

/** TT 상세/목록 루트 키트·권수. gradeBlocks·프로그램 materials로 채우지 않는다. */
export function readTrainedTeacherTextbookKitFields(
  dto: TrainedTeacherOrganizationApplicationDto
): { textbookKits?: number; textbookQuantity?: number } {
  const textbookKits = toNonNegativeCount(dto.textbookKits) ?? toNonNegativeCount(dto.kitCount)
  const textbookQuantity =
    toNonNegativeCount(dto.textbookQuantity) ?? toNonNegativeCount(dto.bookCount)
  return {
    ...(textbookKits != null ? { textbookKits } : {}),
    ...(textbookQuantity != null ? { textbookQuantity } : {}),
  }
}

/** 루트 textbookDeliveryStatus 와이어 → 배지. null/빈값은 omit. NOT_APPLICABLE은 해당 없음. */
function mapStoredTextbookDeliveryToBadge(
  raw: unknown
): TextbookStatusKey | undefined {
  if (typeof raw !== 'string') return undefined
  const normalized = raw.trim()
  if (!normalized || normalized === '-') return undefined
  const mapped = mapTextbookDeliveryStatusToBadge(normalized)
  if (mapped !== 'not_applicable') return mapped
  const upper = normalized.toUpperCase()
  if (upper === 'NOT_APPLICABLE') return 'not_applicable'
  if (upper === 'BEFORE_SHIPPING' || upper === 'PREPARE') return 'preparing'
  if (upper === 'IN_TRANSIT' || upper === 'SHIP') return 'shipping'
  if (upper === 'DELIVERY_COMPLETED' || upper === 'DELIVER') return 'delivered'
  return undefined
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
  const classPeriod = session.classPeriod?.trim() ?? ''
  const timeRange = buildTimeRange(session)
  if (!classPeriod && !timeRange) return null
  return {
    sessionIndex,
    classPeriod,
    timeRange,
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
      // 차시 수 = 시간 줄 수. 기존 플랫폼 신청은 sessionCount에 교시 번호를 보낸 데이터가 있어
      // 줄이 있으면 줄 수를 쓰고, 줄이 없을 때만 sessionCount를 쓴다.
      const sessionCount =
        resolveTrainedTeacherBlockSessionCount({
          sessionCount:
            typeof block.sessionCount === 'number' && Number.isFinite(block.sessionCount)
              ? Math.trunc(block.sessionCount)
              : 0,
          sessionTimes,
        }) ?? 1
      return {
        preferenceRank,
        date,
        dayOfWeek: block.dayOfWeek?.trim() || '',
        sessionCount,
        sessionTimes,
        scheduleId:
          typeof block.scheduleId === 'number' && Number.isFinite(block.scheduleId)
            ? Math.trunc(block.scheduleId)
            : null,
        startAt: block.startAt?.trim() || null,
        endAt: block.endAt?.trim() || null,
        round:
          typeof block.round === 'number' && Number.isFinite(block.round)
            ? Math.trunc(block.round)
            : null,
        label: block.label?.trim() || null,
        scheduleStatus: block.scheduleStatus?.trim() || null,
      }
    })
    .filter((block): block is ApplicantPreferredScheduleBlock => block != null)
    .sort((a, b) => a.preferenceRank - b.preferenceRank)
}

/**
 * 교재 배송 배지. TT 진행 현황 SSOT는 루트 textbookDeliveryStatus만.
 * gradeBlocks[].textbookDeliveryStatus는 쓰지 않는다. 없으면 invent하지 않는다.
 */
export function readTrainedTeacherTextbookDeliveryStatus(
  dto: TrainedTeacherOrganizationApplicationDto
): TextbookStatusKey | undefined {
  if (!Object.prototype.hasOwnProperty.call(dto, 'textbookDeliveryStatus')) return undefined
  return mapStoredTextbookDeliveryToBadge(ownDeliveryStatus(dto))
}

/** 저장된 루트 상태 + 교재 선택 여부 → 화면 배지. GET null은 교재 있으면 배송 전. */
export function resolveTrainedTeacherTextbookDeliveryBadge(
  stored: TextbookStatusKey | undefined,
  hasSelectedTextbook: boolean
): TextbookStatusKey {
  if (
    stored === 'preparing' ||
    stored === 'shipping' ||
    stored === 'delivered' ||
    stored === 'not_applicable'
  ) {
    return stored
  }
  return hasSelectedTextbook ? 'preparing' : 'not_applicable'
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
    formatTrainedTeacherRequestedEducationFormat(
      dto.requestedEducationFormat ?? dto.educationFormat
    ) || undefined
  const educationLocation =
    formatTrainedTeacherEducationPlace(dto.educationPlace, dto.educationPlaceDetail) || undefined
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
  const textbookStatus = readTrainedTeacherTextbookDeliveryStatus(dto)
  const textbookKitFields = readTrainedTeacherTextbookKitFields(dto)
  const detailFields = {
    ...(addressDetail ? { addressDetail } : {}),
    ...(applicationReason ? { applicationReason } : {}),
    ...(otherRequests ? { otherRequests } : {}),
    ...(educationType ? { educationType } : {}),
    ...(educationLocation ? { educationLocation } : {}),
    ...(teacherEmailMasked ? { teacherEmail: teacherEmailMasked } : {}),
    ...(textbookId ? { textbookId } : {}),
  }
  return {
    id: toId(dto.applicationId),
    applicationStatus: dto.applicationStatus?.trim() || undefined,
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
    ...('gradeBlocks' in dto ? { gradeBlocks: dto.gradeBlocks ?? null } : {}),
    ...('educationSchedules' in dto
      ? { educationScheduleSessions: mapTrainedTeacherEducationSchedulesToSessions(dto.educationSchedules) }
      : {}),
    ...(sessions?.length ? { sessions } : {}),
    educationTarget,
    lectureRound,
    progressLabel,
    totalEducationRoundCount,
    completedEducationRoundCount,
    textbookName,
    ...(textbookStatus ? { textbookStatus } : {}),
    ...textbookKitFields,
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
