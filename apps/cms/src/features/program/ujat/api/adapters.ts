import type {
  AdminProgramListItemDto,
} from '@/features/program/general/api/programs-api-client'
import { omitNullRecordValues } from '@/shared/lib/openapi-null'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
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
  resolveUjatProgressStatus,
} from '@/features/program/ujat/lib/normalize-ujat-progress-status'
import { resolveUjatPrimaryProgressById } from '@/features/program/ujat/lib/is-ujat-primary-program'
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
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
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
import { pickUjatRecruitVolunteerOverlay } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  hasVolunteerHalfOverlayKeys,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
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
import { assignProgramPaymentItemsToWriteRequest } from '@/features/program/shared/lib/wage-payment-item-request'
import { reconcileUjatRegistrationOverlayFromProgramResponse } from '@/features/program/ujat/lib/ujat-registration-basic-info-overlay-sync'
import {
  generalParticipantTypesFromUjatFlags,
  resolveUjatParticipantTypeFlags,
} from '@/features/program/ujat/lib/participant-type-flags'
import {
  parseRegistrationOverlay,
  parseServiceDetail,
  parseUjatServiceDetailExtras,
  serializeServiceDetail,
  type RegistrationPersistSnapshot,
  type RegistrationSnapshot,
  type UjatServiceDetailExtras,
} from './service-detail'
import { resolveProgramListDeleteBlocked } from '@/features/program/shared/lib/program-delete-eligibility'
import { ujatHalfScheduleOverlayKeys } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { ujatEducationScheduleSettingsOverlayKeys } from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import {
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
  type UjatRegionCapacityBySemesterState,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

export type UjatProgramWithExtras = Program & {
  /** Primary serviceDetail extras — Semester 자식 없이 FULL_YEAR */
  ujatServiceDetailExtras?: UjatServiceDetailExtras
  /** 등록 폼 overlay — 상세 화면 SSOT. 세션 기본값으로 대체하지 않는다. */
  ujatRegistrationOverlay?: Record<string, unknown>
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

function overlayFromPrimaryRegionCapacities(value: unknown): Record<string, unknown> {
  const root = recordOf(value)
  if (!root) return {}
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

  if (Object.keys(result.h1).length === 0 && Object.keys(result.h2).length === 0) return {}
  return { [UJAT_REGION_CAPACITY_OVERLAY_KEY]: result }
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

function dateValue(value: Date | string | undefined): string | undefined {
  if (value instanceof Date) return value.toISOString()
  if (typeof value !== 'string') return undefined
  return value.trim() ? value : undefined
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
}): ProgramRecruitmentRequest {
  return {
    ...(input.id != null ? { id: input.id } : {}),
    recruitmentType: input.recruitmentType,
    targetType: input.targetType,
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
  }
}

/**
 * 기관 + 봉사자 formBindings targetType과 맞출 canonical 모집 row.
 * BE `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 가 UJAT를 거절하면 서버에서 허용해야 한다.
 */
export function mapUjatProgramRecruitmentsToRequest(program: Program): ProgramRecruitmentRequest[] {
  const institutionStart = dateValue(program.applicationStartDate)
  const institutionEnd = dateValue(program.applicationEndDate)
  const volunteers = (program.programRecruitments ?? [])
    .filter(row => (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' && row.id != null)
    .slice()
    .sort((a, b) => {
      const aTime = Date.parse(a.startAt ?? '')
      const bTime = Date.parse(b.startAt ?? '')
      return (Number.isNaN(aTime) ? Infinity : aTime) - (Number.isNaN(bTime) ? Infinity : bTime)
    })
  const h1 =
    volunteers.find(row => row.recruitTerm === 'FIRST_HALF') ??
    (volunteers.every(row => row.recruitTerm == null) ? volunteers[0] : undefined)
  const volunteerStart = dateValue(h1?.startAt ?? program.volunteerApplicationStartDate)
  const volunteerEnd = dateValue(h1?.endAt ?? program.volunteerApplicationEndDate)
  const rows = [
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.PARTICIPANT,
      targetType: 'ORGANIZATION',
      startAt: institutionStart,
      endAt: institutionEnd,
      operationStartDate: dateValue(
        program.programRecruitments?.find(
          row => (row.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
        )?.operationStartDate ?? undefined
      ),
      operationEndDate: dateValue(
        program.programRecruitments?.find(
          row => (row.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
        )?.operationEndDate ?? undefined
      ),
      maxCount: program.participatingSchoolCount ?? program.approvedStudentCount,
    }),
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      startAt: volunteerStart,
      endAt: volunteerEnd,
      operationStartDate: dateValue(h1?.operationStartDate ?? undefined),
      operationEndDate: dateValue(h1?.operationEndDate ?? undefined),
      maxCount: program.generalVolunteers ?? program.ujatFirstHalfVolunteerCount,
      recruitTerm: ProgramRecruitmentRequestRecruitTerm.FIRST_HALF,
      ...(h1?.id != null ? { id: h1.id } : {}),
      ...ujatVolunteerInterviewFields(program, h1),
    }),
  ]
  // 프로그램 봉사자 기간은 상반기 행에만 맞춘다. 하반기 기간은 그 행의 startAt/endAt 변경분으로만 보낸다.
  return attachRecruitmentRowIdentity(rows, program.programRecruitments)
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
  return (rows ?? [])
    .filter(
      row =>
        row.id == null &&
        (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
        row.recruitTerm != null &&
        !savedTerms.has(row.recruitTerm)
    )
    .map(row => ({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      applicationType: 'VOLUNTEER',
      recruitTerm: row.recruitTerm,
      status: ProgramRecruitmentRequestStatus.ACTIVE,
      selectionMethod: 'ADMIN_REVIEW',
      ...(row.startAt ? { startAt: row.startAt } : {}),
      ...(row.endAt ? { endAt: row.endAt } : {}),
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
      interviewEnabled: true,
      ...(row.interviewStartAt ? { interviewStartAt: row.interviewStartAt } : {}),
      ...(row.interviewEndAt ? { interviewEndAt: row.interviewEndAt } : {}),
    }))
}

function ujatVolunteerHalfRecruitRange(
  program: Program,
  half: UjatVolunteerRecruitHalf
): { startAt?: string; endAt?: string } {
  const overlay = pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {})
  const key =
    half === 'h1'
      ? UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.recruitRangeH1
      : UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS.recruitRangeH2
  const seal = recordOf(overlay[key])
  const startAt = stringOf(seal?.start) ?? undefined
  const endAt = stringOf(seal?.end) ?? undefined
  return { ...(startAt ? { startAt } : {}), ...(endAt ? { endAt } : {}) }
}

/**
 * 하반기 봉사자 모집 행. 등록 위저드는 하반기를 별도 반기 키로만 저장하므로
 * 하반기 입력이 있을 때 `SECOND_HALF` 행을 따로 만든다. 상반기 값으로 채우지 않는다.
 */
function withUjatCreateSecondHalfVolunteerRow(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  if (rows == null) return rows
  if (rows.some(row => row.recruitTerm === ProgramRecruitmentRequestRecruitTerm.SECOND_HALF)) {
    return rows
  }
  const overlay = pickUjatRecruitVolunteerOverlay(program.ujatRegistrationOverlay ?? {})
  const range = ujatVolunteerHalfRecruitRange(program, 'h2')
  if (!hasVolunteerHalfOverlayKeys(overlay, 'h2') && !range.startAt && !range.endAt) return rows
  return [
    ...rows,
    {
      ...recruitmentRow({
        recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
        targetType: 'COLLEGE_STUDENT',
        ...range,
        maxCount: program.ujatSecondHalfVolunteerCount,
        recruitTerm: ProgramRecruitmentRequestRecruitTerm.SECOND_HALF,
        interviewEnabled: true,
      }),
      applicationType: 'VOLUNTEER',
    },
  ]
}

/** 생성 시 기관·상반기·하반기 봉사자 탭 문구·담당자·면접 기간을 각 행의 반기 값으로 담는다. */
function withUjatCreateRowCopy(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  return rows?.map(row => {
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
    const operationStartDate = dateValue(programRange?.start as string | undefined) ?? row.operationStartDate
    const operationEndDate = dateValue(programRange?.end as string | undefined) ?? row.operationEndDate
    return {
      ...(kind === 'institution' ? row : rowWithoutInterview),
      announcementTitle: publicTitle !== '-' ? publicTitle : undefined,
      programDescription: display.description || undefined,
      recruitmentGuide: display.recruitmentGuide || undefined,
      applicationMethod: display.applicationMethod || undefined,
      learningSupportContent: display.learningSupportContent || undefined,
      additionalContentHtml: display.additionalContentHtml || undefined,
      remarks: display.otherNotes || undefined,
      contactName: display.managerName || undefined,
      contactPhone: display.contactPhone || undefined,
      contactEmail: display.contactEmail || undefined,
      ...(operationStartDate ? { operationStartDate } : {}),
      ...(operationEndDate ? { operationEndDate } : {}),
      ...(kind === 'institution' ? {} : ujatVolunteerInterviewFields(display)),
    }
  })
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
  const ujatProgressStatus = resolveUjatProgressStatus({
    ujatProgressStatus: fromJson.ujatProgressStatus ?? dtoExt.ujatProgressStatus,
    periodStatus: dto.periodStatus,
    primaryFallback: resolveUjatPrimaryProgressById(id),
  })
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
    ujatProgressStatus,
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
    ...fromJson,
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

export function fromDetail(dto: ProgramResponse): UjatProgramWithExtras {
  const id = idOf(dto.id)
  const dtoExt = dto as ProgramResponse & {
    nameKo?: string
    periodStatus?: string
    remarks?: string
    businessField?: string
  }
  const rawOverlay = parseRegistrationOverlay(dto.serviceDetailJson)
  const timestamp = now()
  const details = parseServiceDetail(dto.serviceDetailJson)
  const extras = parseUjatServiceDetailExtras(dto.serviceDetailJson)
  const primaryCalendarOverlay = overlayFromPrimarySemesterCalendars(extras.semesterCalendars)
  const primaryRegionCapacityOverlay = overlayFromPrimaryRegionCapacities(
    extras.ujatRegionCapacities
  )
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
  const overlay = reconcileUjatRegistrationOverlayFromProgramResponse(
    dto,
    {
      ...rawOverlay,
      ...primaryCalendarOverlay,
      ...primaryRegionCapacityOverlay,
    },
    {
      generalSurveyMenuKeys: surveyKeys,
      sponsorManagerContactIds: generalCommonInfo?.sponsorManagerContactIds,
      sponsorManagerLine: generalCommonInfo?.sponsorManagerLine,
      kpi: responseKpi,
    }
  )
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
    registrationOverlay: overlay,
    generalCommonInfo,
  })

  const mapped = applyResolvedAnnouncementTitle(
    {
    ...baseProgram({
      ...details,
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
      generalSurveyMenuKeys: surveyKeys as Program['generalSurveyMenuKeys'],
      generalProgramEducationStructure:
        String(dto.educationStructure ?? '').toUpperCase() === 'CURRICULUM'
          ? 'curriculum'
          : String(dto.educationStructure ?? '').toUpperCase() === 'SCHEDULE'
            ? 'schedule'
            : undefined,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    }),
    ujatRegistrationOverlay: overlay,
  },
    {
      serviceDetailJson: dto.serviceDetailJson,
      overlay,
    }
  )
  const withInterview = hydrateUjatVolunteerInterviewFromRecruitmentRows(mapped)
  const withRows = hydrateRecruitmentWindowsOntoProgram(withInterview)
  return {
    ...withRows,
    generalParticipantTypes: generalParticipantTypesFromUjatFlags(
      resolveUjatParticipantTypeFlags({ ...mapped, ujatRegistrationOverlay: overlay }, overlay)
    ),
    ujatServiceDetailExtras: {
      ...extras,
      semesterType: extras.semesterType ?? 'FULL_YEAR',
    },
    ujatRegistrationOverlay: overlay,
    periodStatus,
  }
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
  registration?: RegistrationPersistSnapshot
): RegistrationPersistSnapshot | undefined {
  if (!registration) return undefined
  // create()가 `{ ...input, overlay }`로 넘기면 idempotencyKey·preparedFormBindings가
  // registration에 섞인다. JSON.stringify가 그대로 실어 BE schema를 깨뜨린다.
  return {
    ...(registration.draft != null ? { draft: registration.draft } : {}),
    overlay: stripRegistrationOverlayDebugKeys(
      stripUnselectedUjatSponsorContactsFromOverlay(registration.overlay)
    ),
  }
}

function coreRequest(
  program: Program,
  registration?: RegistrationPersistSnapshot
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
    startDate: dateValue(program.startDate),
    endDate: dateValue(program.endDate),
    businessStartDate: dateValue(program.startDate),
    businessEndDate: dateValue(program.endDate),
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
      startDate: dateValue(round.startDate),
      endDate: dateValue(round.endDate),
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
      registrationSnapshotForApi(registration)
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
  existing: Program
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
    body.startDate = dateValue(merged.startDate)
    body.endDate = dateValue(merged.endDate)
    body.businessStartDate = dateValue(merged.startDate)
    body.businessEndDate = dateValue(merged.endDate)
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
      startDate: dateValue(round.startDate),
      endDate: dateValue(round.endDate),
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
    registrationSnapshotForApi(registration)
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
    serviceDetailJson: serviceDetailJson ?? undefined,
    ...coreWithoutDetail,
    recruitments: withUjatCreateRowCopy(
      withUjatCreateSecondHalfVolunteerRow(coreWithoutDetail.recruitments ?? undefined, copySource),
      copySource
    ),
    businessStartDate: dateValue(program.startDate),
    businessEndDate: dateValue(program.endDate),
    autoApplyDefaultFormBindings: true,
  }) as ProgramCreateRequest
}

export function toUpdateRequest(
  program: Program,
  patch?: Partial<Program>,
  registration?: RegistrationPersistSnapshot
): ProgramUpdateRequest {
  if (patch && Object.keys(patch).length > 0) {
    return patchRequest({ ...program, ...patch }, patch, registration, program)
  }
  return coreRequest(program, registration)
}
