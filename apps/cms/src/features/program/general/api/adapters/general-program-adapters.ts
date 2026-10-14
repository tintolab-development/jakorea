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
import { ProgramRecruitmentRequestRecruitmentType } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitmentType'
import { ProgramRecruitmentRequestStatus } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestStatus'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramUpdateRequestRoundsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestRoundsItem'
import type { ProgramUpdateRequestTargetLevelsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestTargetLevelsItem'
import { omitNullRecordValues } from '@/shared/lib/openapi-null'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import { programMatchesProgressPhase } from '@/features/program/general/ui/constants/program-list-constants'
import {
  omitUnchangedWageFieldsFromProgramForServiceDetail,
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
  wageCommonInfoFieldsUnchanged,
} from '@/features/program/general/lib/general-program-service-detail-json'
import { applySettlementPolicyToCommonInfo } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import { mapListParticipantRecruitment } from '@/features/program/shared/lib/format-recruitment-headcount'
import { applyResolvedAnnouncementTitle } from '@/features/program/shared/lib/public-program-title'
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
import {
  isProgramOperationStartLocked,
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
  buildProgramSponsorAssignmentsWire,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import { patchTouchesProgramSponsors } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import {
  attachRecruitmentRowIdentity,
  buildRecruitmentRowCopyRequests,
  mergeRecruitmentRowRequests,
} from '@/features/program/shared/lib/recruitment-row-request'
import {
  hydrateGeneralRecruitmentInfoFromRows,
  type RecruitmentCopyAudience,
} from '@/features/program/shared/lib/recruitment-row-copy'
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
    applicationTargetMode: (
      dto as AdminProgramListItemDto & { applicationTargetMode?: string }
    ).applicationTargetMode,
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
      approvedOrganizationApplicationCount: toOptionalNumber(dto.approvedOrganizationApplicationCount),
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
      toOptionalNumber(dto.instructorCapacity) ??
      toOptionalNumber(dto.instructorRecruitmentCount),
    generalVolunteers: toOptionalNumber(dto.volunteerApprovedCount),
    participatingSchoolCount:
      toOptionalNumber(dto.participatingSchoolCount) ??
      toOptionalNumber(dto.participatingOrganizationCount),
    participatingStudentCount: toOptionalNumber(dto.participatingStudentCount),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
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

export function mapAdminProgramDetailToProgram(dto: ProgramResponse): Program {
  const dtoWithExtras = dto as ProgramResponse & {
    nameKo?: string
    applicationTargetMode?: string
    businessField?: string
  }
  const title =
    dto.title?.trim() ||
    dto.mainTitle?.trim() ||
    dtoWithExtras.nameKo?.trim() ||
    '제목 없음'
  const id = toProgramId(dto.id)
  const now = new Date().toISOString()
  const serviceDetail = parseGeneralProgramServiceDetailJson(dto.serviceDetailJson)
  const dtoDetailedProgramName = dto.detailedProgramName?.trim()
  const generalCommonInfoBase = applyResolvedVenueKindToCommonInfo(
    applySettlementPolicyToCommonInfo(
      {
        ...serviceDetail.generalCommonInfo,
        ...(dtoDetailedProgramName
          ? { detailedProgramName: dtoDetailedProgramName }
          : {}),
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
    businessArea: normalizeProgramBusinessAreaValue(
      dto.businessArea || dtoWithExtras.businessField
    ) || undefined,
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
    ...serviceDetail,
    generalCommonInfo,
    detailedProgramId:
      dto.detailedProgramId != null ? String(dto.detailedProgramId) : undefined,
    targetLevel: detailTargetLevels[0],
    targetLevels:
      columnSource !== undefined || detailTargetLevels.length > 0
        ? detailTargetLevels
        : undefined,
    // typed lifecycleStatus SSOT — serviceDetailJson 값으로 덮지 않음
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus: toTypedProgramLifecycleStatus(dto.lifecycleStatus) ?? undefined,
    // serviceDetail 스프레드 이후에도 programType 기반 대분류를 유지
    ...(audienceFromApi
      ? {
          category: audienceFromApi.category,
          generalProgramAudience:
            serviceDetail.generalProgramAudience ?? audienceFromApi.audience,
        }
      : {}),
    backendProgramType: dto.programType,
    programRecruitments: toProgramRecruitmentWindows(dto.recruitments),
  })

  return hydrateGeneralRecruitmentInfoFromRows(
    applyResolvedAnnouncementTitle(
      applyParticipantRecruitmentColumnsFromResponse(mapped, dto),
      {
        serviceDetailJson: dto.serviceDetailJson,
        overlay: serviceDetail.registrationOverlay,
      }
    )
  )
}

export function filterGeneralProgramsByOverviewStatus(
  programs: Program[],
  statusFilter: GeneralProgramOverviewStatusFilter | null
): Program[] {
  if (!statusFilter) return programs
  return programs.filter(program => programMatchesProgressPhase(program, statusFilter))
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
  const audienceMode = mapAudienceToApplicationTargetMode(
    program.generalProgramAudience,
    types
  )
  const out: ProgramRecruitmentRequest[] = []

  const wantsOrg =
    types.includes('school_institution') ||
    (types.length === 0 && audienceMode !== 'INDIVIDUAL')
  const wantsIndividual =
    types.includes('individual') ||
    (types.length === 0 && audienceMode === 'INDIVIDUAL')

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
      endAt: toRequestDate(
        program.instructorApplicationEndDate ?? program.applicationEndDate
      ),
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
      startAt: toRequestDate(
        program.volunteerApplicationStartDate ?? program.applicationStartDate
      ),
      endAt: toRequestDate(
        program.volunteerApplicationEndDate ?? program.applicationEndDate
      ),
      ...recruitmentOperationRequestDates(program, 'VOLUNTEER'),
      maxCount: program.generalVolunteers ?? undefined,
      selectionMethod: 'ADMIN_REVIEW',
    })
  }

  return out.length > 0 ? attachRecruitmentRowIdentity(out, program.programRecruitments) : undefined
}

function copyAudienceOf(row: ProgramRecruitmentRequest): RecruitmentCopyAudience {
  if (row.recruitmentType === ProgramRecruitmentRequestRecruitmentType.INSTRUCTOR) return 'instructor'
  if (row.recruitmentType === ProgramRecruitmentRequestRecruitmentType.VOLUNTEER) return 'volunteer'
  return 'participant'
}

/** 생성 시 모집 탭별 문구·담당자를 각 행에 담는다. 이후 읽기는 행 값만 쓴다. */
function withGeneralCreateRowCopy(
  rows: ProgramRecruitmentRequest[] | undefined,
  program: Program
): ProgramRecruitmentRequest[] | undefined {
  return rows?.map(row => {
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
    contactName: info?.contactOrganizationName?.trim() || participantContactName?.trim() || undefined,
    contactPhone: toRequestPhone(info?.contactPhone ?? info?.inquiryTel ?? info?.tel) || undefined,
    contactEmail: (info?.contactEmail ?? info?.inquiryEmail ?? info?.email)?.trim() || undefined,
    remarks: notesNotApplicable ? undefined : info?.remarks?.trim() || undefined,
    ...(otherMatters ? { otherMatters } : {}),
  }
}

function mapProgramSponsorAssignments(program: Program) {
  const sponsorIdsFromForm = (
    program.generalCommonInfo?.sponsorManagementIds?.length
      ? program.generalCommonInfo.sponsorManagementIds
      : program.generalCommonInfo?.sponsorManagementId
        ? [program.generalCommonInfo.sponsorManagementId]
        : program.sponsorId
          ? [program.sponsorId]
          : []
  )
    .map(id => String(id).trim())
    .filter(Boolean)
  const contactRefs = normalizeSponsorManagerContactIds({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
  })
  return buildProgramSponsorAssignmentsWire(sponsorIdsFromForm, contactRefs)
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
    sponsors.find(s => s.sponsorContactId)?.sponsorId ||
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
    applicationStartDate: toRequestDate(program.applicationStartDate),
    applicationEndDate: toRequestDate(program.applicationEndDate),
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
    rounds: mapProgramRoundsToUpdateRequest(program),
    serviceDetailJson: serializeGeneralProgramServiceDetailJson(program),
  }
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'full',
    merged: program,
    existing: program,
  })
  return body
}

export function mapGeneralProgramToCreateRequest(program: Program): ProgramCreateRequestBody {
  const core = mapProgramCoreFieldsToRequest(program)
  return omitNullRecordValues({
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
  if (recruitmentType === 'PARTICIPANT' || recruitmentType === 'INSTRUCTOR' || recruitmentType === 'VOLUNTEER') {
    return recruitmentType
  }
  return null
}

function mapProgramPatchFieldsToRequest(
  merged: Program,
  patch: Partial<Program>,
  existing: Program
): ProgramUpdateRequestBody {
  const body: ProgramUpdateRequestBody = {}
  const has = (key: keyof Program) => patchHasKey(patch, key)

  if (has('sponsorId') || patchTouchesProgramSponsors(patch)) {
    const sponsors = mapProgramSponsorAssignments(merged)
    body.sponsorId =
      sponsors.find(s => s.sponsorContactId)?.sponsorId ||
      sponsors[0]?.sponsorId ||
      (merged.sponsorId != null ? String(merged.sponsorId) : undefined)
    // BE: sponsors 키 존재 = full replace. [] = 전체 해제. 후원 미수정 PATCH에서는 키 생략.
    body.sponsors = sponsors
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
  const participantLocked = isProgramOperationStartLocked(existing, 'PARTICIPANT')
  const instructorLocked = isProgramOperationStartLocked(existing, 'INSTRUCTOR')
  const volunteerLocked = isProgramOperationStartLocked(existing, 'VOLUNTEER')
  const includeParticipantRecruitment =
    (has('applicationStartDate') || has('applicationEndDate')) && !participantLocked
  const includeInstructorRecruitment =
    (has('instructorApplicationStartDate') || has('instructorApplicationEndDate')) &&
    !instructorLocked
  const includeVolunteerRecruitment =
    (has('volunteerApplicationStartDate') || has('volunteerApplicationEndDate')) &&
    !volunteerLocked

  if (has('applicationStartDate') && !participantLocked) {
    body.applicationStartDate = toRequestDate(merged.applicationStartDate)
  }
  if (has('applicationEndDate') && !participantLocked) {
    body.applicationEndDate = toRequestDate(merged.applicationEndDate)
  }
  const windowRows =
    includeParticipantRecruitment || includeInstructorRecruitment || includeVolunteerRecruitment
      ? (mapGeneralProgramRecruitmentsToRequest({
          ...merged,
          programRecruitments: existing.programRecruitments,
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
        row => {
          const type = recruitmentTypeOf(row.recruitmentType)
          return type != null && isProgramOperationStartLocked(existing, type)
        }
      )
    : []
  const recruitmentRows = mergeRecruitmentRowRequests(windowRows, copyRows)
  if (recruitmentRows.length > 0) body.recruitments = recruitmentRows
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
  if (has('rounds')) body.rounds = mapProgramRoundsToUpdateRequest(merged)

  const detailSource =
    has('generalProgramAudience') || has('generalParticipantTypes')
      ? {
          ...merged,
          generalProgramAudience: existing.generalProgramAudience,
          generalParticipantTypes: existing.generalParticipantTypes,
        }
      : merged

  const touchesServiceDetail = SERVICE_DETAIL_PROGRAM_KEYS.some(
    key =>
      key !== 'generalProgramAudience' &&
      key !== 'generalParticipantTypes' &&
      has(key)
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
  baseline?: Program
): ProgramUpdateRequestBody {
  const baselineProgram = baseline ?? program
  if (patch && Object.keys(patch).length > 0) {
    return mapProgramPatchFieldsToRequest({ ...program, ...patch }, patch, baselineProgram)
  }
  return mapProgramCoreFieldsToRequest(program)
}
