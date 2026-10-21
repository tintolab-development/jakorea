import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import { omitNullRecordValues } from '@/shared/lib/openapi-null'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type {
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types'
import { applySettlementPolicyToCommonInfo } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import { coerceProgramPaymentItemsText } from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import {
  derivedTextbookNameAliases,
  omitIfDetailedProgramNameAlias,
  parseDetailedProgramMasterId,
} from '@/features/program/general/lib/detailed-program-request-id'
import {
  extractCompanySchoolWageSidecar,
  parseCompanySchoolServiceDetailJson,
  serializeCompanySchoolServiceDetailJson,
  serializeCompanySchoolServiceDetailJsonForUpdatePatch,
} from './service-detail-json'
import { toTypedProgramLifecycleStatus } from '@/shared/lib/program-typed-lifecycle'
import { toProgramRecruitmentWindows } from '@/features/program/shared/lib/program-edit-window'
import { mapListParticipantRecruitment } from '@/features/program/shared/lib/format-recruitment-headcount'
import { applyResolvedAnnouncementTitle } from '@/features/program/shared/lib/public-program-title'
import {
  applyResolvedVenueKindToCommonInfo,
  buildProgramSponsorAssignmentsWire,
  encodeSponsorManagerContactRef,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import { isSponsorContactUnselected } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { patchTouchesProgramSponsors } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import {
  normalizeProgramBusinessAreaValue,
  resolvePersistedProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import type { ProgramUpdateRequestTargetLevelsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestTargetLevelsItem'
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
import {
  applyParticipantRecruitmentColumnsFromResponse,
  applyProgramMissingCommonStringFieldsToUpdateRequest,
  applyRecruitmentParticipantColumnFieldsToUpdateRequest,
  mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo,
  resolveOtherNotesFromProgramResponse,
  resolveParticipantRecruitmentRemarks,
} from '@/features/program/shared/lib/program-update-common-string-fields'
import { resolveProgramListDeleteBlocked } from '@/features/program/shared/lib/program-delete-eligibility'

export const COMPANY_SCHOOL_PROGRAM_API_TYPE = 'COMPANY_SCHOOL'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

function toDate(value: Date | string | undefined): string | undefined {
  if (value instanceof Date) return value.toISOString()
  return value
}

/**
 * GET — 화면 운영 기간은 서울 달력일.
 * `businessStartDate`/`businessEndDate` 와 `startDate`/`endDate`/`rounds[0]` 이 같은 날짜다.
 */
function resolveCompanySchoolOperationDates(dto: {
  startDate?: string | null
  endDate?: string | null
  businessStartDate?: string | null
  businessEndDate?: string | null
}): { startDate: string | undefined; endDate: string | undefined } {
  return resolveBusinessPeriodDates(dto)
}

function resolveCompanySchoolListLifecycle(
  dto: AdminProgramListItemDto
): ProgramLifecycleStatus {
  return (
    toTypedProgramLifecycleStatus(dto.lifecycleStatus) ??
    toTypedProgramLifecycleStatus(dto.periodStatus) ??
    'scheduled'
  )
}

function baseProgram(
  partial: Partial<Program> & Pick<Program, 'id' | 'title'>
): Program {
  const now = new Date().toISOString()
  return {
    sponsorId: DEFAULT_SPONSOR_ID,
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: now,
    endDate: now,
    status: 'pending',
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

export function mapCompanySchoolListItemToProgram(dto: AdminProgramListItemDto): Program {
  const title = dto.title?.trim() || dto.nameKo?.trim() || '제목 없음'
  const mainTitle = dto.mainTitle?.trim() || title
  return baseProgram({
    id: dto.id == null ? '' : String(dto.id),
    title,
    mainTitle,
    titleEn: dto.titleEn?.trim() || undefined,
    ...resolveCompanySchoolOperationDates(dto),
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus: resolveCompanySchoolListLifecycle(dto),
    listDeleteBlocked: resolveProgramListDeleteBlocked({
      lifecycleStatus: resolveCompanySchoolListLifecycle(dto),
      participantApprovedCount: dto.participantApprovedCount,
      approvedOrganizationApplicationCount: dto.approvedOrganizationApplicationCount,
      participatingSchoolCount: dto.participatingSchoolCount ?? dto.participatingOrganizationCount,
      participatingStudentCount: dto.participatingStudentCount,
    }),
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount,
    ...mapListParticipantRecruitment(dto),
    instructors: dto.instructorApplicantCount,
    participatingSchoolCount: dto.organizationApplicationCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    backendProgramType: dto.programType ?? COMPANY_SCHOOL_PROGRAM_API_TYPE,
  })
}

export function mapCompanySchoolDetailToProgram(dto: ProgramResponse): Program {
  const dtoExt = dto as ProgramResponse & {
    nameKo?: string
    businessField?: string
  }
  const title =
    dto.title?.trim() ||
    dto.mainTitle?.trim() ||
    dtoExt.nameKo?.trim() ||
    '제목 없음'
  const id = dto.id == null ? '' : String(dto.id)
  const now = new Date().toISOString()
  const details = parseCompanySchoolServiceDetailJson(dto.serviceDetailJson)
  const {
    lifecycleStatus: _serviceDetailLifecycle,
    status: _serviceDetailStatus,
    ...detailFields
  } = details
  void _serviceDetailLifecycle
  void _serviceDetailStatus
  const wageSidecar = extractCompanySchoolWageSidecar(dto.serviceDetailJson)
  const sidecarPaymentItems = coerceProgramPaymentItemsText(wageSidecar?.paymentItems).trim()
  const fromJson = {
    ...details.generalCommonInfo,
    ...(wageSidecar?.wageGradeRows?.length ? { wageGradeRows: wageSidecar.wageGradeRows } : {}),
    ...(sidecarPaymentItems ? { paymentItems: sidecarPaymentItems } : {}),
    ...(typeof wageSidecar?.deductionItems === 'string' && wageSidecar.deductionItems.trim()
      ? { deductionItems: wageSidecar.deductionItems }
      : {}),
  }
  const savedPaymentItems = coerceProgramPaymentItemsText(fromJson.paymentItems).trim()
  const mergedSettlement = applySettlementPolicyToCommonInfo(fromJson, dto.settlementPolicy)
  // 등록 시 넣은 serviceDetailJson 임금이 있으면 그걸 화면 SSOT로 쓴다.
  // settlementPolicy 기본값(500,000 등)이 JSON을 덮어 상세와 GET body가 달라지는 것을 막는다.
  const generalCommonInfoWithSettlement = mergedSettlement
    ? {
        ...mergedSettlement,
        wageGradeRows: fromJson.wageGradeRows?.length
          ? fromJson.wageGradeRows
          : mergedSettlement.wageGradeRows,
        paymentItems: savedPaymentItems || mergedSettlement.paymentItems,
        deductionItems:
          typeof fromJson.deductionItems === 'string' && fromJson.deductionItems.trim()
            ? fromJson.deductionItems
            : mergedSettlement.deductionItems,
      }
    : fromJson
  // BE가 숫자 id로 조회해 내려주는 detailedProgramName을 우선 — serviceDetailJson 캐시가
  // 낡았을 때도(id만 바뀌고 상세 JSON이 안 갱신된 경우 등) 화면에 최신 이름이 보이게 한다.
  const generalCommonInfoBase = applyResolvedVenueKindToCommonInfo(
    {
      ...generalCommonInfoWithSettlement,
      detailedProgramName:
        dto.detailedProgramName?.trim() || generalCommonInfoWithSettlement?.detailedProgramName,
    },
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
  /** otherNotes ≠ remarks — BE otherMatters 컬럼 우선 */
  const otherNotes =
    resolveOtherNotesFromProgramResponse({
      otherMatters: dto.otherMatters,
      otherNotes: details.otherNotes,
    }) || undefined

  const periodStatus = (dto as ProgramResponse & { periodStatus?: string }).periodStatus
  const lifecycleStatus =
    toTypedProgramLifecycleStatus(dto.lifecycleStatus) ??
    toTypedProgramLifecycleStatus(periodStatus) ??
    undefined
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
    registrationOverlay: details.registrationOverlay,
    generalCommonInfo,
  })

  const mapped = baseProgram({
    ...detailFields,
    id,
    sponsorId: dto.sponsorId ?? DEFAULT_SPONSOR_ID,
    title,
    mainTitle: dto.mainTitle ?? title,
    type: (dto.type as ProgramType | undefined) ?? 'offline',
    format: (dto.format as ProgramFormat | undefined) ?? 'workshop',
    category: (dto.category as ProgramCategory | undefined) ?? 'school',
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
      })) ?? [],
    ...resolveCompanySchoolOperationDates(dto),
    applicationStartDate: dto.applicationStartDate,
    applicationEndDate: dto.applicationEndDate,
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus,
    businessArea:
      normalizeProgramBusinessAreaValue(dto.businessArea || dtoExt.businessField) || undefined,
    // 세부 프로그램 마스터 id — 일반 프로그램 어댑터와 동일하게 top-level 필드로 읽어온다.
    detailedProgramId: dto.detailedProgramId != null ? String(dto.detailedProgramId) : undefined,
    titleEn: dto.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district,
    ips: dto.ips as Program['ips'],
    targetLevel: persistedTargetLevels[0],
    targetLevels:
      columnSource !== undefined || persistedTargetLevels.length > 0
        ? persistedTargetLevels
        : undefined,
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
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
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
    posterImage: details.posterImage ?? dto.keyVisualImage,
    settlementRuleId: dto.settlementRuleId,
    applicationPathId: dto.applicationPathId,
    additionalContentHtml: dto.additionalContentHtml,
    recruitmentGuide: dto.recruitmentGuide,
    learningSupportContent: dto.learningSupportContent,
    attachmentFileNames: dto.attachmentFileNames,
    otherNotes,
    recruitmentTargetDetail: dto.recruitmentTargetDetail?.trim() || undefined,
    studentListRequired: details.studentListRequired ?? 'not_required',
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    generalCommonInfo,
    generalSurveyMenuKeys: details.generalSurveyMenuKeys,
    generalProgramAudience: details.generalProgramAudience ?? 'organization',
    registrationOverlay: details.registrationOverlay,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    backendProgramType: dto.programType ?? COMPANY_SCHOOL_PROGRAM_API_TYPE,
    programRecruitments: toProgramRecruitmentWindows(dto.recruitments),
  })
  return applyResolvedAnnouncementTitle(
    applyParticipantRecruitmentColumnsFromResponse(mapped, dto),
    {
      serviceDetailJson: dto.serviceDetailJson,
      overlay: details.registrationOverlay,
    }
  )
}

/** GET round id만 다시 보낸다. `186016-round-1` 같은 화면용 id를 넣으면 서버가 기존 일정을 삭제 후 재생성한다. */
function persistedRoundId(id: string | undefined): string | undefined {
  if (!id || !/^\d+$/.test(id)) return undefined
  return id
}

function mapRounds(program: Program): ProgramUpdateRequest['rounds'] {
  return program.rounds.map(round => ({
    ...(persistedRoundId(round.id) ? { id: persistedRoundId(round.id) } : {}),
    roundNumber: round.roundNumber,
    startDate: toDate(round.startDate),
    endDate: toDate(round.endDate),
    capacity: round.capacity,
    classCount: round.classCount,
    status: round.status,
    curriculum: round.curriculum,
    deliveryType: round.deliveryType,
  }))
}

/** `serializeCompanySchoolServiceDetailJson` / `companySchoolDetails`에 들어가는 도메인 키 */
const SERVICE_DETAIL_PROGRAM_KEYS = [
  'posterImage',
  'targetLevels',
  'approvedStudentCount',
  'instructorCapacity',
  'participatingSchoolCount',
  'participatingStudentCount',
  'instructorApplicationStartDate',
  'instructorApplicationEndDate',
  'documentPassAnnouncementDate',
  'documentPassAnnouncementMethod',
  'interviewStartDate',
  'interviewEndDate',
  'interviewMethod',
  'finalPassAnnouncementDate',
  'finalPassAnnouncementMethod',
  'instructorTarget',
  'instructorTargets',
  'instructorTargetDetail',
  'applicationMethod',
  'otherNotes',
  'resultAnnouncementDate',
  'resultAnnouncementMethod',
  'studentListRequired',
  'applicationFormTemplateId',
  'surveyFormTemplateId',
  'satisfactionFormTemplateId',
  'lectureReportFormTemplateId',
  'generalParticipantTypes',
  'generalVolunteerInterviewEnabled',
  'generalParticipantInterviewEnabled',
  'generalSurveyMenuKeys',
  'generalProgramAudience',
  'generalProgramEducationStructure',
  'generalProgramSessionRound',
  'generalCommonInfo',
  'scheduleTimeEnabled',
  'startTime',
  'endTime',
  'createdByName',
  'updatedByName',
  'generalVolunteers',
  'staffVolunteers',
  'returningVolunteers',
  'registrationOverlay',
] as const satisfies ReadonlyArray<keyof Program>

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

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

/** GET 마스킹 값(`김*원`, `010-****-1234`)을 PATCH로 되쓰지 않기 위함 */
function looksMaskedProgramPii(value: string | null | undefined): boolean {
  if (value == null) return false
  return value.includes('*')
}

function mapCompanySchoolSponsorAssignments(program: Program) {
  const sponsorId =
    program.generalCommonInfo?.sponsorManagementIds?.[0] ??
    program.generalCommonInfo?.sponsorManagementId ??
    program.sponsorId
  const sponsorIds = sponsorId ? [String(sponsorId).trim()].filter(Boolean) : []
  const contactRefs = normalizeSponsorManagerContactIds({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
  })
    .filter(id => id !== '__all__' && !isSponsorContactUnselected(id))
    .map(id =>
      id.includes('::') || !sponsorId
        ? id
        : encodeSponsorManagerContactRef(String(sponsorId), id)
    )
  return buildProgramSponsorAssignmentsWire(sponsorIds, contactRefs)
}

function mapCompanySchoolCoreFieldsToRequest(program: Program): ProgramUpdateRequest {
  // 버그 수정: 1사1교는 등록 폼에서 고른 「세부 프로그램명」이 요청에 전혀 실리지 않고 무시됐다 —
  // 일반 프로그램 어댑터와 동일하게 detailedProgramId(숫자 마스터 id)로 보낸다. textbookName(교재명)에
  // 이름을 강제로 밀어넣는 방식은 general 어댑터의 계약과 달랐다(중복되면 omit).
  const targetLevels = resolveRequestTargetLevels(program)
  const detailedProgramName = program.generalCommonInfo?.detailedProgramName
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  const sponsors = mapCompanySchoolSponsorAssignments(program)
  const primarySponsorId =
    sponsors.find(row => row.sponsorContactId)?.sponsorId ||
    sponsors[0]?.sponsorId ||
    program.sponsorId
  const body: ProgramUpdateRequest = {
    sponsorId: primarySponsorId,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: toDate(program.startDate),
    endDate: toDate(program.endDate),
    /** 화면에서 고른 기간 그대로. 연도·1/1~12/31 합성 금지. */
    businessStartDate: toDate(program.startDate),
    businessEndDate: toDate(program.endDate),
    applicationStartDate: toDate(program.applicationStartDate),
    applicationEndDate: toDate(program.applicationEndDate),
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
    targetLevels,
    targetLevel: targetLevels?.[0],
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
    totalParticipants: program.totalParticipants,
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
    generalTeachers: program.generalTeachers,
    educatedTeachers: program.educatedTeachers,
    instructors: program.instructors,
    managerName: program.managerName,
    venue: program.venue,
    curriculum: program.curriculum,
    contactEmail: program.contactEmail,
    contactPhone: program.contactPhone,
    oneLineIntroduction: program.oneLineIntroduction,
    remarks: resolveParticipantRecruitmentRemarks(program),
    keyVisualImage: program.keyVisualImage ?? program.posterImage,
    settlementRuleId: program.settlementRuleId,
    applicationPathId: program.applicationPathId,
    additionalContentHtml: program.additionalContentHtml,
    recruitmentGuide: program.recruitmentGuide,
    learningSupportContent: program.learningSupportContent,
    attachmentFileNames: program.attachmentFileNames,
    rounds: mapRounds(program),
    sponsors: sponsors.length > 0 ? sponsors : undefined,
    serviceDetailJson: serializeCompanySchoolServiceDetailJson(
      targetLevels?.length
        ? { ...program, targetLevels, targetLevel: targetLevels[0] }
        : program
    ),
  }
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'full',
    merged: program,
    existing: program,
  })
  return body
}

/**
 * 공통·모집 정보 등 **부분 수정**용 — `patch`에 있는 도메인 키만 UpdateRequest에 실음.
 * rounds·curriculum·담당자(미변경/마스킹) 등 화면 밖 필드는 보내지 않음.
 */
function mapCompanySchoolPatchFieldsToRequest(
  merged: Program,
  patch: Partial<Program>,
  existing: Program
): ProgramUpdateRequest {
  const body: ProgramUpdateRequest = {}
  const has = (key: keyof Program) => patchHasKey(patch, key)

  if (has('sponsorId') || patchTouchesProgramSponsors(patch)) {
    const sponsors = mapCompanySchoolSponsorAssignments(merged)
    body.sponsorId =
      sponsors.find(row => row.sponsorContactId)?.sponsorId ||
      sponsors[0]?.sponsorId ||
      (merged.sponsorId != null ? String(merged.sponsorId) : undefined)
    body.sponsors = sponsors
  }
  if (has('title')) body.title = merged.title
  if (has('type')) body.type = merged.type
  if (has('format')) body.format = merged.format
  if (has('category')) body.category = merged.category
  if (has('description')) body.description = merged.description
  if (has('startDate') || has('endDate')) {
    body.startDate = toDate(merged.startDate)
    body.endDate = toDate(merged.endDate)
    body.businessStartDate = toDate(merged.startDate)
    body.businessEndDate = toDate(merged.endDate)
  }
  if (has('applicationStartDate')) {
    body.applicationStartDate = toDate(merged.applicationStartDate)
  }
  if (has('applicationEndDate')) {
    body.applicationEndDate = toDate(merged.applicationEndDate)
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
  if (has('textbookName') || has('generalCommonInfo')) {
    // 버그 수정: 세부 프로그램명 patch는 generalCommonInfo.detailedProgramName으로 들어오므로
    // textbookName 키 유무만 보면 갱신이 누락된다 — generalCommonInfo 변경 시에도 동기화한다.
    // (교재명에 세부 프로그램명을 그대로 복제한 값이면 omit — general 어댑터와 동일 계약)
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
    const targetLevels = resolveRequestTargetLevels(merged) ?? []
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
  if (has('totalParticipants')) body.totalParticipants = merged.totalParticipants
  if (has('generalVolunteers')) body.generalVolunteers = 0
  if (has('staffVolunteers')) body.staffVolunteers = 0
  if (has('returningVolunteers')) body.returningVolunteers = 0
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
    body.contactPhone = merged.contactPhone
  }
  if (has('oneLineIntroduction')) body.oneLineIntroduction = merged.oneLineIntroduction
  if (has('keyVisualImage') || has('posterImage')) {
    body.keyVisualImage = merged.keyVisualImage ?? merged.posterImage
  }
  if (has('settlementRuleId')) body.settlementRuleId = merged.settlementRuleId
  if (has('applicationPathId')) body.applicationPathId = merged.applicationPathId
  if (has('additionalContentHtml')) {
    body.additionalContentHtml = merged.additionalContentHtml
  }
  if (has('recruitmentGuide')) body.recruitmentGuide = merged.recruitmentGuide
  if (has('learningSupportContent')) {
    body.learningSupportContent = merged.learningSupportContent
  }
  if (has('attachmentFileNames')) body.attachmentFileNames = merged.attachmentFileNames
  if (has('rounds')) body.rounds = mapRounds(merged)

  const touchesServiceDetail = SERVICE_DETAIL_PROGRAM_KEYS.some(key => has(key))
  if (touchesServiceDetail) {
    const touchesTargetLevels = has('targetLevel') || has('targetLevels')
    const persistedTargetLevels = touchesTargetLevels
      ? resolveRequestTargetLevels(merged)
      : resolveRequestTargetLevels(merged, existing)
    const serializeSource =
      persistedTargetLevels != null
        ? { ...merged, targetLevels: persistedTargetLevels, targetLevel: persistedTargetLevels[0] }
        : merged
    body.serviceDetailJson = serializeCompanySchoolServiceDetailJsonForUpdatePatch(
      serializeSource,
      persistedTargetLevels != null ? { ...patch, targetLevels: persistedTargetLevels } : patch
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
export function mapCompanySchoolToUpdateRequest(
  program: Program,
  patch?: Partial<Program>
): ProgramUpdateRequest {
  if (patch && Object.keys(patch).length > 0) {
    return mapCompanySchoolPatchFieldsToRequest({ ...program, ...patch }, patch, program)
  }
  return mapCompanySchoolCoreFieldsToRequest(program)
}

export function mapCompanySchoolToCreateRequest(program: Program): ProgramCreateRequest {
  return omitNullRecordValues({
    ...mapCompanySchoolToUpdateRequest(program),
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    businessStartDate: toDate(program.startDate),
    businessEndDate: toDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }) as ProgramCreateRequest
}
