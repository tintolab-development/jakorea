import type {
  AdminProgramListItemDto,
} from '@/features/program/general/api/programs-api-client'
import { omitNullRecordValues } from '@/shared/lib/openapi-null'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import { withRecruitmentCreateMedia } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { ProgramCreateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programCreateRequestEducationStructure'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import { ProgramRecruitmentRequestRecruitmentType } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitmentType'
import { ProgramRecruitmentRequestRecruitTerm } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitTerm'
import { ProgramRecruitmentRequestStatus } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestStatus'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type {
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
  ProgramRecruitmentWindow,
  GeneralProgramCommonInfoExtension,
} from '@/types/domain'
import type { Status } from '@/types/index'
import {
  mapPeriodStatusToLifecycle,
  normalizeUjatProgressStatus,
  resolveUjatProgressStatus,
} from '@/features/program/ujat/lib/normalize-ujat-progress-status'
import { parseDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import {
  buildProgramSponsorAssignmentsWire,
  encodeSponsorManagerContactRef,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import { isSponsorContactUnselected } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { patchTouchesProgramSponsors } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import type { ProgramUpdateRequestTargetLevelsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestTargetLevelsItem'
import {
  stripUnselectedUjatSponsorContactsFromOverlay,
  ujatSponsorManagerContactIdsForApi,
} from '@/features/program/ujat/lib/ujat-sponsor-contact-api-payload'
import { stripRegistrationOverlayDebugKeys } from '@/features/program/shared/lib/program-create-service-detail-json'
import { mapListParticipantRecruitment } from '@/features/program/shared/lib/format-recruitment-headcount'
import { applyResolvedAnnouncementTitle } from '@/features/program/shared/lib/public-program-title'
import { hydrateRecruitmentWindowsOntoProgram } from '@/features/program/shared/lib/hydrate-recruitment-windows'
import {
  omitProgramAuditNameFields,
  readProgramAuditNames,
} from '@/features/program/shared/lib/program-audit-names'
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
import { applyBusinessPeriodHistoriesFromDto } from '@/features/program/shared/lib/business-period-extend'
import {
  isRecruitmentStartLocked,
  toProgramRecruitmentWindows,
} from '@/features/program/shared/lib/program-edit-window'
import {
  attachRecruitmentRowIdentity,
  buildRecruitmentRowCopyRequests,
  mergeRecruitmentRowRequests,
  recruitmentRowIdentityRequests,
} from '@/features/program/shared/lib/recruitment-row-request'
import {
  resolveUjatRecruitAnnouncementTitle,
  resolveUjatRecruitDisplayProgram,
  type UjatRecruitDisplayKind,
} from '@/features/program/ujat/lib/ujat-recruit-display-program'
import {
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-overlay-keys'
import {
  normalizeProgramBusinessAreaValue,
  resolvePersistedProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  applyProgramMissingCommonStringFieldsToUpdateRequest,
  mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo,
  resolveOtherNotesFromProgramResponse,
} from '@/features/program/shared/lib/program-update-common-string-fields'
import { applySettlementPolicyToCommonInfo } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import { toOperationCalendarDate } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { assignProgramPaymentItemsToWriteRequest } from '@/features/program/shared/lib/wage-payment-item-request'
import { reconcileUjatRegistrationOverlayFromProgramResponse } from '@/features/program/ujat/lib/ujat-registration-basic-info-overlay-sync'
import {
  ujatPersistedSurveyMenuKeysFromItems,
} from '@/features/program/ujat/lib/registration-survey-items'
import {
  generalParticipantTypesFromUjatFlags,
  resolveUjatParticipantTypeFlags,
} from '@/features/program/ujat/lib/participant-type-flags'
import {
  parseRegistrationOverlay,
  parseServiceDetail,
  readUjatRegistrationOverlayFromProgram,
  parseUjatServiceDetailExtras,
  serializeServiceDetail,
  type RegistrationPersistSnapshot,
  type RegistrationSnapshot,
  type UjatServiceDetailExtras,
} from './service-detail'
import {
  applyStoredUjatTypedHalvesToOverlay,
  buildUjatTypedDetailForCreate,
  normalizeUjatTypedDetailForWrite,
  parseStoredUjatTypedDetail,
  ujatTypedDate,
  UJAT_TYPED_DETAIL_ROOT_KEY,
} from '@/features/program/ujat/lib/ujat-typed-detail'
import { resolveProgramListDeleteBlocked } from '@/features/program/shared/lib/program-delete-eligibility'
import { ujatHalfScheduleOverlayKeys } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { ujatEducationScheduleSettingsOverlayKeys } from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { type UjatRegionCapacityBySemesterState } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  stripUjatKpiWageCapacityOverlay,
  ujatKpiWageCapacityFromLegacyOverlay,
} from '@/features/program/ujat/lib/ujat-kpi-wage-capacity-typed'
import {
  stripUjatTypedLegacyOverlay,
  typedDetailFromUjatOverlay,
  type UjatTypedDetail,
} from './typed-detail-client'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

export type UjatProgramWithExtras = Program & {
  /** Primary serviceDetail extras — Semester 자식 없이 FULL_YEAR */
  ujatServiceDetailExtras?: UjatServiceDetailExtras
  /** 등록 폼 overlay — 상세 화면 SSOT. 세션 기본값으로 대체하지 않는다. */
  ujatRegistrationOverlay?: Record<string, unknown>
  /** Canonical UJAT Typed detail. Legacy overlay is only a compatibility projection. */
  ujatTypedDetail?: UjatTypedDetail
  periodStatus?: string
}

function now(): string {
  return new Date().toISOString()
}

function idOf(value: string | number | undefined): string {
  return value == null ? '' : String(value)
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function stringOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function stringArrayOf(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : []
}

function numberStringOf(value: unknown): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : undefined
}

function regionCapacityFromPrimaryExtras(
  value: unknown
): UjatRegionCapacityBySemesterState | undefined {
  const root = recordOf(value)
  if (!root) return undefined
  const result: UjatRegionCapacityBySemesterState = { h1: {}, h2: {} }
  const semesters = [
    ['h1', root?.FIRST_HALF] as const,
    ['h2', root?.SECOND_HALF] as const,
  ]

  for (const [half, raw] of semesters) {
    const semester = recordOf(raw)
    if (!semester) continue
    for (const [regionCode, rawValues] of Object.entries(semester)) {
      const values = recordOf(rawValues)
      if (!values) continue
      const region = listUjatEducationRegionsActive().find(
        item => item.key.toLowerCase() === regionCode.toLowerCase()
      )
      const regionName = region?.label ?? regionCode
      result[half][regionName] = {
        classCount: numberStringOf(values.maxSchools),
        volunteerCount: numberStringOf(values.maxVolunteers),
      }
    }
  }

  if (Object.keys(result.h1).length === 0 && Object.keys(result.h2).length === 0) return undefined
  return result
}

/** Primary UJAT calendar JSON → 등록 overlay 표시/수정 필드 */
function overlayFromPrimarySemesterCalendars(value: unknown): Record<string, unknown> {
  const root = recordOf(value)
  if (!root) return {}

  const result: Record<string, unknown> = {}
  const semesters = [
    ['h1', root.FIRST_HALF ?? root.firstHalf] as const,
    ['h2', root.SECOND_HALF ?? root.secondHalf] as const,
  ]

  for (const [half, raw] of semesters) {
    const calendar = recordOf(raw)
    if (!calendar) continue
    const keys = ujatHalfScheduleOverlayKeys(half)
    const blockedDates = stringArrayOf(calendar.blockedDates)
    const educationFridays = stringArrayOf(calendar.educationFridays)
    const preTrainingDate = stringOf(calendar.preTrainingDate)
    const closingDate = stringOf(calendar.closingDate)
    const eventDate = stringOf(calendar.eventDate)
    const eventStart = educationFridays[0] ?? eventDate
    const eventEnd = educationFridays.at(-1) ?? eventDate
    const regionKeys = stringArrayOf(calendar.educationRegionKeys ?? calendar.regions)
    const multi = (date: string | null) => ({
      rowIds: [0],
      // preTrainingDate/closingDate가 전 지역 공통이라는 정보만 있고
      // 지역별 매핑이 없으면 지역을 추정하지 않는다.
      regionByRow: { '0': regionKeys },
      dateByRow: { '0': date },
    })

    result[keys.preMulti] = multi(preTrainingDate)
    result[keys.eventRange] = { start: eventStart, end: eventEnd }
    result[keys.closingMulti] = multi(closingDate)

    const settingsKeys = ujatEducationScheduleSettingsOverlayKeys(half)
    result[settingsKeys.unavailableDates] = blockedDates
    result[settingsKeys.exclusion] = {
      excludeNone:
        calendar.none === true || calendar.mode === 'none' || calendar.blockedDatesNone === true,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: calendar.excludeHolidays === true,
    }
  }

  return result
}

function pickUjatScheduleOverlayKeys(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(
      ([key]) => key.startsWith('ujat.h1.') || key.startsWith('ujat.h2.')
    )
  )
}

function typedDetailHasScheduleRows(detail?: UjatTypedDetail): boolean {
  return (detail?.halfPlans ?? []).some(plan =>
    (plan.stages ?? []).some(stage => (stage.rows ?? []).length > 0)
  )
}

/** Instant·모집 창 시각 필드 — ISO 유지. Date는 toISOString. */
function dateValue(value: Date | string | undefined): string | undefined {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return value.toISOString()
  }
  if (typeof value !== 'string') return undefined
  return value.trim() ? value : undefined
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** ISO·날짜 문자열 → KST 달력일 YYYY-MM-DD. */
function kstCalendarDateKey(value: string): string | undefined {
  const text = value.trim()
  if (!text) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const ms = Date.parse(text)
  if (Number.isNaN(ms)) return undefined
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10)
}

/**
 * 모집 창 startAt/endAt — 날짜만(`YYYY-MM-DD`)이면 KST 하루 시작/끝 UTC ISO로 확장.
 * 이미 시각이 있는 Instant는 그대로 둔다(봉사자 행 기존 직렬화 유지).
 */
function recruitmentWindowInstant(
  value: Date | string | undefined,
  edge: 'start' | 'end'
): string | undefined {
  const raw = dateValue(value)
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw
  if (value instanceof Date) return value.toISOString()
  const dateKey = kstCalendarDateKey(raw)
  if (!dateKey) return raw
  const [y, m, d] = dateKey.split('-').map(Number)
  const ms =
    edge === 'start'
      ? Date.UTC(y, m - 1, d, 0, 0, 0, 0) - KST_OFFSET_MS
      : Date.UTC(y, m - 1, d, 23, 59, 59, 999) - KST_OFFSET_MS
  return new Date(ms).toISOString()
}

/**
 * BE LocalDate / 사업·운영 일자 — Asia/Seoul 달력일 `YYYY-MM-DD`.
 * Date·ISO instant는 UTC 날짜가 아니라 서울 날짜로 보낸다(하루 밀림 방지).
 */
function dateOnlyValue(value: Date | string | undefined): string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return ujatTypedDate(value) ?? undefined
  }
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return ujatTypedDate(trimmed) ?? trimmed
}

/** GET echo — 빈 title을 대표명·시드 문구로 채우지 않는다. */
function echoProgramManagementTitle(
  title: string | null | undefined,
  nameKo?: string | null
): string {
  if (typeof title === 'string') return title
  return typeof nameKo === 'string' ? nameKo : ''
}

function parsedMillis(value: string | undefined): number | undefined {
  if (!value) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : undefined
}

/**
 * 레거시 application* 는 사업 기간 안에 있을 때만 보낸다.
 * UJAT 기관·봉사 모집은 사업 시작 전이 정상 — 그때는 recruitments[]만 쓴다.
 */
function applicationDatesInsideBusiness(program: Program): {
  applicationStartDate?: string
  applicationEndDate?: string
} {
  const applicationStartDate = dateValue(program.applicationStartDate)
  const applicationEndDate = dateValue(program.applicationEndDate)
  const businessStart = parsedMillis(dateValue(program.startDate))
  const businessEnd = parsedMillis(dateValue(program.endDate))
  const applyStart = parsedMillis(applicationStartDate)
  const applyEnd = parsedMillis(applicationEndDate)
  if (!applicationStartDate || !applicationEndDate || applyStart == null || applyEnd == null) {
    return {}
  }
  if (businessStart != null && applyEnd < businessStart) return {}
  if (businessEnd != null && applyStart > businessEnd) return {}
  return { applicationStartDate, applicationEndDate }
}

function calendarDateInsideBusiness(date: string | undefined, program: Program): boolean {
  const day = toOperationCalendarDate(date)
  if (!day) return false
  const start = toOperationCalendarDate(dateOnlyValue(program.startDate))
  const end = toOperationCalendarDate(dateOnlyValue(program.endDate))
  if (start && day < start) return false
  if (end && day > end) return false
  return true
}

/**
 * BE PROGRAM_DATE_OUTSIDE_OPEN_PERIOD 는 recruitments[].operation* 도 검사한다.
 * 모집 창(startAt/endAt)은 사업 기간 밖이어도 행에 남기고, 운영일만 사업 기간 안일 때 보낸다.
 * 생략 시 생성 fallback 은 사업 시작·종료일.
 */
function pickOperationDatesInsideBusiness(
  program: Program,
  operationStartDate?: string,
  operationEndDate?: string
): { operationStartDate?: string; operationEndDate?: string } {
  const start = dateOnlyValue(operationStartDate)
  const end = dateOnlyValue(operationEndDate)
  return {
    ...(start && calendarDateInsideBusiness(start, program) ? { operationStartDate: start } : {}),
    ...(end && calendarDateInsideBusiness(end, program) ? { operationEndDate: end } : {}),
  }
}

function omitRecruitmentOperationDatesOutsideBusiness(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  if (rows == null) return rows
  return rows.map(row => {
    const allowed = pickOperationDatesInsideBusiness(
      program,
      row.operationStartDate,
      row.operationEndDate
    )
    const next = { ...row }
    if (next.operationStartDate && !allowed.operationStartDate) delete next.operationStartDate
    if (next.operationEndDate && !allowed.operationEndDate) delete next.operationEndDate
    return next
  })
}

function ujatVolunteerInterviewFields(
  program: Program,
  row?: ProgramRecruitmentWindow
): {
  interviewEnabled: true
  interviewStartAt?: string
  interviewEndAt?: string
} {
  const start = dateValue(row?.interviewStartAt ?? program.interviewStartDate)
  const end = dateValue(row?.interviewEndAt ?? program.interviewEndDate)
  return {
    interviewEnabled: true,
    ...(start ? { interviewStartAt: start } : {}),
    ...(end ? { interviewEndAt: end } : {}),
  }
}

function recruitmentRow(input: {
  recruitmentType: ProgramRecruitmentRequest['recruitmentType']
  targetType: string
  applicationType?: ProgramRecruitmentRequest['applicationType']
  startAt?: string
  endAt?: string
  operationStartDate?: string
  operationEndDate?: string
  maxCount?: number
  id?: number
  recruitTerm?: ProgramRecruitmentRequest['recruitTerm']
  interviewEnabled?: boolean
  interviewStartAt?: string
  interviewEndAt?: string
  source?: ProgramRecruitmentWindow
}): ProgramRecruitmentRequest {
  const source = input.source
  return {
    ...(input.id != null ? { id: input.id } : {}),
    recruitmentType: input.recruitmentType,
    targetType: input.targetType,
    ...(input.applicationType ? { applicationType: input.applicationType } : {}),
    ...(input.recruitTerm ? { recruitTerm: input.recruitTerm } : {}),
    status: ProgramRecruitmentRequestStatus.ACTIVE,
    ...(input.startAt ? { startAt: input.startAt } : {}),
    ...(input.endAt ? { endAt: input.endAt } : {}),
    ...(input.operationStartDate ? { operationStartDate: input.operationStartDate } : {}),
    ...(input.operationEndDate ? { operationEndDate: input.operationEndDate } : {}),
    ...(input.maxCount != null ? { maxCount: input.maxCount } : {}),
    selectionMethod: 'ADMIN_REVIEW',
    ...(input.interviewEnabled === true ? { interviewEnabled: true } : {}),
    ...(input.interviewStartAt ? { interviewStartAt: input.interviewStartAt } : {}),
    ...(input.interviewEndAt ? { interviewEndAt: input.interviewEndAt } : {}),
    ...(source?.announcementTitle != null ? { announcementTitle: source.announcementTitle } : {}),
    ...(source?.summary != null ? { summary: source.summary } : {}),
    ...(source?.programDescription != null ? { programDescription: source.programDescription } : {}),
    ...(source?.recruitmentGuide != null ? { recruitmentGuide: source.recruitmentGuide } : {}),
    ...(source?.applicationMethod != null ? { applicationMethod: source.applicationMethod } : {}),
    ...(source?.learningSupportContent != null
      ? { learningSupportContent: source.learningSupportContent }
      : {}),
    ...(source?.additionalContentHtml != null
      ? { additionalContentHtml: source.additionalContentHtml }
      : {}),
    ...(source?.remarks != null ? { remarks: source.remarks } : {}),
    ...(source?.contactName != null ? { contactName: source.contactName } : {}),
    ...(source?.contactPhone != null ? { contactPhone: source.contactPhone } : {}),
    ...(source?.contactEmail != null ? { contactEmail: source.contactEmail } : {}),
    ...(source?.otherMatters != null ? { otherMatters: source.otherMatters } : {}),
    ...(source?.announcementPublished != null
      ? { announcementPublished: source.announcementPublished }
      : {}),
    ...(source?.remarksNotApplicable != null
      ? { remarksNotApplicable: source.remarksNotApplicable }
      : {}),
    ...(source?.finalPassAnnouncementAt !== undefined
      ? { finalPassAnnouncementAt: source.finalPassAnnouncementAt }
      : {}),
    ...(input.recruitmentType === ProgramRecruitmentRequestRecruitmentType.VOLUNTEER
      ? {
          ...(source?.documentPassAnnouncementAt !== undefined
            ? { documentPassAnnouncementAt: source.documentPassAnnouncementAt }
            : {}),
          ...(source?.noticeExposureTiming !== undefined
            ? { noticeExposureTiming: source.noticeExposureTiming }
            : {}),
          ...(source?.volunteerTargets !== undefined
            ? { volunteerTargets: source.volunteerTargets }
            : {}),
          ...(source?.interviewConfig !== undefined
            ? { interviewConfig: source.interviewConfig }
            : {}),
        }
      : {}),
    ...(source?.contentRevision != null ? { expectedRevision: source.contentRevision } : {}),
  } as ProgramRecruitmentRequest
}

/**
 * 기관 + 봉사자 formBindings targetType과 맞출 canonical 모집 row.
 * BE `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 가 UJAT를 거절하면 서버에서 허용해야 한다.
 */
export function mapUjatProgramRecruitmentsToRequest(program: Program): ProgramRecruitmentRequest[] {
  const institution = (program.programRecruitments ?? []).find(
    row => (row.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
  )
  const institutionStart = recruitmentWindowInstant(
    institution?.startAt ?? program.applicationStartDate,
    'start'
  )
  const institutionEnd = recruitmentWindowInstant(
    institution?.endAt ?? program.applicationEndDate,
    'end'
  )
  const volunteers = (program.programRecruitments ?? [])
    .filter(row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER')
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(a.startAt ?? '')
      const bTime = Date.parse(b.startAt ?? '')
      return (Number.isNaN(aTime) ? Infinity : aTime) - (Number.isNaN(bTime) ? Infinity : bTime)
    })
  const h1 =
    volunteers.find(row => row.recruitTerm === 'FIRST_HALF') ??
    (volunteers.every(row => row.recruitTerm == null) ? volunteers[0] : undefined)
  const volunteerStart = recruitmentWindowInstant(
    h1?.startAt ?? program.volunteerApplicationStartDate,
    'start'
  )
  const volunteerEnd = recruitmentWindowInstant(
    h1?.endAt ?? program.volunteerApplicationEndDate,
    'end'
  )
  const rows = [
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.PARTICIPANT,
      targetType: 'ORGANIZATION',
      applicationType: 'ORGANIZATION',
      startAt: institutionStart,
      endAt: institutionEnd,
      operationStartDate: dateOnlyValue(
        institution?.operationStartDate ?? undefined
      ),
      operationEndDate: dateOnlyValue(
        institution?.operationEndDate ?? undefined
      ),
      maxCount: program.participatingSchoolCount ?? program.approvedStudentCount,
      ...(institution?.id != null ? { id: institution.id } : {}),
      source: institution,
    }),
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      applicationType: 'VOLUNTEER',
      startAt: volunteerStart,
      endAt: volunteerEnd,
      operationStartDate: dateOnlyValue(h1?.operationStartDate ?? undefined),
      operationEndDate: dateOnlyValue(h1?.operationEndDate ?? undefined),
      maxCount: program.ujatFirstHalfVolunteerCount ?? program.generalVolunteers,
      recruitTerm: ProgramRecruitmentRequestRecruitTerm.FIRST_HALF,
      ...(h1?.id != null ? { id: h1.id } : {}),
      ...ujatVolunteerInterviewFields(program, h1),
      source: h1,
    }),
  ]
  const secondHalfRows = volunteers
    .filter(row => row.recruitTerm === ProgramRecruitmentRequestRecruitTerm.SECOND_HALF)
    .map(row =>
      recruitmentRow({
        recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
        targetType: 'COLLEGE_STUDENT',
        applicationType: 'VOLUNTEER',
        id: row.id,
        startAt: recruitmentWindowInstant(row.startAt ?? undefined, 'start'),
        endAt: recruitmentWindowInstant(row.endAt ?? undefined, 'end'),
        operationStartDate: dateOnlyValue(row.operationStartDate ?? undefined),
        operationEndDate: dateOnlyValue(row.operationEndDate ?? undefined),
        maxCount: program.ujatSecondHalfVolunteerCount ?? program.generalVolunteers,
        recruitTerm: ProgramRecruitmentRequestRecruitTerm.SECOND_HALF,
        ...ujatVolunteerInterviewFields(program, row),
        source: row,
      })
    )
  // 프로그램 봉사자 기간은 상반기 행에만 맞춘다. 하반기 기간은 그 행의 startAt/endAt 변경분으로만 보낸다.
  return omitRecruitmentOperationDatesOutsideBusiness(
    attachRecruitmentRowIdentity([...rows, ...secondHalfRows], program.programRecruitments),
    program
  ) as ProgramRecruitmentRequest[]
}

/**
 * 저장된 행이 없는 반기(보통 하반기) 봉사자 모집 행 생성 요청.
 * BE는 하반기 행을 자동 생성하지 않으므로 `id` 없이 `recruitTerm`을 붙여 보낸다.
 */
export function buildUjatNewVolunteerHalfRowRequests(
  rows: Program['programRecruitments'],
  existing: Program
): ProgramRecruitmentRequest[] {
  const savedTerms = new Set(
    (existing.programRecruitments ?? []).map(row => row.recruitTerm).filter(Boolean)
  )
  const built = (rows ?? [])
    .filter(
      row =>
        row.id == null &&
        (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
        row.recruitTerm != null &&
        !savedTerms.has(row.recruitTerm)
    )
    .map(row => {
      const startAt = recruitmentWindowInstant(row.startAt ?? undefined, 'start')
      const endAt = recruitmentWindowInstant(row.endAt ?? undefined, 'end')
      return {
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      applicationType: 'VOLUNTEER',
      recruitTerm: row.recruitTerm,
      status: ProgramRecruitmentRequestStatus.ACTIVE,
      selectionMethod: 'ADMIN_REVIEW',
      ...(startAt ? { startAt } : {}),
      ...(endAt ? { endAt } : {}),
      ...(row.announcementTitle != null ? { announcementTitle: row.announcementTitle } : {}),
      ...(row.programDescription != null ? { programDescription: row.programDescription } : {}),
      ...(row.recruitmentGuide != null ? { recruitmentGuide: row.recruitmentGuide } : {}),
      ...(row.applicationMethod != null ? { applicationMethod: row.applicationMethod } : {}),
      ...(row.learningSupportContent != null
        ? { learningSupportContent: row.learningSupportContent }
        : {}),
      ...(row.additionalContentHtml != null
        ? { additionalContentHtml: row.additionalContentHtml }
        : {}),
      ...(row.remarks != null ? { remarks: row.remarks } : {}),
      ...(row.contactName != null ? { contactName: row.contactName } : {}),
      ...(row.contactPhone != null ? { contactPhone: row.contactPhone } : {}),
      ...(row.contactEmail != null ? { contactEmail: row.contactEmail } : {}),
      ...(row.interviewStartAt ? { interviewStartAt: row.interviewStartAt } : {}),
      ...(row.interviewEndAt ? { interviewEndAt: row.interviewEndAt } : {}),
      ...(row.operationStartDate ? { operationStartDate: row.operationStartDate } : {}),
      ...(row.operationEndDate ? { operationEndDate: row.operationEndDate } : {}),
      ...(row.otherMatters != null ? { otherMatters: row.otherMatters } : {}),
      ...(row.interviewEnabled != null ? { interviewEnabled: row.interviewEnabled } : { interviewEnabled: true }),
      ...(row.announcementPublished != null
        ? { announcementPublished: row.announcementPublished }
        : {}),
      ...(row.remarksNotApplicable != null
        ? { remarksNotApplicable: row.remarksNotApplicable }
        : {}),
      ...(row.documentPassAnnouncementAt !== undefined
        ? { documentPassAnnouncementAt: row.documentPassAnnouncementAt }
        : {}),
      ...(row.finalPassAnnouncementAt !== undefined
        ? { finalPassAnnouncementAt: row.finalPassAnnouncementAt }
        : {}),
      ...(row.noticeExposureTiming !== undefined
        ? { noticeExposureTiming: row.noticeExposureTiming }
        : {}),
      ...(row.volunteerTargets !== undefined ? { volunteerTargets: row.volunteerTargets } : {}),
      ...(row.interviewConfig !== undefined ? { interviewConfig: row.interviewConfig } : {}),
    }
    }) as ProgramRecruitmentRequest[]
  return omitRecruitmentOperationDatesOutsideBusiness(built, existing) as ProgramRecruitmentRequest[]
}

/**
 * 하반기 봉사자 모집 행. Typed `programRecruitments`에 SECOND_HALF가 있을 때만 보강한다.
 * Legacy Overlay로 빈 모집 행을 채우지 않는다.
 */
function withUjatCreateSecondHalfVolunteerRow(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  if (rows == null) return rows
  if (rows.some(row => row.recruitTerm === ProgramRecruitmentRequestRecruitTerm.SECOND_HALF)) {
    return rows
  }
  const h2Row = (program.programRecruitments ?? []).find(
    row =>
      (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
      row.recruitTerm === 'SECOND_HALF'
  )
  if (!h2Row) return rows
  return [
    ...rows,
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      applicationType: 'VOLUNTEER',
      startAt: recruitmentWindowInstant(h2Row.startAt ?? undefined, 'start'),
      endAt: recruitmentWindowInstant(h2Row.endAt ?? undefined, 'end'),
      operationStartDate: dateOnlyValue(h2Row.operationStartDate ?? undefined),
      operationEndDate: dateOnlyValue(h2Row.operationEndDate ?? undefined),
      maxCount: program.ujatSecondHalfVolunteerCount ?? program.generalVolunteers,
      recruitTerm: ProgramRecruitmentRequestRecruitTerm.SECOND_HALF,
      ...ujatVolunteerInterviewFields(program, h2Row),
      source: h2Row,
    }),
  ]
}

function overlayForUjatCreateMedia(program: Program): Record<string, unknown> {
  return {
    ...(program.registrationOverlay ?? {}),
    ...(program.ujatRegistrationOverlay ?? {}),
  }
}

/** 생성 시 기관·상반기·하반기 봉사자 탭 문구·담당자·면접 기간·미디어를 각 행의 반기 값으로 담는다. */
function withUjatCreateRowCopy(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  const copied = rows?.map(row => {
    const kind: UjatRecruitDisplayKind =
      row.recruitmentType !== ProgramRecruitmentRequestRecruitmentType.VOLUNTEER
        ? 'institution'
        : row.recruitTerm === ProgramRecruitmentRequestRecruitTerm.SECOND_HALF
          ? 'volunteer_h2'
          : 'volunteer_h1'
    const display = resolveUjatRecruitDisplayProgram(program, kind)
    const publicTitle = resolveUjatRecruitAnnouncementTitle(display, kind)
    const { interviewStartAt: _start, interviewEndAt: _end, ...rowWithoutInterview } = row
    const programRangeKey =
      kind === 'institution'
        ? UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS.programRange
        : UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.programRange
    const programRange = recordOf((program.ujatRegistrationOverlay ?? {})[programRangeKey])
    // Typed recruitment row가 있으면 Overlay programRange로 덮지 않는다.
    const operationStartDate =
      row.operationStartDate ?? dateOnlyValue(programRange?.start as string | undefined)
    const operationEndDate =
      row.operationEndDate ?? dateOnlyValue(programRange?.end as string | undefined)
    return {
      ...(kind === 'institution' ? row : rowWithoutInterview),
      announcementTitle: publicTitle !== '-' ? publicTitle : undefined,
      programDescription: display.description || undefined,
      recruitmentGuide: display.recruitmentGuide || undefined,
      applicationMethod: display.applicationMethod || undefined,
      learningSupportContent: display.learningSupportContent || undefined,
      additionalContentHtml: display.additionalContentHtml || undefined,
      // 비고 = remarks(oneLineIntroduction), 기타사항 = otherMatters(otherNotes, 봉사자만).
      remarks: display.oneLineIntroduction || undefined,
      ...(kind !== 'institution' && display.otherNotes ? { otherMatters: display.otherNotes } : {}),
      contactName: display.managerName || undefined,
      contactPhone: display.contactPhone || undefined,
      contactEmail: display.contactEmail || undefined,
      ...(operationStartDate ? { operationStartDate } : {}),
      ...(operationEndDate ? { operationEndDate } : {}),
      ...(kind === 'institution' ? {} : ujatVolunteerInterviewFields(display)),
    }
  })
  return omitRecruitmentOperationDatesOutsideBusiness(
    withRecruitmentCreateMedia(copied, overlayForUjatCreateMedia(program), 'ujat'),
    program
  )
}

function programIps(value: string | null | undefined): Program['ips'] | undefined {
  if (value === 'Inspire' || value === 'Succeed' || value === 'Prepare') return value
  return undefined
}

/** 공통정보 후원사·담당자 → sponsors[] (1사1교와 같은 배정 계약) */
function mapUjatSponsorAssignments(program: Program) {
  const sponsorId =
    program.generalCommonInfo?.sponsorManagementIds?.[0] ??
    program.generalCommonInfo?.sponsorManagementId ??
    program.sponsorId
  if (!sponsorId || sponsorId === DEFAULT_SPONSOR_ID) return []
  const sponsorIds = [String(sponsorId).trim()].filter(Boolean)
  const contactRefs = normalizeSponsorManagerContactIds({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
  })
    .filter(id => id !== '__all__' && !isSponsorContactUnselected(id))
    .map(id =>
      id.includes('::') ? id : encodeSponsorManagerContactRef(String(sponsorId), id)
    )
  return buildProgramSponsorAssignmentsWire(sponsorIds, contactRefs)
}

/** UJAT는 상·하반기 교육 일정 구조. BE create는 educationStructure 필수. */
function resolveUjatEducationStructure(
  program: Program
): ProgramCreateRequestEducationStructure {
  if (program.generalProgramEducationStructure === 'curriculum') {
    return ProgramCreateRequestEducationStructure.CURRICULUM
  }
  return ProgramCreateRequestEducationStructure.SCHEDULE
}

function baseProgram(partial: Partial<Program> & Pick<Program, 'id' | 'title'>): Program {
  const timestamp = now()
  return {
    sponsorId: DEFAULT_SPONSOR_ID,
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: timestamp,
    endDate: timestamp,
    status: 'pending',
    lifecycleStatus: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial,
  }
}

export function fromListItem(dto: AdminProgramListItemDto): Program {
  const id = idOf(dto.id ?? dto.uuid)
  const dtoExt = dto as AdminProgramListItemDto & {
    serviceDetailJson?: string
    ujatProgressStatus?: string
  }
  const fromJson = parseServiceDetail(dtoExt.serviceDetailJson)
  const registrationOverlay = parseRegistrationOverlay(dtoExt.serviceDetailJson)
  const title = echoProgramManagementTitle(dto.title, dto.nameKo)
  const mainTitle = typeof dto.mainTitle === 'string' ? dto.mainTitle : ''
  // 목록 진행 현황은 서버가 내려준 canonical 필드만 사용한다.
  const ujatProgressStatus = normalizeUjatProgressStatus(dto.ujatProgressStatus)
  const lifecycleStatus =
    (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ??
    mapPeriodStatusToLifecycle(dto.periodStatus) ??
    'planned'

  // UJAT: target_instructor_count=0 → 강사 KPI를 "-"로 위장하지 않음 (0 유지)
  const instructorCount = dto.instructorApplicantCount ?? 0

  return baseProgram({
    id,
    title,
    backendProgramType: dto.programType ?? 'UJAT',
    mainTitle,
    titleEn: dto.titleEn?.trim() || undefined,
    ...resolveBusinessPeriodDates(dto),
    lifecycleStatus,
    listDeleteBlocked: resolveProgramListDeleteBlocked({
      lifecycleStatus,
      ujatProgressStatus: ujatProgressStatus ?? undefined,
      participantApprovedCount: dto.participantApprovedCount,
      approvedOrganizationApplicationCount: dto.approvedOrganizationApplicationCount,
      participatingSchoolCount: dto.participatingSchoolCount ?? dto.participatingOrganizationCount,
      participatingStudentCount: dto.participatingStudentCount,
    }),
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount ?? 0,
    ...mapListParticipantRecruitment(dto),
    participatingSchoolCount: dto.organizationApplicationCount ?? 0,
    instructors: instructorCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    ...omitProgramAuditNameFields(fromJson),
    ...readProgramAuditNames(dto),
    // serviceDetailJson·Primary id fallback이 목록 진행 현황을 덮지 못하게 한다.
    ujatProgressStatus,
    ...(Object.keys(registrationOverlay).length > 0
      ? { ujatRegistrationOverlay: registrationOverlay }
      : {}),
    generalParticipantTypes: generalParticipantTypesFromUjatFlags(
      resolveUjatParticipantTypeFlags({
        ...baseProgram({ id, title }),
        ujatRegistrationOverlay: registrationOverlay,
      })
    ),
  })
}

export function fromDetail(
  dto: ProgramResponse,
  typedDetail?: UjatTypedDetail
): UjatProgramWithExtras {
  const id = idOf(dto.id)
  const dtoExt = dto as ProgramResponse & {
    nameKo?: string
    periodStatus?: string
    remarks?: string
    businessField?: string
  }
  const rawOverlay = applyStoredUjatTypedHalvesToOverlay(
    parseRegistrationOverlay(dto.serviceDetailJson),
    parseStoredUjatTypedDetail(dto.serviceDetailJson)
  )
  const timestamp = now()
  const details = parseServiceDetail(dto.serviceDetailJson)
  const extras = parseUjatServiceDetailExtras(dto.serviceDetailJson)
  const primaryCalendarOverlay = overlayFromPrimarySemesterCalendars(extras.semesterCalendars)
  const primaryRegionCapacity = regionCapacityFromPrimaryExtras(extras.ujatRegionCapacities)
  const surveyKeys =
    details.generalSurveyMenuKeys ??
    extras.surveyMenuKeys ??
    undefined

  // UJAT 상세 응답의 최상위 KPI가 canonical source다. serviceDetailJson 안에
  // 오래된 KPI가 남아 있어도 상세 응답값(null 포함)으로 덮어쓴다.
  const responseKpi = {
    finalParticipants: dto.totalParticipants === null ? null : dto.totalParticipants ?? undefined,
    instructorCount: dto.instructors === null ? null : dto.instructors ?? undefined,
    volunteerCount: dto.generalVolunteers === null ? null : dto.generalVolunteers ?? undefined,
    finalSchools: dto.finalSchools === null ? null : dto.finalSchools ?? undefined,
    finalClasses: dto.finalClasses === null ? null : dto.finalClasses ?? undefined,
  } as unknown as GeneralProgramCommonInfoExtension['kpi']

  // BE가 숫자 id로 조회해 내려주는 detailedProgramName을 우선 반영 (다른 유형과 동일 계약).
  const namedCommonInfo = Object.prototype.hasOwnProperty.call(dto, 'detailedProgramName')
    ? {
        ...details.generalCommonInfo,
        detailedProgramName: dto.detailedProgramName?.trim() ?? '',
      }
    : details.generalCommonInfo
  const policyCommonInfo = applySettlementPolicyToCommonInfo(
    namedCommonInfo,
    dto.settlementPolicy
  )
  const generalCommonInfoBase = policyCommonInfo
    ? {
        ...namedCommonInfo,
        ...(Array.isArray(dto.settlementPolicy?.paymentItems)
          ? { paymentItems: policyCommonInfo.paymentItems }
          : {}),
      }
    : namedCommonInfo
  const generalCommonInfo = generalCommonInfoBase
    ? {
        ...generalCommonInfoBase,
        kpi: responseKpi as GeneralProgramCommonInfoExtension['kpi'],
        participantRecruitmentInfo: mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
          generalCommonInfoBase.participantRecruitmentInfo,
          dto
        ),
      }
    : {
      participantRecruitmentInfo: mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
        undefined,
        dto
      ),
      kpi: responseKpi as GeneralProgramCommonInfoExtension['kpi'],
    }

  const ips = programIps(dto.ips)
  const legacyScheduleOverlay = {
    ...pickUjatScheduleOverlayKeys(rawOverlay),
    ...primaryCalendarOverlay,
  }
  const hasTypedScheduleRows = typedDetailHasScheduleRows(typedDetail)
  // Typed 값은 Typed 응답 모델에만 둔다. Overlay는 raw/semester legacy 값을
  // 최초 조회 호환용으로만 유지하고, Typed → Overlay projection은 수행하지 않는다.
  const effectiveSurveyKeys =
    typedDetail?.common && Array.isArray(typedDetail.common.surveySettings)
      ? ujatPersistedSurveyMenuKeysFromItems(
          typedDetail.common.surveySettings.reduce(
            (items, item) => {
              const key =
                item.surveyType === 'VOLUNTEER_SATISFACTION'
                  ? 'volunteer_satisfaction'
                  : item.surveyType === 'SCHOOL_SATISFACTION'
                    ? 'school_satisfaction'
                    : item.surveyType === 'LECTURE_EVALUATION'
                      ? 'lecture_evaluation'
                      : 'survey'
              items[key] = item.enabled === true
              return items
            },
            {
              survey: false,
              volunteer_satisfaction: false,
              school_satisfaction: false,
              lecture_evaluation: false,
            } as Parameters<typeof ujatPersistedSurveyMenuKeysFromItems>[0]
          )
        )
      : surveyKeys
  const overlay = reconcileUjatRegistrationOverlayFromProgramResponse(
    dto,
    {
      ...rawOverlay,
      ...(hasTypedScheduleRows ? {} : primaryCalendarOverlay),
    },
    {
      generalSurveyMenuKeys: effectiveSurveyKeys,
      sponsorManagerContactIds: generalCommonInfo?.sponsorManagerContactIds,
      sponsorManagerLine: generalCommonInfo?.sponsorManagerLine,
      kpi: responseKpi,
    }
  )
  const overlayForProgram = hasTypedScheduleRows
    ? overlay
    : { ...overlay, ...legacyScheduleOverlay }
  const resolvedTypedDetail = hasTypedScheduleRows
    ? typedDetail
    : Object.keys(legacyScheduleOverlay).length > 0
      ? typedDetailFromUjatOverlay(legacyScheduleOverlay, typedDetail)
      : typedDetail
  const title = echoProgramManagementTitle(dto.title, dtoExt.nameKo)
  const periodStatus = dtoExt.periodStatus
  const ujatProgressStatus = resolveUjatProgressStatus({
    ujatProgressStatus: details.ujatProgressStatus,
    periodStatus,
  })
  const lifecycleStatus =
    (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ??
    mapPeriodStatusToLifecycle(periodStatus) ??
    'planned'
  const dtoTargetLevels = Array.isArray(
    (dto as ProgramResponse & { targetLevels?: string[] }).targetLevels
  )
    ? (dto as ProgramResponse & { targetLevels?: string[] }).targetLevels
    : undefined
  const columnSource = Array.isArray(dtoTargetLevels)
    ? dtoTargetLevels
    : Array.isArray(details.targetLevels)
      ? details.targetLevels
      : undefined
  const persistedTargetLevels = resolvePersistedProgramTargetLevels({
    targetLevels: columnSource,
    targetLevel: dto.targetLevel,
    registrationOverlay: overlayForProgram,
    generalCommonInfo,
  })

  const mapped = applyResolvedAnnouncementTitle(
    {
    ...baseProgram({
      ...omitProgramAuditNameFields(details),
      generalCommonInfo,
      id,
      backendProgramType: dto.programType ?? 'UJAT',
      sponsorId: dto.sponsorId?.trim() || '',
      title,
      mainTitle: typeof dto.mainTitle === 'string' ? dto.mainTitle : '',
      type: (dto.type as ProgramType | undefined) ?? 'offline',
      format: (dto.format as ProgramFormat | undefined) ?? 'course',
      category: (dto.category as ProgramCategory | undefined) ?? 'school',
      description: dto.description,
      rounds:
        dto.rounds?.map((round, index) => ({
          id: idOf(round.id) || `${id}-round-${index + 1}`,
          programId: id,
          roundNumber: round.roundNumber ?? index + 1,
          startDate: round.startDate ?? dto.startDate ?? timestamp,
          endDate: round.endDate ?? dto.endDate ?? timestamp,
          capacity: round.capacity,
          classCount: round.classCount,
          status: (round.status as Status | undefined) ?? 'pending',
          curriculum: round.curriculum,
          deliveryType: round.deliveryType as Program['rounds'][number]['deliveryType'],
        })) ?? [],
      ...resolveBusinessPeriodDates(dto),
      applicationStartDate: dto.applicationStartDate,
      applicationEndDate: dto.applicationEndDate,
      programRecruitments: toProgramRecruitmentWindows(dto.recruitments),
      status: (dto.status as Status | undefined) ?? 'pending',
      lifecycleStatus,
      ujatProgressStatus,
      businessArea:
        normalizeProgramBusinessAreaValue(dto.businessArea || dtoExt.businessField) || undefined,
      detailedProgramId: dto.detailedProgramId != null ? String(dto.detailedProgramId) : undefined,
      titleEn: dto.titleEn,
      textbookName: dto.textbookName,
      textbookNameEn: dto.textbookNameEn,
      schoolId: dto.schoolId,
      district: dto.district,
      targetLevel: persistedTargetLevels[0],
      targetLevels:
        columnSource !== undefined || persistedTargetLevels.length > 0
          ? persistedTargetLevels
          : undefined,
      institutionType: dto.institutionType as Program['institutionType'],
      ipOwned: dto.ipOwned,
      courseDeliveredBy: dto.courseDeliveredBy as Program['courseDeliveredBy'],
      partnerInvolvement: dto.partnerInvolvement,
      ...(ips ? { ips } : {}),
      programCategory: dto.programCategory,
      programChannel: dto.programChannel,
      educationTime: dto.educationTime,
      teamDivision: dto.teamDivision,
      educationProcess: dto.educationProcess,
      maleParticipants: dto.maleParticipants,
      femaleParticipants: dto.femaleParticipants,
      totalParticipants: dto.totalParticipants,
      generalVolunteers: dto.generalVolunteers,
      staffVolunteers: dto.staffVolunteers ?? 0,
      returningVolunteers: dto.returningVolunteers ?? 0,
      generalTeachers: dto.generalTeachers,
      educatedTeachers: dto.educatedTeachers,
      instructors: dto.instructors,
      managerName: dto.managerName,
      venue: dto.venue,
      curriculum: dto.curriculum,
      contactName: dto.contactName?.trim() || undefined,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      oneLineIntroduction: dto.oneLineIntroduction,
      keyVisualImage: dto.keyVisualImage,
      settlementRuleId: dto.settlementRuleId,
      applicationPathId: dto.applicationPathId,
      additionalContentHtml: dto.additionalContentHtml,
      recruitmentGuide: dto.recruitmentGuide,
      learningSupportContent: dto.learningSupportContent,
      attachmentFileNames: dto.attachmentFileNames,
      otherNotes:
        resolveOtherNotesFromProgramResponse({
          otherMatters: dto.otherMatters,
          otherNotes: details.otherNotes,
        }) || undefined,
      recruitmentTargetDetail: dto.recruitmentTargetDetail?.trim() || undefined,
      generalSurveyMenuKeys: effectiveSurveyKeys as Program['generalSurveyMenuKeys'],
      generalProgramEducationStructure:
        String(dto.educationStructure ?? '').toUpperCase() === 'CURRICULUM'
          ? 'curriculum'
          : String(dto.educationStructure ?? '').toUpperCase() === 'SCHEDULE'
            ? 'schedule'
            : undefined,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      ...readProgramAuditNames(dto),
    }),
    ujatRegistrationOverlay: overlayForProgram,
    ...(resolvedTypedDetail ? { ujatTypedDetail: resolvedTypedDetail } : {}),
  },
    {
      serviceDetailJson: dto.serviceDetailJson,
      overlay: overlayForProgram,
    }
  )
  const withInterview = hydrateUjatVolunteerInterviewFromRecruitmentRows(mapped)
  const withRows = hydrateRecruitmentWindowsOntoProgram(withInterview)
  const result: UjatProgramWithExtras = {
    ...withRows,
    generalParticipantTypes: generalParticipantTypesFromUjatFlags(
      resolveUjatParticipantTypeFlags(
        { ...mapped, ujatRegistrationOverlay: overlayForProgram },
        overlayForProgram
      )
    ),
    ujatServiceDetailExtras: {
      ...extras,
      semesterType: extras.semesterType ?? 'FULL_YEAR',
    },
    ujatRegistrationOverlay: stripUjatKpiWageCapacityOverlay(overlayForProgram),
    ...(primaryRegionCapacity ?? ujatKpiWageCapacityFromLegacyOverlay(rawOverlay).ujatRegionCapacity
      ? {
          ujatRegionCapacity:
            primaryRegionCapacity ??
            ujatKpiWageCapacityFromLegacyOverlay(rawOverlay).ujatRegionCapacity,
        }
      : {}),
    ...(resolvedTypedDetail ? { ujatTypedDetail: resolvedTypedDetail } : {}),
    ...(periodStatus != null ? { periodStatus } : {}),
  }
  return applyBusinessPeriodHistoriesFromDto(result, dto)
}

function hydrateUjatVolunteerInterviewFromRecruitmentRows(program: Program): Program {
  if (program.interviewStartDate && program.interviewEndDate) return program
  const rows = program.programRecruitments ?? []
  const volunteers = rows.filter(row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER')
  const h1 =
    volunteers.find(row => row.recruitTerm === 'FIRST_HALF') ??
    volunteers.find(row => row.recruitTerm == null) ??
    volunteers[0]
  if (!h1?.interviewStartAt && !h1?.interviewEndAt) return program
  return {
    ...program,
    interviewStartDate: program.interviewStartDate ?? h1.interviewStartAt ?? undefined,
    interviewEndDate: program.interviewEndDate ?? h1.interviewEndAt ?? undefined,
  }
}

function looksMaskedPii(value: string | null | undefined): boolean {
  if (value == null) return false
  return value.includes('*')
}

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

function overlayForTargetLevels(program: Program): Record<string, unknown> | undefined {
  const ujat = (program as UjatProgramWithExtras).ujatRegistrationOverlay
  if (
    (program.registrationOverlay == null || typeof program.registrationOverlay !== 'object') &&
    (ujat == null || typeof ujat !== 'object')
  ) {
    return program.registrationOverlay ?? undefined
  }
  return {
    ...(program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? program.registrationOverlay
      : {}),
    ...(ujat != null && typeof ujat === 'object' ? ujat : {}),
  }
}

function resolveRequestTargetLevels(
  program: Program,
  fallback?: Program
): ProgramUpdateRequestTargetLevelsItem[] | undefined {
  const withOverlay = (source: Program) => ({
    ...source,
    registrationOverlay: overlayForTargetLevels(source),
  })
  if (Array.isArray(program.targetLevels)) {
    return [
      ...resolvePersistedProgramTargetLevels(withOverlay(program)),
    ] as ProgramUpdateRequestTargetLevelsItem[]
  }
  const resolved = resolvePersistedProgramTargetLevels(withOverlay(program))
  if (resolved.length > 0) {
    return [...resolved] as ProgramUpdateRequestTargetLevelsItem[]
  }
  if (fallback) {
    if (Array.isArray(fallback.targetLevels)) {
      return [
        ...resolvePersistedProgramTargetLevels(withOverlay(fallback)),
      ] as ProgramUpdateRequestTargetLevelsItem[]
    }
    const fromFallback = resolvePersistedProgramTargetLevels(withOverlay(fallback))
    if (fromFallback.length > 0) {
      return [...fromFallback] as ProgramUpdateRequestTargetLevelsItem[]
    }
  }
  return undefined
}

function mapUjatProgramSponsorAssignments(program: Program) {
  const sponsorId = program.sponsorId != null ? String(program.sponsorId).trim() : ''
  const contactRefs = ujatSponsorManagerContactIdsForApi({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
    managerLine: program.generalCommonInfo?.sponsorManagerLine,
  })
  const normalized = normalizeSponsorManagerContactIds({
    ids: contactRefs,
    id: contactRefs[0],
  }).filter(ref => !isSponsorContactUnselected(ref))
  return buildProgramSponsorAssignmentsWire(sponsorId ? [sponsorId] : [], normalized)
}

function registrationSnapshotForApi(
  registration?: RegistrationPersistSnapshot,
  options?: { stripTypedLegacyOverlay?: boolean }
): RegistrationPersistSnapshot | undefined {
  if (!registration) return undefined
  // create()가 `{ ...input, overlay }`로 넘기면 idempotencyKey·preparedFormBindings가
  // registration에 섞인다. JSON.stringify가 그대로 실어 BE schema를 깨뜨린다.
  return {
    ...(registration.draft != null ? { draft: registration.draft } : {}),
    overlay: stripRegistrationOverlayDebugKeys(
      options?.stripTypedLegacyOverlay === false
        ? stripUnselectedUjatSponsorContactsFromOverlay(registration.overlay)
        : stripUjatTypedLegacyOverlay(
            stripUnselectedUjatSponsorContactsFromOverlay(registration.overlay)
          )
    ),
  }
}

function coreRequest(
  program: Program,
  registration?: RegistrationPersistSnapshot,
  options?: { stripTypedLegacyOverlay?: boolean }
): ProgramUpdateRequest {
  const targetLevels = resolveRequestTargetLevels(program)
  const sponsors = mapUjatProgramSponsorAssignments(program)
  const primarySponsorId =
    sponsors.find(s => s.sponsorContactId)?.sponsorId ||
    sponsors[0]?.sponsorId ||
    (program.sponsorId != null ? String(program.sponsorId) : undefined)
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  const applicationDates = applicationDatesInsideBusiness(program)
  const body: ProgramUpdateRequest = {
    sponsorId: primarySponsorId,
    sponsors: sponsors.length > 0 ? sponsors : undefined,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: dateOnlyValue(program.startDate),
    endDate: dateOnlyValue(program.endDate),
    businessStartDate: dateOnlyValue(program.startDate),
    businessEndDate: dateOnlyValue(program.endDate),
    educationStructure: resolveUjatEducationStructure(program),
    applicationStartDate: applicationDates.applicationStartDate,
    applicationEndDate: applicationDates.applicationEndDate,
    recruitments: mapUjatProgramRecruitmentsToRequest(program),
    businessArea,
    // UJAT은 실제 카탈로그를 쓰지 않는 고정형이지만, 다른 유형과 동일하게 id·name을
    // 항상 함께 반영한다 (name은 teamDivision/generalCommonInfo.detailedProgramName에 실림).
    detailedProgramId: parseDetailedProgramMasterId(program.detailedProgramId),
    titleEn: program.titleEn,
    mainTitle: program.mainTitle,
    textbookName: program.textbookName,
    textbookNameEn: program.textbookNameEn,
    schoolId: program.schoolId,
    district: program.district,
    targetLevel: targetLevels?.[0],
    targetLevels,
    institutionType: program.institutionType,
    venueKind: program.generalCommonInfo?.venueKind,
    ipOwned: program.ipOwned,
    courseDeliveredBy: program.courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement,
    ips: program.ips,
    programCategory: program.programCategory ?? undefined,
    programChannel: program.programChannel ?? undefined,
    educationTime: program.educationTime,
    teamDivision: program.teamDivision,
    educationProcess: program.educationProcess,
    maleParticipants: program.maleParticipants,
    femaleParticipants: program.femaleParticipants,
    totalParticipants: program.totalParticipants,
    generalVolunteers: program.generalVolunteers,
    staffVolunteers: program.staffVolunteers,
    returningVolunteers: program.returningVolunteers,
    generalTeachers: program.generalTeachers,
    educatedTeachers: program.educatedTeachers,
    instructors: program.instructors,
    managerName: program.managerName,
    venue: program.venue,
    curriculum: program.curriculum,
    contactEmail: program.contactEmail,
    contactPhone: program.contactPhone,
    oneLineIntroduction: program.oneLineIntroduction,
    keyVisualImage: program.keyVisualImage ?? program.posterImage,
    settlementRuleId: program.settlementRuleId,
    applicationPathId: program.applicationPathId,
    additionalContentHtml: program.additionalContentHtml,
    recruitmentGuide: program.recruitmentGuide,
    learningSupportContent: program.learningSupportContent,
    attachmentFileNames: program.attachmentFileNames,
    rounds: program.rounds.map(round => ({
      roundNumber: round.roundNumber,
      startDate: dateOnlyValue(round.startDate),
      endDate: dateOnlyValue(round.endDate),
      capacity: round.capacity,
      classCount: round.classCount,
      status: round.status,
      curriculum: round.curriculum,
      deliveryType: round.deliveryType,
    })),
    serviceDetailJson: serializeServiceDetail(
      targetLevels?.length
        ? { ...program, targetLevels, targetLevel: targetLevels[0] }
        : program,
      registrationSnapshotForApi(registration, options)
    ),
  }
  assignProgramPaymentItemsToWriteRequest({ body, program })
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'full',
    merged: program,
    existing: program,
  })
  return body
}

/** patch 키만 직렬화 — rounds·마스킹 담당자 등 화면 밖 필드 미전송 */
function patchRequest(
  merged: Program,
  patch: Partial<Program>,
  registration: RegistrationPersistSnapshot | undefined,
  existing: Program,
  options?: { stripTypedLegacyOverlay?: boolean }
): ProgramUpdateRequest {
  const body: ProgramUpdateRequest = {}
  const has = (key: keyof Program) => patchHasKey(patch, key)

  if (has('sponsorId') || patchTouchesProgramSponsors(patch)) {
    const sponsors = mapUjatSponsorAssignments(merged)
    body.sponsorId =
      sponsors.find(row => row.sponsorContactId)?.sponsorId ||
      sponsors[0]?.sponsorId ||
      (merged.sponsorId != null ? String(merged.sponsorId) : undefined)
    body.sponsors = sponsors
  }
  if (has('ips')) body.ips = merged.ips
  if (has('generalProgramEducationStructure') || has('generalCommonInfo')) {
    body.educationStructure = resolveUjatEducationStructure(merged)
  }
  if (has('title')) body.title = merged.title
  if (has('type')) body.type = merged.type
  if (has('format')) body.format = merged.format
  if (has('category')) body.category = merged.category
  if (has('description')) body.description = merged.description
  if (has('startDate') || has('endDate')) {
    body.startDate = dateOnlyValue(merged.startDate)
    body.endDate = dateOnlyValue(merged.endDate)
    body.businessStartDate = dateOnlyValue(merged.startDate)
    body.businessEndDate = dateOnlyValue(merged.endDate)
  }
  if (
    has('applicationStartDate') ||
    has('applicationEndDate') ||
    has('volunteerApplicationStartDate') ||
    has('volunteerApplicationEndDate')
  ) {
    const applicationDates = applicationDatesInsideBusiness(merged)
    body.applicationStartDate = applicationDates.applicationStartDate
    body.applicationEndDate = applicationDates.applicationEndDate
    body.recruitments = mapUjatProgramRecruitmentsToRequest({
      ...merged,
      programRecruitments: existing.programRecruitments,
    })
  }
  if (has('programRecruitments')) {
    const copyRows = buildRecruitmentRowCopyRequests(
      merged.programRecruitments,
      existing.programRecruitments,
      row => isRecruitmentStartLocked(row.startAt)
    )
    if (copyRows.length > 0) {
      body.recruitments = mergeRecruitmentRowRequests(body.recruitments ?? [], copyRows)
    }
    const newHalfRows = buildUjatNewVolunteerHalfRowRequests(merged.programRecruitments, existing)
    if (newHalfRows.length > 0) {
      body.recruitments = mergeRecruitmentRowRequests(
        recruitmentRowIdentityRequests(existing.programRecruitments),
        body.recruitments ?? [],
        newHalfRows
      )
    }
  }
  if (has('businessArea')) {
    const businessArea = normalizeProgramBusinessAreaValue(merged.businessArea) || undefined
    body.businessArea = businessArea
  }
  if (has('detailedProgramId') || has('generalCommonInfo')) {
    body.detailedProgramId = parseDetailedProgramMasterId(merged.detailedProgramId)
  }
  if (has('titleEn')) body.titleEn = merged.titleEn
  if (has('mainTitle')) body.mainTitle = merged.mainTitle ?? merged.title
  if (has('textbookName')) body.textbookName = merged.textbookName
  if (has('textbookNameEn')) body.textbookNameEn = merged.textbookNameEn
  if (has('schoolId')) body.schoolId = merged.schoolId
  if (has('district')) body.district = merged.district
  if (has('targetLevel') || has('targetLevels')) {
    const targetLevels = resolveRequestTargetLevels(merged) ?? []
    body.targetLevels = targetLevels
    body.targetLevel = targetLevels[0]
  }
  if (has('institutionType')) body.institutionType = merged.institutionType
  if (has('venue') || has('generalCommonInfo')) {
    body.venueKind = merged.generalCommonInfo?.venueKind
  }
  if (has('ipOwned')) body.ipOwned = merged.ipOwned
  if (has('courseDeliveredBy')) body.courseDeliveredBy = merged.courseDeliveredBy
  if (has('partnerInvolvement')) body.partnerInvolvement = merged.partnerInvolvement
  if (has('programCategory')) body.programCategory = merged.programCategory ?? undefined
  if (has('programChannel')) body.programChannel = merged.programChannel ?? undefined
  if (has('educationTime')) body.educationTime = merged.educationTime
  if (has('teamDivision')) body.teamDivision = merged.teamDivision
  if (has('educationProcess')) body.educationProcess = merged.educationProcess
  if (has('maleParticipants')) body.maleParticipants = merged.maleParticipants
  if (has('femaleParticipants')) body.femaleParticipants = merged.femaleParticipants
  if (has('totalParticipants')) body.totalParticipants = merged.totalParticipants
  if (has('generalVolunteers')) body.generalVolunteers = merged.generalVolunteers
  if (has('staffVolunteers')) body.staffVolunteers = merged.staffVolunteers
  if (has('returningVolunteers')) body.returningVolunteers = merged.returningVolunteers
  if (has('generalTeachers')) body.generalTeachers = merged.generalTeachers
  if (has('educatedTeachers')) body.educatedTeachers = merged.educatedTeachers
  if (has('instructors')) body.instructors = merged.instructors
  if (has('managerName') && !looksMaskedPii(merged.managerName)) {
    body.managerName = merged.managerName
  }
  if (has('venue')) body.venue = merged.venue
  if (has('curriculum')) body.curriculum = merged.curriculum
  if (has('contactEmail') && !looksMaskedPii(merged.contactEmail)) {
    body.contactEmail = merged.contactEmail
  }
  if (has('contactPhone') && !looksMaskedPii(merged.contactPhone)) {
    body.contactPhone = merged.contactPhone
  }
  if (has('oneLineIntroduction')) body.oneLineIntroduction = merged.oneLineIntroduction
  if (has('keyVisualImage') || has('posterImage')) {
    body.keyVisualImage = merged.keyVisualImage ?? merged.posterImage
  }
  if (has('settlementRuleId')) body.settlementRuleId = merged.settlementRuleId
  if (has('applicationPathId')) body.applicationPathId = merged.applicationPathId
  if (has('additionalContentHtml')) body.additionalContentHtml = merged.additionalContentHtml
  if (has('recruitmentGuide')) body.recruitmentGuide = merged.recruitmentGuide
  if (has('learningSupportContent')) {
    body.learningSupportContent = merged.learningSupportContent
  }
  if (has('attachmentFileNames')) body.attachmentFileNames = merged.attachmentFileNames
  if (has('rounds')) {
    body.rounds = merged.rounds.map(round => ({
      roundNumber: round.roundNumber,
      startDate: dateOnlyValue(round.startDate),
      endDate: dateOnlyValue(round.endDate),
      capacity: round.capacity,
      classCount: round.classCount,
      status: round.status,
      curriculum: round.curriculum,
      deliveryType: round.deliveryType,
    }))
  }

  // UJAT registration overlay 보존을 위해 patch 저장 시 serviceDetailJson은 항상 포함
  const touchesTargetLevels = has('targetLevel') || has('targetLevels')
  const persistedTargetLevels = touchesTargetLevels
    ? resolveRequestTargetLevels(merged)
    : resolveRequestTargetLevels(merged, existing)
  const serializeSource =
    persistedTargetLevels != null
      ? { ...merged, targetLevels: persistedTargetLevels, targetLevel: persistedTargetLevels[0] }
      : merged
  body.serviceDetailJson = serializeServiceDetail(
    serializeSource,
    registrationSnapshotForApi(registration, options)
  )
  if (touchesTargetLevels && persistedTargetLevels != null) {
    body.targetLevels = persistedTargetLevels
    body.targetLevel = persistedTargetLevels[0]
  } else if (
    !touchesTargetLevels &&
    persistedTargetLevels != null &&
    persistedTargetLevels.length > 0
  ) {
    body.targetLevels = persistedTargetLevels
    body.targetLevel = persistedTargetLevels[0]
  }
  assignProgramPaymentItemsToWriteRequest({
    body,
    program: merged,
    patch,
    baseline: existing,
  })
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'patch',
    merged,
    existing,
    patch,
  })
  return body
}

/**
 * 새 UJAT 프로그램은 반기 계획을 `serviceDetailJson.ujatTypedDetail` 로 함께 만든다(BE 생성 경로가 같은 문서를 저장).
 * 이후 반기 저장은 typed-detail 반기 PUT 으로 맞춘다. 기존 프로그램 수정 요청에는 넣지 않는다.
 */
function withUjatTypedDetailForCreate(
  serviceDetailJson: string | null | undefined,
  source: Program
): string | undefined {
  if (!serviceDetailJson) return serviceDetailJson ?? undefined
  try {
    const parsed: unknown = JSON.parse(serviceDetailJson)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return serviceDetailJson
    return JSON.stringify({
      ...(parsed as Record<string, unknown>),
      [UJAT_TYPED_DETAIL_ROOT_KEY]: normalizeUjatTypedDetailForWrite(
        buildUjatTypedDetailForCreate(readUjatRegistrationOverlayFromProgram(source))
      ),
    })
  } catch {
    return serviceDetailJson
  }
}

export function toCreateRequest(
  program: Program,
  registration?: RegistrationSnapshot
): ProgramCreateRequest {
  const apiRegistration = registrationSnapshotForApi(registration)
  const core = coreRequest(program, apiRegistration)
  const serviceDetailJson = core.serviceDetailJson
  const { serviceDetailJson: _serviceDetailOmit, ...coreWithoutDetail } = core
  const copySource: Program = apiRegistration?.overlay
    ? {
        ...program,
        ujatRegistrationOverlay: {
          ...(program.ujatRegistrationOverlay ?? {}),
          ...(apiRegistration.overlay as Record<string, unknown>),
        },
      }
    : program
  // programType·serviceDetailJson을 앞에 — DevTools/문서 복사 시 detail 잘림·BE INVALID_VALUE 방지
  return omitNullRecordValues({
    programType: 'UJAT',
    serviceDetailJson: withUjatTypedDetailForCreate(serviceDetailJson, copySource),
    ...coreWithoutDetail,
    recruitments: withUjatCreateRowCopy(
      withUjatCreateSecondHalfVolunteerRow(coreWithoutDetail.recruitments ?? undefined, copySource),
      copySource
    ),
    businessStartDate: dateOnlyValue(program.startDate),
    businessEndDate: dateOnlyValue(program.endDate),
    autoApplyDefaultFormBindings: true,
  }) as ProgramCreateRequest
}

export function toUpdateRequest(
  program: Program,
  patch?: Partial<Program>,
  registration?: RegistrationPersistSnapshot,
  options?: { stripTypedLegacyOverlay?: boolean }
): ProgramUpdateRequest {
  if (patch && Object.keys(patch).length > 0) {
    return patchRequest({ ...program, ...patch }, patch, registration, program, options)
  }
  return coreRequest(program, registration, options)
}
