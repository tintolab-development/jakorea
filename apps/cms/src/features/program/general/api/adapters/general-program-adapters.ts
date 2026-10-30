import {
  applyTypedVolunteerInterviewToOverlay,
  buildVolunteerInterviewConfigForSave,
  completeVolunteerInterviewConfig,
  omitVolunteerInterviewSaveKeysFromServiceDetailJson,
  volunteerInterviewRequiredFromOverlay,
  type RecruitmentInterviewConfig,
} from '@/features/program/shared/lib/volunteer-interview-config'
import type {
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types/index'
import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import { withRecruitmentCreateMedia } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { ProgramRecruitmentRequestRecruitmentType } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitmentType'
import { ProgramRecruitmentRequestStatus } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestStatus'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramUpdateRequestRoundsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestRoundsItem'
import type { ProgramUpdateRequestTargetLevelsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestTargetLevelsItem'
import { omitNullRecordValues } from '@/shared/lib/openapi-null'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import { programMatchesProgressPhase } from '@/features/program/general/ui/constants/program-list-constants'
import {
  omitUnchangedWageFieldsFromProgramForServiceDetail,
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
  wageCommonInfoFieldsUnchanged,
} from '@/features/program/general/lib/general-program-service-detail-json'
import { applySettlementPolicyToCommonInfo } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import { assignProgramPaymentItemsToWriteRequest } from '@/features/program/shared/lib/wage-payment-item-request'
import { mapListParticipantRecruitment } from '@/features/program/shared/lib/format-recruitment-headcount'
import { applyResolvedAnnouncementTitle } from '@/features/program/shared/lib/public-program-title'
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
import { applyBusinessPeriodHistoriesFromDto } from '@/features/program/shared/lib/business-period-extend'
import {
  isRecruitmentStartLocked,
  isRecruitmentTypeGeneralInfoClosed,
  toProgramRecruitmentWindows,
  type ProgramRecruitmentEditType,
} from '@/features/program/shared/lib/program-edit-window'
import {
  derivedTextbookNameAliases,
  omitIfDetailedProgramNameAlias,
  parseDetailedProgramMasterId,
} from '@/features/program/general/lib/detailed-program-request-id'
import {
  applyParticipantRecruitmentColumnsFromResponse,
  applyProgramMissingCommonStringFieldsToUpdateRequest,
  applyRecruitmentParticipantColumnFieldsToUpdateRequest,
  mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo,
  resolveOtherNotesFromProgramResponse,
} from '@/features/program/shared/lib/program-update-common-string-fields'
import {
  applyResolvedVenueKindToCommonInfo,
  buildProgramSponsorAssignmentsReplaceWire,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import { patchTouchesProgramSponsors } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import {
  attachRecruitmentRowIdentity,
  buildRecruitmentRowCopyRequests,
  mergeRecruitmentRowRequests,
  recruitmentRowIdentityRequests,
  resolveRecruitmentApplicationType,
} from '@/features/program/shared/lib/recruitment-row-request'
import {
  hydrateGeneralRecruitmentInfoFromRows,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'
import { hydrateRecruitmentWindowsOntoProgram } from '@/features/program/shared/lib/hydrate-recruitment-windows'
import {
  omitProgramAuditNameFields,
  readProgramAuditNames,
} from '@/features/program/shared/lib/program-audit-names'
import { resolveAudienceProgramOperationIsoRange } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { resolveGeneralRecruitDetailDisplayProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { toTypedProgramLifecycleStatus } from '@/shared/lib/program-typed-lifecycle'
import {
  normalizeProgramBusinessAreaValue,
  resolvePersistedProgramTargetLevels,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import type { TargetLevel } from '@/types/domain'
import {
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
} from '@jakorea/domain/shared/korean-phone'
import { resolveProgramListDeleteBlocked } from '@/features/program/shared/lib/program-delete-eligibility'

/**
 * BE `applicationTargetMode` — CMS `generalProgramAudience`(기관/개인)와 대응.
 * BOTH는 BE 허용값이나 CMS 대분류는 상호 배타.
 */
export type ProgramApplicationTargetMode = 'ORGANIZATION' | 'INDIVIDUAL' | 'BOTH'

export type ProgramCreateRequestBody = ProgramCreateRequest & {
  applicationTargetMode?: ProgramApplicationTargetMode
  recruitments?: Array<
    ProgramRecruitmentRequest & {
      thumbnailFileObjectId?: number | null
      attachmentFileObjectIds?: number[] | null
    }
  >
}

export type ProgramUpdateRequestBody = ProgramUpdateRequest & {
  applicationTargetMode?: ProgramApplicationTargetMode
}

export type ProgramWriteRequestBody = ProgramCreateRequestBody | ProgramUpdateRequestBody

export function mapAudienceToApplicationTargetMode(
  audience: Program['generalProgramAudience'],
  participantTypes?: Program['generalParticipantTypes']
): ProgramApplicationTargetMode {
  if (audience === 'individual') return 'INDIVIDUAL'
  if (audience === 'organization') return 'ORGANIZATION'

  const types = participantTypes ?? []
  const hasIndividual = types.includes('individual')
  const hasOrg = types.includes('school_institution')
  if (hasIndividual && hasOrg) return 'BOTH'
  if (hasIndividual) return 'INDIVIDUAL'
  if (hasOrg) return 'ORGANIZATION'
  // 미설정 시 공통정보 폼 기본값(organization)과 동일
  return 'ORGANIZATION'
}

/**
 * OpenAPI `programType` — 기관/개인 대분류에 맞춰 GENERAL_* 를 보낸다.
 * BE는 `GENERAL` + `applicationTargetMode=INDIVIDUAL` 조합을 거부하는 경우가 있음.
 */
export function resolveGeneralProgramCreateProgramType(
  audience: Program['generalProgramAudience'],
  participantTypes?: Program['generalParticipantTypes']
): 'GENERAL' | 'GENERAL_ORGANIZATION' | 'GENERAL_INDIVIDUAL' {
  const mode = mapAudienceToApplicationTargetMode(audience, participantTypes)
  if (mode === 'INDIVIDUAL') return 'GENERAL_INDIVIDUAL'
  if (mode === 'ORGANIZATION') return 'GENERAL_ORGANIZATION'
  return 'GENERAL'
}

/**
 * BE `programType` / `applicationTargetMode` → CMS 대분류(학교/기관·개인).
 * 목록·상세 모두 category·audience hydrate에 사용한다.
 */
export type GeneralProgramAudienceFromApi = {
  audience: NonNullable<Program['generalProgramAudience']>
  category: Extract<ProgramCategory, 'school' | 'individual'>
}

export function mapApplicationTargetModeToAudience(
  mode: string | undefined | null
): GeneralProgramAudienceFromApi | null {
  const normalized = mode?.trim().toUpperCase()
  if (normalized === 'INDIVIDUAL') {
    return { audience: 'individual', category: 'individual' }
  }
  if (normalized === 'ORGANIZATION') {
    return { audience: 'organization', category: 'school' }
  }
  return null
}

export function mapGeneralApiProgramTypeToAudience(
  programType: string | undefined | null
): GeneralProgramAudienceFromApi | null {
  const normalized = programType?.trim().toUpperCase()
  if (normalized === 'GENERAL_INDIVIDUAL') {
    return { audience: 'individual', category: 'individual' }
  }
  if (normalized === 'GENERAL_ORGANIZATION') {
    return { audience: 'organization', category: 'school' }
  }
  return null
}

function resolveAudienceFromApiFields(args: {
  programType?: string | null
  applicationTargetMode?: string | null
  category?: string | null
  audience?: Program['generalProgramAudience']
  participantTypes?: Program['generalParticipantTypes']
}): GeneralProgramAudienceFromApi | null {
  if (args.audience === 'individual') {
    return { audience: 'individual', category: 'individual' }
  }
  if (args.audience === 'organization') {
    return { audience: 'organization', category: 'school' }
  }

  // BE 대분류 — category가 school로 고정되어 와도 programType을 우선한다.
  const fromProgramType = mapGeneralApiProgramTypeToAudience(args.programType)
  if (fromProgramType) return fromProgramType

  const fromTargetMode = mapApplicationTargetModeToAudience(args.applicationTargetMode)
  if (fromTargetMode) return fromTargetMode

  const types = args.participantTypes ?? []
  if (types.length > 0) {
    const hasIndividual = types.includes('individual')
    const hasOrg = types.includes('school_institution')
    if (hasIndividual && !hasOrg) {
      return { audience: 'individual', category: 'individual' }
    }
    if (hasOrg && !hasIndividual) {
      return { audience: 'organization', category: 'school' }
    }
  }

  if (args.category === 'individual') {
    return { audience: 'individual', category: 'individual' }
  }
  if (args.category === 'school') {
    return { audience: 'organization', category: 'school' }
  }
  return null
}

const DEFAULT_SPONSOR_ID = 'sponsor-default'
const DEFAULT_ROUNDS: Program['rounds'] = []

function toProgramId(value: number | string | undefined): string {
  if (value == null || value === '') return ''
  return String(value)
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

function resolveListTargetLevels(dto: AdminProgramListItemDto): TargetLevel[] {
  return resolveProgramTargetLevels({
    targetLevels: Array.isArray(dto.targetLevels)
      ? dto.targetLevels.map(v => String(v))
      : undefined,
    targetLevel: dto.targetLevel,
  })
}

function toRequestDate(value: Date | string | undefined): string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) return value.toISOString()
  return value
}

function parsedMillis(value: string | undefined): number | undefined {
  if (!value) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : undefined
}

/**
 * 레거시 application* 는 사업(오픈) 기간 안에 있을 때만 보낸다.
 * 모집이 사업 시작 전인 일반 등록은 recruitments[]가 정본이며,
 * 레거시 필드를 같이 보내면 409 PROGRAM_DATE_OUTSIDE_OPEN_PERIOD가 난다.
 */
function applicationDatesInsideBusinessPeriod(program: Pick<
  Program,
  'startDate' | 'endDate' | 'applicationStartDate' | 'applicationEndDate'
>): {
  applicationStartDate?: string
  applicationEndDate?: string
} {
  const applicationStartDate = toRequestDate(program.applicationStartDate)
  const applicationEndDate = toRequestDate(program.applicationEndDate)
  const businessStart = parsedMillis(toRequestDate(program.startDate))
  const businessEnd = parsedMillis(toRequestDate(program.endDate))
  const applyStart = parsedMillis(applicationStartDate)
  const applyEnd = parsedMillis(applicationEndDate)
  if (!applicationStartDate || !applicationEndDate || applyStart == null || applyEnd == null) {
    return {}
  }
  if (businessStart != null && applyStart < businessStart) return {}
  if (businessEnd != null && applyEnd > businessEnd) return {}
  return { applicationStartDate, applicationEndDate }
}

function mapPeriodStatusToLifecycle(periodStatus?: string): ProgramLifecycleStatus | undefined {
  // list DTO에 typed lifecycle이 없을 때만 — periodStatus → typed 리다이렉트
  return toTypedProgramLifecycleStatus(periodStatus)
}

function resolveListLifecycleStatus(dto: AdminProgramListItemDto): ProgramLifecycleStatus {
  return (
    toTypedProgramLifecycleStatus(dto.lifecycleStatus) ??
    mapPeriodStatusToLifecycle(dto.periodStatus) ??
    'scheduled'
  )
}

function baseProgramDefaults(partial: Partial<Program> & Pick<Program, 'id' | 'title'>): Program {
  const now = new Date().toISOString()
  return {
    sponsorId: DEFAULT_SPONSOR_ID,
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: DEFAULT_ROUNDS,
    startDate: now,
    endDate: now,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

export function mapAdminProgramListItemToProgram(dto: AdminProgramListItemDto): Program {
  // title = 생성/관리명. 목록 「프로그램명」표시는 mainTitle(대표명)을 쓴다.
  const title = dto.title?.trim() || dto.nameKo?.trim() || '제목 없음'
  const mainTitle = dto.mainTitle?.trim() || title
  const lifecycleStatus = resolveListLifecycleStatus(dto)
  const audienceFromApi = resolveAudienceFromApiFields({
    programType: dto.programType,
    applicationTargetMode: (dto as AdminProgramListItemDto & { applicationTargetMode?: string })
      .applicationTargetMode,
  })
  /** 목록 DTO가 내려주는 유일한 KPI — 봉사자 모집 인원 */
  const listVolunteerKpi =
    toOptionalNumber(dto.volunteerCapacity) ?? toOptionalNumber(dto.volunteerRecruitmentCount)

  const listTargetLevels = resolveListTargetLevels(dto)

  return baseProgramDefaults({
    id: toProgramId(dto.id ?? dto.uuid),
    title,
    mainTitle,
    titleEn: dto.titleEn?.trim() || undefined,
    ...resolveBusinessPeriodDates(dto),
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus,
    listDeleteBlocked: resolveProgramListDeleteBlocked({
      lifecycleStatus,
      participantApprovedCount: toOptionalNumber(dto.participantApprovedCount),
      approvedOrganizationApplicationCount: toOptionalNumber(
        dto.approvedOrganizationApplicationCount
      ),
      participatingSchoolCount:
        toOptionalNumber(dto.participatingSchoolCount) ??
        toOptionalNumber(dto.participatingOrganizationCount),
      participatingStudentCount: toOptionalNumber(dto.participatingStudentCount),
    }),
    targetLevel: listTargetLevels[0],
    targetLevels: listTargetLevels.length > 0 ? listTargetLevels : undefined,
    approvedStudentCount:
      toOptionalNumber(dto.participantApprovedCount) ??
      toOptionalNumber(dto.approvedOrganizationApplicationCount) ??
      toOptionalNumber(dto.applicantCount),
    ...mapListParticipantRecruitment(dto),
    instructors:
      toOptionalNumber(dto.instructorApprovedCount) ??
      toOptionalNumber(dto.instructorApplicantCount),
    instructorCapacity:
      toOptionalNumber(dto.instructorCapacity) ?? toOptionalNumber(dto.instructorRecruitmentCount),
    generalVolunteers: toOptionalNumber(dto.volunteerApprovedCount),
    participatingSchoolCount:
      toOptionalNumber(dto.participatingSchoolCount) ??
      toOptionalNumber(dto.participatingOrganizationCount),
    participatingStudentCount: toOptionalNumber(dto.participatingStudentCount),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    ...readProgramAuditNames(dto),
    ...(listVolunteerKpi != null
      ? {
          generalCommonInfo: {
            /** 나머지 KPI는 목록 응답에 없다 — 상세 조회에서 채운다 (detail adapter도 `?? 0`) */
            kpi: {
              finalParticipants: 0,
              instructorCount: 0,
              volunteerCount: listVolunteerKpi,
              finalSchools: 0,
              finalClasses: 0,
            },
          },
        }
      : {}),
    ...(audienceFromApi
      ? {
          category: audienceFromApi.category,
          generalProgramAudience: audienceFromApi.audience,
        }
      : {}),
    backendProgramType: dto.programType,
  })
}

/** 조회 typed 대상 행 — UJAT 아님 + 반기 아닌 봉사 모집 행 정확히 1개 */
function singleTypedVolunteerInterviewRow(
  dto: ProgramResponse
):
  | { interviewEnabled?: boolean | null; interviewConfig?: RecruitmentInterviewConfig | null }
  | undefined {
  if ((dto.programType ?? '').toUpperCase() === 'UJAT') return undefined
  const volunteerRows = (dto.recruitments ?? []).filter(
    row =>
      (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
      row.recruitTerm !== 'FIRST_HALF' &&
      row.recruitTerm !== 'SECOND_HALF'
  )
  if (volunteerRows.length !== 1) return undefined
  return volunteerRows[0] as {
    interviewEnabled?: boolean | null
    interviewConfig?: RecruitmentInterviewConfig | null
  }
}

/**
 * 일반 봉사 모집 행 typed `interviewConfig`(V80) 우선 — overlay 면접 키를 typed 값으로 맞춘다.
 * typed 가 null 이거나 overlay fallback 과 같으면 overlay 그대로. UJAT·반기 행은 건드리지 않는다.
 * typed 가 있으면 overlay 면접 여부(`recruit.volunteer.interviewRequired`)도 행 interviewEnabled 로 맞춘다
 * (part7부터 저장 본문에 그 키를 보내지 않아 서버 overlay 값이 오래될 수 있다).
 */
function applyTypedVolunteerInterviewToServiceDetail<
  T extends { registrationOverlay?: Record<string, unknown> },
>(serviceDetail: T, dto: ProgramResponse): T {
  const row = singleTypedVolunteerInterviewRow(dto)
  if (!row) return serviceDetail
  const config = row.interviewConfig
  let overlay = applyTypedVolunteerInterviewToOverlay(serviceDetail.registrationOverlay, config)
  if (config != null && typeof row.interviewEnabled === 'boolean') {
    const required = row.interviewEnabled ? 'yes' : 'no'
    if (overlay?.['recruit.volunteer.interviewRequired'] !== required) {
      overlay = { ...(overlay ?? {}), 'recruit.volunteer.interviewRequired': required }
    }
  }
  return overlay === serviceDetail.registrationOverlay
    ? serviceDetail
    : { ...serviceDetail, registrationOverlay: overlay }
}

/** 상세 Program typed 면접 필드 — typed 가 있으면 면접 여부도 행 interviewEnabled 가 SSOT */
function typedVolunteerInterviewProgramFields(
  dto: ProgramResponse
): Pick<Program, 'volunteerInterviewConfigFromServer' | 'generalVolunteerInterviewEnabled'> {
  const row = singleTypedVolunteerInterviewRow(dto)
  if (!row) return {}
  const config = row.interviewConfig ?? null
  return {
    volunteerInterviewConfigFromServer: config,
    ...(config != null && typeof row.interviewEnabled === 'boolean'
      ? { generalVolunteerInterviewEnabled: row.interviewEnabled }
      : {}),
  }
}

export function mapAdminProgramDetailToProgram(dto: ProgramResponse): Program {
  const dtoWithExtras = dto as ProgramResponse & {
    nameKo?: string
    applicationTargetMode?: string
    businessField?: string
  }
  const title =
    dto.title?.trim() || dto.mainTitle?.trim() || dtoWithExtras.nameKo?.trim() || '제목 없음'
  const id = toProgramId(dto.id)
  const now = new Date().toISOString()
  const parsedServiceDetail = parseGeneralProgramServiceDetailJson(dto.serviceDetailJson)
  const serviceDetail = applyTypedVolunteerInterviewToServiceDetail(parsedServiceDetail, dto)
  const dtoDetailedProgramName = dto.detailedProgramName?.trim()
  const generalCommonInfoBase = applyResolvedVenueKindToCommonInfo(
    applySettlementPolicyToCommonInfo(
      {
        ...serviceDetail.generalCommonInfo,
        ...(dtoDetailedProgramName ? { detailedProgramName: dtoDetailedProgramName } : {}),
      },
      dto.settlementPolicy
    ),
    { institutionType: dto.institutionType as Program['institutionType'], venue: dto.venue }
  )
  const generalCommonInfo = generalCommonInfoBase
    ? {
        ...generalCommonInfoBase,
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
      }
  /** otherNotes ≠ remarks — 모집 비고와 분리 (BE otherMatters) */
  const otherNotes =
    resolveOtherNotesFromProgramResponse({
      otherMatters: dto.otherMatters,
      otherNotes: serviceDetail.otherNotes,
    }) || undefined
  const audienceFromApi = resolveAudienceFromApiFields({
    audience: serviceDetail.generalProgramAudience,
    programType: dto.programType,
    applicationTargetMode: dtoWithExtras.applicationTargetMode,
    participantTypes: serviceDetail.generalParticipantTypes,
    category: dto.category,
  })
  const dtoTargetLevels = Array.isArray(dto.targetLevels)
    ? dto.targetLevels.map(v => String(v))
    : undefined
  const jsonTargetLevels = serviceDetail.targetLevels
  // Admin 컬럼이 있으면(빈 배열 포함) SSOT. 키가 없을 때만 JSON·라벨 legacy hydrate.
  const columnSource = Array.isArray(dtoTargetLevels)
    ? dtoTargetLevels
    : Array.isArray(jsonTargetLevels)
      ? jsonTargetLevels
      : undefined
  const detailTargetLevels = resolvePersistedProgramTargetLevels({
    targetLevels: columnSource,
    targetLevel: dto.targetLevel,
    registrationOverlay: serviceDetail.registrationOverlay,
    generalCommonInfo,
  })

  const mapped = baseProgramDefaults({
    id,
    sponsorId: dto.sponsorId ?? DEFAULT_SPONSOR_ID,
    title,
    mainTitle: dto.mainTitle ?? title,
    type: (dto.type as ProgramType | undefined) ?? 'offline',
    format: (dto.format as ProgramFormat | undefined) ?? 'workshop',
    category:
      audienceFromApi?.category ?? (dto.category as ProgramCategory | undefined) ?? 'school',
    description: dto.description,
    rounds:
      dto.rounds?.map((round, index) => ({
        id: round.id ? String(round.id) : `${id}-round-${index + 1}`,
        programId: id,
        roundNumber: round.roundNumber ?? index + 1,
        startDate: round.startDate ?? dto.startDate ?? now,
        endDate: round.endDate ?? dto.endDate ?? now,
        capacity: round.capacity,
        classCount: round.classCount,
        status: (round.status as Status | undefined) ?? 'pending',
        curriculum: round.curriculum,
        deliveryType: round.deliveryType as Program['rounds'][number]['deliveryType'],
      })) ?? DEFAULT_ROUNDS,
    ...resolveBusinessPeriodDates(dto),
    applicationStartDate: dto.applicationStartDate,
    applicationEndDate: dto.applicationEndDate,
    businessArea:
      normalizeProgramBusinessAreaValue(dto.businessArea || dtoWithExtras.businessField) ||
      undefined,
    titleEn: dto.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district,
    ips: dto.ips as Program['ips'],
    institutionType: dto.institutionType as Program['institutionType'],
    ipOwned: dto.ipOwned,
    courseDeliveredBy: dto.courseDeliveredBy as Program['courseDeliveredBy'],
    partnerInvolvement: dto.partnerInvolvement,
    programCategory: dto.programCategory,
    programChannel: dto.programChannel,
    educationTime: dto.educationTime,
    teamDivision: dto.teamDivision,
    educationProcess: dto.educationProcess,
    maleParticipants: dto.maleParticipants,
    femaleParticipants: dto.femaleParticipants,
    totalParticipants: dto.totalParticipants,
    generalVolunteers: dto.generalVolunteers,
    staffVolunteers: dto.staffVolunteers,
    returningVolunteers: dto.returningVolunteers,
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
    otherNotes: otherNotes?.trim() || undefined,
    recruitmentTargetDetail: dto.recruitmentTargetDetail?.trim() || undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    ...omitProgramAuditNameFields(serviceDetail),
    ...readProgramAuditNames(dto),
    generalCommonInfo,
    detailedProgramId: dto.detailedProgramId != null ? String(dto.detailedProgramId) : undefined,
    targetLevel: detailTargetLevels[0],
    targetLevels:
      columnSource !== undefined || detailTargetLevels.length > 0 ? detailTargetLevels : undefined,
    // typed lifecycleStatus SSOT — serviceDetailJson 값으로 덮지 않음
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus: toTypedProgramLifecycleStatus(dto.lifecycleStatus) ?? undefined,
    // serviceDetail 스프레드 이후에도 programType 기반 대분류를 유지
    ...(audienceFromApi
      ? {
          category: audienceFromApi.category,
          generalProgramAudience: serviceDetail.generalProgramAudience ?? audienceFromApi.audience,
        }
      : {}),
    backendProgramType: dto.programType,
    programRecruitments: toProgramRecruitmentWindows(dto.recruitments),
    ...((dto.programType ?? '').toUpperCase() === 'UJAT'
      ? {}
      : {
          volunteerInterviewScheduleInfoFromServer:
            parsedServiceDetail.generalCommonInfo?.volunteerInterviewScheduleInfo ?? null,
        }),
    ...typedVolunteerInterviewProgramFields(dto),
  })

  return applyBusinessPeriodHistoriesFromDto(
    hydrateRecruitmentWindowsOntoProgram(
      hydrateGeneralRecruitmentInfoFromRows(
        applyResolvedAnnouncementTitle(
          applyParticipantRecruitmentColumnsFromResponse(mapped, dto),
          {
            serviceDetailJson: dto.serviceDetailJson,
            overlay: serviceDetail.registrationOverlay,
          }
        )
      )
    ),
    dto
  )
}

export function filterGeneralProgramsByOverviewStatus(
  programs: Program[],
  statusFilter: GeneralProgramOverviewStatusFilter | null
): Program[] {
  if (!statusFilter) return programs
  return programs.filter(program => programMatchesProgressPhase(program, statusFilter))
}

const LEGACY_ROUNDS_PROGRAM_TYPES = new Set([
  'UJAT',
  'COMPANY_SCHOOL',
  'ONE_COMPANY_ONE_SCHOOL',
  'TRAINED_TEACHER',
  'TRAINED_TEACHER_PROGRAM',
  'EDUCATED_TEACHER',
  'EDUCATED_TEACHER_PROGRAM',
])

/**
 * 일반(GENERAL) 레거시 `rounds` 전송 중단 — create/update/PATCH 본문에서 키 자체를 생략한다
 * (`rounds: []`도 보내지 않음). 내부 Program/RHF 상태의 rounds는 그대로 둔다.
 * 이 adapter를 같이 타는 1사1교·UJAT·교육받은 교사는 기존처럼 rounds를 보낸다.
 */
function shouldSendLegacyProgramRounds(program: Program): boolean {
  const type = program.backendProgramType?.trim().toUpperCase() ?? ''
  if (LEGACY_ROUNDS_PROGRAM_TYPES.has(type)) return true
  if (isCompanySchoolProgram(program)) return true
  const id = program.id != null ? String(program.id) : ''
  return looksLikeTrainedTeacherProgramId(id) || id.startsWith('trained-teachers-local-')
}

function mapProgramRoundsToUpdateRequest(
  program: Program
): ProgramUpdateRequestRoundsItem[] | undefined {
  const rounds = mapProgramRoundsToRequest(program)
  return rounds as ProgramUpdateRequestRoundsItem[] | undefined
}

function mapProgramRoundsToRequest(program: Program): ProgramCreateRequest['rounds'] {
  return program.rounds?.map(round => ({
    roundNumber: round.roundNumber,
    startDate: toRequestDate(round.startDate),
    endDate: toRequestDate(round.endDate),
    capacity: round.capacity,
    classCount: round.classCount,
    status: round.status,
    curriculum: round.curriculum,
    deliveryType: round.deliveryType,
  }))
}


/**
 * BE canonical `recruitments[]` — 참여자 유형별 ACTIVE 모집 row.
 * `generalParticipantTypes`에 volunteer가 있으면 VOLUNTEER ACTIVE 필수
 * (`GENERAL_PROGRAM_ACTIVE_VOLUNTEER_RECRUITMENT_REQUIRED`).
 */
function recruitmentOperationRequestDates(
  program: Program,
  recruitmentType: 'PARTICIPANT' | 'INSTRUCTOR' | 'VOLUNTEER'
): Pick<ProgramRecruitmentRequest, 'operationStartDate' | 'operationEndDate'> {
  const audience =
    recruitmentType === 'INSTRUCTOR'
      ? 'instructor'
      : recruitmentType === 'VOLUNTEER'
        ? 'volunteer'
        : 'participant'
  const iso = resolveAudienceProgramOperationIsoRange(program, audience)
  return {
    operationStartDate: toRequestDate(iso.start),
    operationEndDate: toRequestDate(iso.end),
  }
}

export function mapGeneralProgramRecruitmentsToRequest(
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  const types = program.generalParticipantTypes ?? []
  const audienceMode = mapAudienceToApplicationTargetMode(program.generalProgramAudience, types)
  const out: ProgramRecruitmentRequest[] = []

  const wantsOrg =
    types.includes('school_institution') || (types.length === 0 && audienceMode !== 'INDIVIDUAL')
  const wantsIndividual =
    types.includes('individual') || (types.length === 0 && audienceMode === 'INDIVIDUAL')

  if (wantsOrg) {
    out.push({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.PARTICIPANT,
      targetType: 'ORGANIZATION',
      status: ProgramRecruitmentRequestStatus.ACTIVE,
      startAt: toRequestDate(program.applicationStartDate),
      endAt: toRequestDate(program.applicationEndDate),
      ...recruitmentOperationRequestDates(program, 'PARTICIPANT'),
      maxCount: program.totalParticipants ?? program.approvedStudentCount ?? undefined,
      selectionMethod: 'ADMIN_REVIEW',
    })
  }

  if (wantsIndividual) {
    out.push({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.PARTICIPANT,
      targetType: 'INDIVIDUAL',
      status: ProgramRecruitmentRequestStatus.ACTIVE,
      startAt: toRequestDate(program.applicationStartDate),
      endAt: toRequestDate(program.applicationEndDate),
      ...recruitmentOperationRequestDates(program, 'PARTICIPANT'),
      maxCount: program.totalParticipants ?? program.approvedStudentCount ?? undefined,
      selectionMethod: 'ADMIN_REVIEW',
    })
  }

  if (types.includes('teacher_instructor')) {
    out.push({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.INSTRUCTOR,
      targetType: 'TEACHER',
      status: ProgramRecruitmentRequestStatus.ACTIVE,
      startAt: toRequestDate(
        program.instructorApplicationStartDate ?? program.applicationStartDate
      ),
      endAt: toRequestDate(program.instructorApplicationEndDate ?? program.applicationEndDate),
      ...recruitmentOperationRequestDates(program, 'INSTRUCTOR'),
      maxCount: program.instructors ?? program.instructorCapacity ?? undefined,
      selectionMethod: 'ADMIN_REVIEW',
    })
  }

  if (types.includes('volunteer')) {
    out.push({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      status: ProgramRecruitmentRequestStatus.ACTIVE,
      startAt: toRequestDate(program.volunteerApplicationStartDate ?? program.applicationStartDate),
      endAt: toRequestDate(program.volunteerApplicationEndDate ?? program.applicationEndDate),
      ...recruitmentOperationRequestDates(program, 'VOLUNTEER'),
      maxCount: program.generalVolunteers ?? undefined,
      selectionMethod: 'ADMIN_REVIEW',
      // 면접 ON/OFF 스위치는 행 interviewEnabled(BE program_recruitment.interview_enabled). 값이 있을 때만 싣는다(null 은 BE 가 유지).
      // UJAT 운영 봉사 행은 false 를 거절한다(UJAT_VOLUNTEER_INTERVIEW_REQUIRED) — UJAT 는 자체 adapter 가 true 로 보낸다.
      ...(typeof program.generalVolunteerInterviewEnabled === 'boolean' &&
      (program.backendProgramType ?? '').toUpperCase() !== 'UJAT'
        ? { interviewEnabled: program.generalVolunteerInterviewEnabled }
        : {}),
    })
  }

  return out.length > 0 ? attachRecruitmentRowIdentity(out, program.programRecruitments) : undefined
}

function participantTypeCoveredByRows(
  type: string,
  rows: NonNullable<Program['programRecruitments']>
): boolean {
  return rows.some(row => {
    const recruitmentType = (row.recruitmentType ?? '').toUpperCase()
    const applicationType =
      row.applicationType?.toUpperCase() ??
      resolveRecruitmentApplicationType(row.recruitmentType, row.targetType)
    if (type === 'teacher_instructor') return recruitmentType === 'INSTRUCTOR'
    if (type === 'volunteer') return recruitmentType === 'VOLUNTEER'
    if (type === 'individual') {
      return recruitmentType === 'PARTICIPANT' && applicationType === 'INDIVIDUAL'
    }
    if (type === 'school_institution') {
      return recruitmentType === 'PARTICIPANT' && applicationType === 'ORGANIZATION'
    }
    return false
  })
}

/**
 * 이미 저장된 모집 구조에 새 참여자 유형만 붙인다.
 * 기존 행은 id와 구조 필드만 다시 실어 삭제로 읽히지 않게 하고, 유형 교체는 만들지 않는다.
 * 저장된 행 id가 없으면 부분 목록으로 기존 행이 빠질 수 있어 보내지 않는다.
 */
export function buildParticipantRecruitmentAdditionRequests(
  merged: Program,
  existing: Program
): ProgramRecruitmentRequest[] | null {
  const savedRows = (existing.programRecruitments ?? []).filter(row => row.id != null)
  if (savedRows.length === 0) return null
  const before = new Set(existing.generalParticipantTypes ?? [])
  const after = merged.generalParticipantTypes ?? []
  const hasParticipantRow = savedRows.some(
    row => (row.recruitmentType ?? '').toUpperCase() === 'PARTICIPANT'
  )
  const added = after.filter(type => {
    if (before.has(type) || participantTypeCoveredByRows(type, savedRows)) return false
    if (hasParticipantRow && (type === 'individual' || type === 'school_institution')) return false
    return true
  })
  if (added.length === 0) return null
  const created =
    mapGeneralProgramRecruitmentsToRequest({
      ...merged,
      generalParticipantTypes: added,
      programRecruitments: [],
    })?.map(row => {
      const { id: _id, ...rest } = row
      return rest
    }) ?? []
  if (created.length === 0) return null
  return [...recruitmentRowIdentityRequests(savedRows), ...created]
}

/** 새 모집 단위만 상세 JSON 유형에 더한다. 기존 유형은 빼거나 바꾸지 않는다. */
function participantTypesKeptWithAdditions(
  existing: Program,
  additions: ProgramRecruitmentRequest[] | null
): Program['generalParticipantTypes'] {
  const kept = [...(existing.generalParticipantTypes ?? [])]
  if (!additions?.length) return existing.generalParticipantTypes
  for (const row of additions) {
    if (row.id != null) continue
    const type =
      row.recruitmentType === 'INSTRUCTOR'
        ? 'teacher_instructor'
        : row.recruitmentType === 'VOLUNTEER'
          ? 'volunteer'
          : row.applicationType === 'INDIVIDUAL'
            ? 'individual'
            : row.applicationType === 'ORGANIZATION'
              ? 'school_institution'
              : null
    if (type && !kept.includes(type)) kept.push(type)
  }
  return kept
}

function copyAudienceOf(row: ProgramRecruitmentRequest): RecruitmentCopyAudience {
  if (row.recruitmentType === ProgramRecruitmentRequestRecruitmentType.INSTRUCTOR)
    return 'instructor'
  if (row.recruitmentType === ProgramRecruitmentRequestRecruitmentType.VOLUNTEER) return 'volunteer'
  return 'participant'
}

function overlayForGeneralCreateMedia(program: Program): Record<string, unknown> {
  return {
    ...(program.registrationOverlay ?? {}),
    ...(program.ujatRegistrationOverlay ?? {}),
  }
}

/** 생성 시 모집 탭별 문구·담당자·미디어를 각 행에 담는다. 이후 읽기는 행 값만 쓴다. */
function withGeneralCreateRowCopy(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramCreateRequestBody['recruitments'] {
  const copied = rows?.map(row => {
    const audience = copyAudienceOf(row)
    const display = resolveGeneralRecruitDetailDisplayProgram(program, audience)
    const contact = createRowContactOf(program, audience)
    return {
      ...row,
      programDescription: display.description || undefined,
      recruitmentGuide: display.recruitmentGuide || undefined,
      applicationMethod: display.applicationMethod || undefined,
      learningSupportContent: display.learningSupportContent || undefined,
      additionalContentHtml: display.additionalContentHtml || undefined,
      ...contact,
    }
  })
  return withRecruitmentCreateMedia(copied, overlayForGeneralCreateMedia(program), 'general')
}

/** 담당자·비고는 각 모집 탭 `*RecruitmentInfo`에서만 읽는다. 프로그램 `managerName`·기타사항을 비고로 쓰지 않는다. */
function createRowContactOf(
  program: Program,
  audience: RecruitmentCopyAudience
): Pick<ProgramRecruitmentRequest, 'contactName' | 'contactPhone' | 'contactEmail' | 'remarks'> & {
  otherMatters?: string
} {
  const common = program.generalCommonInfo
  const info =
    audience === 'instructor'
      ? common?.instructorRecruitmentInfo
      : audience === 'volunteer'
        ? common?.volunteerRecruitmentInfo
        : common?.participantRecruitmentInfo
  const participantContactName =
    audience === 'participant' ? common?.participantRecruitmentInfo?.contactName : undefined
  const notesNotApplicable =
    info != null && 'notesNotApplicable' in info && info.notesNotApplicable === true
  const otherMatters =
    audience !== 'participant' && info != null && 'otherMatters' in info
      ? info.otherMatters?.trim() || undefined
      : undefined
  return {
    contactName:
      info?.contactOrganizationName?.trim() || participantContactName?.trim() || undefined,
    contactPhone: toRequestPhone(info?.contactPhone ?? info?.inquiryTel ?? info?.tel) || undefined,
    contactEmail: (info?.contactEmail ?? info?.inquiryEmail ?? info?.email)?.trim() || undefined,
    remarks: notesNotApplicable ? undefined : info?.remarks?.trim() || undefined,
    ...(otherMatters ? { otherMatters } : {}),
  }
}

function resolveSponsorIdsForAssignmentWire(program: Program): string[] {
  const common = program.generalCommonInfo
  if (common && Object.prototype.hasOwnProperty.call(common, 'sponsorManagementIds')) {
    return (common.sponsorManagementIds ?? []).map(id => String(id).trim()).filter(Boolean)
  }
  if (common?.sponsorManagementId)
    return [String(common.sponsorManagementId).trim()].filter(Boolean)
  if (program.sponsorId) return [String(program.sponsorId).trim()].filter(Boolean)
  return []
}

function mapProgramSponsorAssignments(program: Program) {
  const sponsorIdsFromForm = resolveSponsorIdsForAssignmentWire(program)
  const contactRefs = normalizeSponsorManagerContactIds({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
  })
  return buildProgramSponsorAssignmentsReplaceWire(sponsorIdsFromForm, contactRefs)
}

function sponsorAssignmentWireKey(row: {
  sponsorId: string
  sponsorContactIds?: readonly string[]
}) {
  const contacts = [...(row.sponsorContactIds ?? [])].sort().join(',')
  return `${row.sponsorId}::${contacts}`
}

function sponsorAssignmentWiresEqual(
  next: ReadonlyArray<{ sponsorId: string; sponsorContactIds?: readonly string[] }>,
  existing: ReadonlyArray<{ sponsorId: string; sponsorContactIds?: readonly string[] }>
): boolean {
  if (next.length !== existing.length) return false
  const left = next.map(sponsorAssignmentWireKey).sort()
  const right = existing.map(sponsorAssignmentWireKey).sort()
  return left.every((key, index) => key === right[index])
}

function mapProgramSponsorAssignmentsForPatch(
  merged: Program,
  patch: Partial<Program>,
  existing: Program
) {
  return mapProgramSponsorAssignments({
    ...merged,
    sponsorId: patchHasKey(patch, 'sponsorId') ? merged.sponsorId : existing.sponsorId,
    generalCommonInfo: {
      ...(existing.generalCommonInfo ?? {}),
      ...(patch.generalCommonInfo ?? {}),
    },
  })
}

/** BE 전화번호 검증은 하이픈 포함 형식만 통과한다. */
function toRequestPhone(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  if (!isValidKoreanPhoneNumber(trimmed)) return trimmed
  return formatKoreanPhoneNumber(trimmed)
}

/** Admin create/update — 컬럼 `targetLevels`가 있으면 그대로. 없을 때만 legacy hydrate. */
function resolveRequestTargetLevels(
  program: Program,
  fallback?: Program
): ProgramUpdateRequestTargetLevelsItem[] | undefined {
  if (Array.isArray(program.targetLevels)) {
    return [
      ...resolvePersistedProgramTargetLevels(program),
    ] as ProgramUpdateRequestTargetLevelsItem[]
  }
  const resolved = resolvePersistedProgramTargetLevels(program)
  if (resolved.length > 0) {
    return [...resolved] as ProgramUpdateRequestTargetLevelsItem[]
  }
  if (fallback) {
    if (Array.isArray(fallback.targetLevels)) {
      return [
        ...resolvePersistedProgramTargetLevels(fallback),
      ] as ProgramUpdateRequestTargetLevelsItem[]
    }
    const fromFallback = resolvePersistedProgramTargetLevels(fallback)
    if (fromFallback.length > 0) {
      return [...fromFallback] as ProgramUpdateRequestTargetLevelsItem[]
    }
  }
  return undefined
}

function mapProgramCoreFieldsToRequest(program: Program): ProgramUpdateRequestBody {
  const targetLevels = resolveRequestTargetLevels(program)
  const targetLevel = targetLevels?.[0]
  const applicationTargetMode = mapAudienceToApplicationTargetMode(
    program.generalProgramAudience,
    program.generalParticipantTypes
  )
  const detailedProgramName = program.generalCommonInfo?.detailedProgramName
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  const sponsors = mapProgramSponsorAssignments(program)
  const primarySponsorId =
    sponsors.find(s => (s.sponsorContactIds?.length ?? 0) > 0)?.sponsorId ||
    sponsors[0]?.sponsorId ||
    (program.sponsorId != null ? String(program.sponsorId) : undefined)

  const body: ProgramUpdateRequestBody = {
    sponsorId: primarySponsorId,
    sponsors: sponsors.length > 0 ? sponsors : undefined,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: toRequestDate(program.startDate),
    endDate: toRequestDate(program.endDate),
    businessStartDate: toRequestDate(program.startDate),
    businessEndDate: toRequestDate(program.endDate),
    ...applicationDatesInsideBusinessPeriod(program),
    recruitments: mapGeneralProgramRecruitmentsToRequest(program),
    businessArea,
    detailedProgramId: parseDetailedProgramMasterId(program.detailedProgramId),
    titleEn: program.titleEn,
    mainTitle: program.mainTitle ?? program.title,
    textbookName: omitIfDetailedProgramNameAlias(
      program.textbookName,
      detailedProgramName,
      derivedTextbookNameAliases(program)
    ),
    textbookNameEn: program.textbookNameEn,
    schoolId: program.schoolId,
    district: program.district,
    ips: program.ips,
    targetLevel,
    targetLevels,
    institutionType: program.institutionType,
    ipOwned: program.ipOwned,
    courseDeliveredBy: program.courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement,
    programCategory: program.programCategory ?? undefined,
    programChannel: program.programChannel ?? undefined,
    educationTime: program.educationTime,
    teamDivision: omitIfDetailedProgramNameAlias(program.teamDivision, detailedProgramName),
    educationProcess: program.educationProcess,
    maleParticipants: program.maleParticipants,
    femaleParticipants: program.femaleParticipants,
    totalParticipants:
      program.totalParticipants ??
      program.approvedStudentCount ??
      program.generalCommonInfo?.kpi?.finalParticipants,
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
    contactPhone: toRequestPhone(program.contactPhone),
    oneLineIntroduction: program.oneLineIntroduction,
    keyVisualImage: program.keyVisualImage ?? program.posterImage,
    settlementRuleId: program.settlementRuleId,
    applicationPathId: program.applicationPathId,
    additionalContentHtml: program.additionalContentHtml,
    recruitmentGuide: program.recruitmentGuide,
    learningSupportContent: program.learningSupportContent,
    attachmentFileNames: program.attachmentFileNames,
    // BE 필수 — serviceDetailJson 앞쪽에 둬 로깅·디버깅 시 잘리지 않게
    applicationTargetMode,
    ...(shouldSendLegacyProgramRounds(program)
      ? { rounds: mapProgramRoundsToUpdateRequest(program) }
      : {}),

    serviceDetailJson: serializeGeneralProgramServiceDetailJson(program),
  }
  assignProgramPaymentItemsToWriteRequest({ body, program })
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'full',
    merged: program,
    existing: program,
  })
  return body
}

export function mapGeneralProgramToCreateRequest(program: Program): ProgramCreateRequestBody {
  const core = mapProgramCoreFieldsToRequest(program)
  const body = omitNullRecordValues({
    ...core,
    recruitments: withGeneralCreateRowCopy(core.recruitments ?? undefined, program),
    // OpenAPI `sponsorId`는 string — 숫자 id가 number로 직렬화되면 BE 검증/DB 오류 유발 가능
    sponsorId: core.sponsorId != null ? String(core.sponsorId) : undefined,
    programType: resolveGeneralProgramCreateProgramType(
      program.generalProgramAudience,
      program.generalParticipantTypes
    ),
    businessStartDate: toRequestDate(program.startDate),
    businessEndDate: toRequestDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }) as ProgramCreateRequestBody
  return withTypedVolunteerInterviewConfigForCreate(body, program)
}

function readRequestServiceDetail(serviceDetailJson: string | undefined): Record<string, unknown> {
  if (!serviceDetailJson) return {}
  try {
    const parsed: unknown = JSON.parse(serviceDetailJson)
    return parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function recordOrEmpty(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function nonEmptyText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** 생성 봉사 행 면접 기간 — 폼 nested(volunteerRecruitmentInfo) → overlay interviewRangeSeal 순 */
function volunteerInterviewPeriodForCreate(
  detail: Record<string, unknown>,
  overlay: Record<string, unknown>
): { interviewStartAt?: string; interviewEndAt?: string } {
  const info = recordOrEmpty(recordOrEmpty(detail.generalCommonInfo).volunteerRecruitmentInfo)
  const seal = recordOrEmpty(overlay['recruit.volunteer.interviewRangeSeal'])
  const start = nonEmptyText(info.interviewStartDate) ?? nonEmptyText(seal.start)
  const end = nonEmptyText(info.interviewEndDate) ?? nonEmptyText(seal.end)
  return {
    ...(start ? { interviewStartAt: start } : {}),
    ...(end ? { interviewEndAt: end } : {}),
  }
}

/**
 * 생성 본문 — 봉사 모집 행(반기 아님)이 정확히 1개면 그 행에 면접 정본을 싣는다.
 * - `interviewEnabled`: 면접 ON/OFF(BE 스위치). 폼 값(generalVolunteerInterviewEnabled → overlay interviewRequired), 없으면 false
 * - `interviewConfig`: 이번 생성 overlay 로 만든 전체 typed(부분 객체 없음, specific/applied 각각). OFF 면 `{schemaVersion:1}`
 * - `interviewStartAt`/`interviewEndAt`: 면접 ON 이고 폼에 면접 기간이 있을 때만
 * serviceDetailJson 에서는 BE 가 typed 로 만드는 `generalCommonInfo.volunteerInterviewScheduleInfo` 와
 * typed·행 필드에 같은 정보가 있는 overlay 봉사 면접 키를 뺀다(`omitVolunteerInterviewSaveKeysFromServiceDetailJson`).
 * 배포 순서: BE 2026-10-25 이후(생성 interviewConfig 반영).
 */
function withTypedVolunteerInterviewConfigForCreate(
  body: ProgramCreateRequestBody,
  program: Program
): ProgramCreateRequestBody {
  if (
    (body.programType ?? '').toUpperCase() === 'UJAT' ||
    (program.backendProgramType ?? '').toUpperCase() === 'UJAT'
  )
    return body
  const rows = body.recruitments ?? []
  const volunteerIndexes = rows
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row }) =>
        (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
        row.recruitTerm !== 'FIRST_HALF' &&
        row.recruitTerm !== 'SECOND_HALF'
    )
  if (volunteerIndexes.length !== 1) return body
  const target = volunteerIndexes[0]!.index
  const detail = readRequestServiceDetail(body.serviceDetailJson)
  const overlay = recordOrEmpty(recordOrEmpty(detail.registration).overlay)
  // 전체 객체(빈 배열·null 도 명시) — BE interviewConfig 는 객체 단위 저장
  const interviewConfig = completeVolunteerInterviewConfig(
    buildVolunteerInterviewConfigForSave(overlay)
  )
  const interviewEnabled =
    (typeof program.generalVolunteerInterviewEnabled === 'boolean'
      ? program.generalVolunteerInterviewEnabled
      : undefined) ??
    volunteerInterviewRequiredFromOverlay(overlay) ??
    false
  const period = interviewEnabled ? volunteerInterviewPeriodForCreate(detail, overlay) : {}
  return {
    ...body,
    recruitments: rows.map((row, index) =>
      index === target
        ? ({ ...row, interviewEnabled, ...period, interviewConfig } as typeof row)
        : row
    ),
    serviceDetailJson: omitVolunteerInterviewSaveKeysFromServiceDetailJson(body.serviceDetailJson),
  }
}

const SERVICE_DETAIL_PROGRAM_KEYS = [
  'generalCommonInfo',
  'participatingSchoolCount',
  'approvedStudentCount',
  'totalParticipants',
  'generalParticipantTypes',
  'generalSurveyMenuKeys',
  'targetLevels',
  'generalProgramEducationStructure',
  'generalProgramSessionRound',
  'generalProgramAudience',
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'volunteerApplicationStartDate',
  'volunteerApplicationEndDate',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
  'generalParticipantInterviewEnabled',
  'generalVolunteerInterviewEnabled',
  'registrationOverlay',
] as const satisfies ReadonlyArray<keyof Program>

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

const RECRUITMENT_WINDOW_PATCH_KEYS = [
  'applicationStartDate',
  'applicationEndDate',
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'volunteerApplicationStartDate',
  'volunteerApplicationEndDate',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
  'generalParticipantInterviewEnabled',
  'generalVolunteerInterviewEnabled',
] as const satisfies ReadonlyArray<keyof Program>

/** 모집 탭 저장만 모집 창을 보낸다. 공통정보의 generalCommonInfo 복사본은 제외한다. */
function patchIncludesRecruitmentWindow(patch: Partial<Program>): boolean {
  return RECRUITMENT_WINDOW_PATCH_KEYS.some(key => patchHasKey(patch, key))
}

/** GET 마스킹 값(`김*원`, `010-****-1234`)을 PATCH로 되쓰지 않기 위함 */
function looksMaskedProgramPii(value: string | null | undefined): boolean {
  if (value == null) return false
  return value.includes('*')
}

/**
 * 공통·모집 정보 등 **부분 수정**용 — `patch`에 있는 도메인 키만 UpdateRequest에 실음.
 * rounds·curriculum·담당자(미변경/마스킹) 등 화면 밖 필드는 보내지 않음.
 */
function recruitmentTypeOf(
  recruitmentType: string | null | undefined
): ProgramRecruitmentEditType | null {
  if (
    recruitmentType === 'PARTICIPANT' ||
    recruitmentType === 'INSTRUCTOR' ||
    recruitmentType === 'VOLUNTEER'
  ) {
    return recruitmentType
  }
  return null
}

export type GeneralProgramUpdateSerializeOptions = {
  /** Independent PATCH 전용. 기본 legacy-merge 는 overlay-first 제품 경로 */
  overlayMerge?: 'legacy-merge' | 'nested-ssot'
}

function omittedNestedOverlayFallback(patch: Partial<Program>, existing: Program) {
  const common = patch.generalCommonInfo
  if (!common) {
    return {
      curriculumSessions: existing.generalCommonInfo?.curriculumSessions,
      scheduleDetails: existing.generalCommonInfo?.scheduleDetails,
    }
  }
  return {
    ...(!Object.prototype.hasOwnProperty.call(common, 'curriculumSessions')
      ? { curriculumSessions: existing.generalCommonInfo?.curriculumSessions }
      : {}),
    ...(!Object.prototype.hasOwnProperty.call(common, 'scheduleDetails')
      ? { scheduleDetails: existing.generalCommonInfo?.scheduleDetails }
      : {}),
  }
}

function mapProgramPatchFieldsToRequest(
  merged: Program,
  patch: Partial<Program>,
  existing: Program,
  serializeOptions?: GeneralProgramUpdateSerializeOptions
): ProgramUpdateRequestBody {
  const body: ProgramUpdateRequestBody = {}
  const has = (key: keyof Program) => patchHasKey(patch, key)

  if (has('sponsorId') || patchTouchesProgramSponsors(patch)) {
    const sponsors = mapProgramSponsorAssignmentsForPatch(merged, patch, existing)
    const existingSponsors = mapProgramSponsorAssignments(existing)
    const sponsorIdExplicitlyChanged =
      has('sponsorId') && String(merged.sponsorId ?? '') !== String(existing.sponsorId ?? '')
    // BE: sponsors 키 존재 = full replace. 의미적으로 미변경이면 키를 생략한다.
    if (sponsorIdExplicitlyChanged || !sponsorAssignmentWiresEqual(sponsors, existingSponsors)) {
      // PATCH 정본은 sponsors[]. 레거시 body.sponsorId 중복 전송은 하지 않는다.
      // Create·UJAT·1사1교 단수 DTO는 mapProgramCoreFieldsToRequest / 각 유형 adapter가 유지한다.
      body.sponsors = sponsors
    }
  }
  if (has('title')) body.title = merged.title
  if (has('type')) body.type = merged.type
  if (has('format')) body.format = merged.format
  if (has('category')) body.category = merged.category
  if (has('description')) body.description = merged.description
  if (has('startDate') || has('endDate')) {
    body.startDate = toRequestDate(merged.startDate)
    body.endDate = toRequestDate(merged.endDate)
    body.businessStartDate = toRequestDate(merged.startDate)
    body.businessEndDate = toRequestDate(merged.endDate)
  }
  const participantLocked = isRecruitmentTypeGeneralInfoClosed(existing, 'PARTICIPANT')
  const instructorLocked = isRecruitmentTypeGeneralInfoClosed(existing, 'INSTRUCTOR')
  const volunteerLocked = isRecruitmentTypeGeneralInfoClosed(existing, 'VOLUNTEER')
  const includeParticipantRecruitment =
    (has('applicationStartDate') || has('applicationEndDate')) && !participantLocked
  const includeInstructorRecruitment =
    (has('instructorApplicationStartDate') || has('instructorApplicationEndDate')) &&
    !instructorLocked
  const includeVolunteerRecruitment =
    (has('volunteerApplicationStartDate') || has('volunteerApplicationEndDate')) && !volunteerLocked

  if ((has('applicationStartDate') || has('applicationEndDate')) && !participantLocked) {
    const applicationDates = applicationDatesInsideBusinessPeriod(merged)
    if (applicationDates.applicationStartDate != null) {
      body.applicationStartDate = applicationDates.applicationStartDate
    }
    if (applicationDates.applicationEndDate != null) {
      body.applicationEndDate = applicationDates.applicationEndDate
    }
  }
  const windowRows =
    includeParticipantRecruitment || includeInstructorRecruitment || includeVolunteerRecruitment
      ? (mapGeneralProgramRecruitmentsToRequest({
          ...merged,
          // 운영 기간은 폼이 갱신한 행을 쓴다. 행이 없으면 기존 id·날짜를 유지한다.
          programRecruitments: has('programRecruitments')
            ? merged.programRecruitments
            : existing.programRecruitments,
        })?.filter(row => {
          const type = recruitmentTypeOf(row.recruitmentType)
          if (type === 'PARTICIPANT') return includeParticipantRecruitment
          if (type === 'INSTRUCTOR') return includeInstructorRecruitment
          if (type === 'VOLUNTEER') return includeVolunteerRecruitment
          return false
        }) ?? [])
      : []
  const copyRows = has('programRecruitments')
    ? buildRecruitmentRowCopyRequests(
        merged.programRecruitments,
        existing.programRecruitments,
        row => isRecruitmentStartLocked(row.startAt)
      )
    : []
  const recruitmentRows = mergeRecruitmentRowRequests(windowRows, copyRows)
  const recruitmentAdditions = buildParticipantRecruitmentAdditionRequests(merged, existing)
  const recruitments = mergeRecruitmentRowRequests(recruitmentAdditions ?? [], recruitmentRows)
  if (recruitments.length > 0) body.recruitments = recruitments
  if (has('businessArea')) {
    const businessArea = normalizeProgramBusinessAreaValue(merged.businessArea) || undefined
    body.businessArea = businessArea
  }
  if (has('detailedProgramId') || has('generalCommonInfo')) {
    body.detailedProgramId = parseDetailedProgramMasterId(merged.detailedProgramId)
  }
  if (has('titleEn')) body.titleEn = merged.titleEn
  if (has('mainTitle')) body.mainTitle = merged.mainTitle ?? merged.title
  if (has('textbookName')) {
    body.textbookName = omitIfDetailedProgramNameAlias(
      merged.textbookName,
      merged.generalCommonInfo?.detailedProgramName,
      derivedTextbookNameAliases(merged)
    )
  }
  if (has('textbookNameEn')) body.textbookNameEn = merged.textbookNameEn
  if (has('schoolId')) body.schoolId = merged.schoolId
  if (has('district')) body.district = merged.district
  if (has('ips')) body.ips = merged.ips
  if (has('targetLevel') || has('targetLevels')) {
    const formTargetLevels = merged.targetLevels?.filter(Boolean) ?? []
    const targetLevels = patchIncludesRecruitmentWindow(patch)
      ? formTargetLevels.length > 0
        ? [...formTargetLevels]
        : (resolveRequestTargetLevels(merged) ?? [])
      : (resolveRequestTargetLevels(merged) ?? [])
    body.targetLevels = targetLevels
    body.targetLevel = targetLevels[0]
  }
  if (has('institutionType') || has('generalCommonInfo')) {
    body.institutionType = merged.institutionType
  }
  if (has('ipOwned')) body.ipOwned = merged.ipOwned
  if (has('courseDeliveredBy')) body.courseDeliveredBy = merged.courseDeliveredBy
  if (has('partnerInvolvement')) body.partnerInvolvement = merged.partnerInvolvement
  if (has('programCategory')) body.programCategory = merged.programCategory ?? undefined
  if (has('programChannel')) body.programChannel = merged.programChannel ?? undefined
  if (has('educationTime')) body.educationTime = merged.educationTime
  if (has('teamDivision')) {
    body.teamDivision = omitIfDetailedProgramNameAlias(
      merged.teamDivision,
      merged.generalCommonInfo?.detailedProgramName
    )
  }
  if (has('educationProcess')) body.educationProcess = merged.educationProcess
  if (has('maleParticipants')) body.maleParticipants = merged.maleParticipants
  if (has('femaleParticipants')) body.femaleParticipants = merged.femaleParticipants
  if (has('totalParticipants') || has('approvedStudentCount') || has('generalCommonInfo')) {
    body.totalParticipants =
      merged.totalParticipants ??
      merged.approvedStudentCount ??
      merged.generalCommonInfo?.kpi?.finalParticipants
  }
  if (has('generalVolunteers')) body.generalVolunteers = merged.generalVolunteers
  if (has('staffVolunteers')) body.staffVolunteers = merged.staffVolunteers
  if (has('returningVolunteers')) body.returningVolunteers = merged.returningVolunteers
  if (has('generalTeachers')) body.generalTeachers = merged.generalTeachers
  if (has('educatedTeachers')) body.educatedTeachers = merged.educatedTeachers
  if (has('instructors')) body.instructors = merged.instructors
  if (has('managerName') && !looksMaskedProgramPii(merged.managerName)) {
    body.managerName = merged.managerName
  }
  if (has('venue') || has('generalCommonInfo')) body.venue = merged.venue
  if (has('curriculum')) body.curriculum = merged.curriculum
  if (has('contactEmail') && !looksMaskedProgramPii(merged.contactEmail)) {
    body.contactEmail = merged.contactEmail
  }
  if (has('contactPhone') && !looksMaskedProgramPii(merged.contactPhone)) {
    body.contactPhone = toRequestPhone(merged.contactPhone)
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
  if (has('rounds') && shouldSendLegacyProgramRounds(merged)) {
    body.rounds = mapProgramRoundsToUpdateRequest(merged)
  }


  const detailSource =
    has('generalProgramAudience') || has('generalParticipantTypes')
      ? {
          ...merged,
          generalProgramAudience: existing.generalProgramAudience,
          generalParticipantTypes: participantTypesKeptWithAdditions(
            existing,
            recruitmentAdditions
          ),
        }
      : merged

  const touchesServiceDetail = SERVICE_DETAIL_PROGRAM_KEYS.some(
    key => key !== 'generalProgramAudience' && key !== 'generalParticipantTypes' && has(key)
  )
  if (touchesServiceDetail) {
    const touchesTargetLevels = has('targetLevel') || has('targetLevels')
    const persistedTargetLevels = touchesTargetLevels
      ? patchIncludesRecruitmentWindow(patch) && (merged.targetLevels?.length ?? 0) > 0
        ? [...(merged.targetLevels ?? [])]
        : resolveRequestTargetLevels(merged)
      : resolveRequestTargetLevels(detailSource, existing)
    const serializeSource =
      persistedTargetLevels != null
        ? { ...detailSource, targetLevels: persistedTargetLevels }
        : detailSource
    const omitUnchangedWageOverlay = wageCommonInfoFieldsUnchanged(
      serializeSource.generalCommonInfo,
      existing.generalCommonInfo
    )
    const serializeProgram = omitUnchangedWageFieldsFromProgramForServiceDetail(
      serializeSource,
      existing
    )
    body.serviceDetailJson = serializeGeneralProgramServiceDetailJson(serializeProgram, {
      omitRecruitmentWindow: !patchIncludesRecruitmentWindow(patch),
      omitUnchangedWageOverlay,
      overlayMerge: serializeOptions?.overlayMerge,
      overlayNestedFallback:
        serializeOptions?.overlayMerge === 'nested-ssot'
          ? omittedNestedOverlayFallback(patch, existing)
          : undefined,
      overlayMergeSource:
        serializeOptions?.overlayMerge === 'nested-ssot'
          ? {
              ...serializeProgram,
              generalCommonInfo: {
                ...(existing.generalCommonInfo ?? {}),
                ...(patch.generalCommonInfo ?? {}),
              },
              // 상세 공통 정보가 명시한 overlay sidecar(교육 진행 장소 등)는 patch 우선
              registrationOverlay:
                patch.registrationOverlay ??
                existing.registrationOverlay ??
                serializeProgram.registrationOverlay,
            }
          : undefined,
      overlayExplicitCommonInfoKeys:
        serializeOptions?.overlayMerge === 'nested-ssot' && patch.generalCommonInfo
          ? new Set(Object.keys(patch.generalCommonInfo))
          : undefined,
    })
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
  }

  applyRecruitmentParticipantColumnFieldsToUpdateRequest(body, { merged, existing, patch })
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
 * @param patch 있으면 **해당 키만** PATCH body에 포함 (부분 수정).
 *   없으면 기존처럼 프로그램 코어 필드 전체를 직렬화(생성 직후 전체 동기화 등).
 */
export function mapGeneralProgramToUpdateRequest(
  program: Program,
  patch?: Partial<Program>,
  /** 저장 전 로드된 프로그램 — 임금·모집 잠금 비교 SSOT */
  baseline?: Program,
  serializeOptions?: GeneralProgramUpdateSerializeOptions
): ProgramUpdateRequestBody {
  const baselineProgram = baseline ?? program
  const body =
    patch && Object.keys(patch).length > 0
      ? mapProgramPatchFieldsToRequest(
          { ...program, ...patch },
          patch,
          baselineProgram,
          serializeOptions
        )
      : mapProgramCoreFieldsToRequest(program)
  return omitTypedVolunteerInterviewKeysFromUpdateRequest(body, baselineProgram)
}

/** 조회 typed 적용 조건과 같다 — UJAT 아님 + 반기 아닌 봉사 모집 행 정확히 1개 */
export function hasSingleTypedVolunteerInterviewRow(program: Program): boolean {
  if ((program.backendProgramType ?? '').toUpperCase() === 'UJAT') return false
  const rows = (program.programRecruitments ?? []).filter(
    row =>
      (row.recruitmentType ?? '').toUpperCase() === 'VOLUNTEER' &&
      row.recruitTerm !== 'FIRST_HALF' &&
      row.recruitTerm !== 'SECOND_HALF'
  )
  return rows.length === 1
}

/**
 * 생성 외 프로그램 PATCH — `generalCommonInfo.volunteerInterviewScheduleInfo`(BE 가 typed 로 다시 만드는 표시 복사본)와
 * typed·행 필드에 같은 정보가 있는 overlay 봉사 면접 키는 보내지 않는다(keonhee 2026-10-25 21:09).
 * 면접 설정 정본은 봉사 행 PATCH 의 interviewEnabled·interviewConfig(생성은 `withTypedVolunteerInterviewConfigForCreate`).
 * BE PATCH 는 저장된 live typed 로 상세를 정규화하므로 FE overlay 값은 쓰이지 않는다.
 */
function omitTypedVolunteerInterviewKeysFromUpdateRequest(
  body: ProgramUpdateRequestBody,
  program: Program
): ProgramUpdateRequestBody {
  if (!body.serviceDetailJson || !hasSingleTypedVolunteerInterviewRow(program)) return body
  const serviceDetailJson = omitVolunteerInterviewSaveKeysFromServiceDetailJson(
    body.serviceDetailJson
  )
  return serviceDetailJson === body.serviceDetailJson ? body : { ...body, serviceDetailJson }
}
