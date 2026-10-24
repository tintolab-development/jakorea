import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import { omitNullRecordValues } from '@/shared/lib/openapi-null'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramCreateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programCreateRequestEducationStructure'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramUpdateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestEducationStructure'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type { ProgramResponseEducationStructure } from '@/shared/api/generated/logs/schemas/programResponseEducationStructure'
import type {
  GeneralProgramEducationStructure,
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramSchedule,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types'
import { toTypedProgramLifecycleStatus } from '@/shared/lib/program-typed-lifecycle'
import { toProgramRecruitmentWindows } from '@/features/program/shared/lib/program-edit-window'
import {
  buildProgramSponsorAssignmentsWire,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  omitIfDetailedProgramNameAlias,
  parseDetailedProgramMasterId,
} from '@/features/program/general/lib/detailed-program-request-id'
import {
  resolvePersistedProgramTargetLevels,
  resolveProgramTargetLevels,
  resolveStoredBusinessArea,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  parseTrainedTeacherServiceDetailJson,
  serializeTrainedTeacherServiceDetailJson,
} from './service-detail-json'
import { clearTeacherTrainingScheduleIfOff } from '../lib/teacher-training-schedule'
import { mapListParticipantRecruitment } from '@/features/program/shared/lib/format-recruitment-headcount'
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
import {
  applyProgramMissingCommonStringFieldsToUpdateRequest,
  mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo,
  resolveOtherNotesFromProgramResponse,
} from '@/features/program/shared/lib/program-update-common-string-fields'
import { resolveProgramListDeleteBlocked } from '@/features/program/shared/lib/program-delete-eligibility'
import {
  normalizeCourseDeliveredByFormValue,
  normalizeIpOwnedSelectValue,
} from '@/features/program/shared/lib/program-enum-normalize'

/** 목록 GET echo (상세와 동일 컬럼). 일반 프로그램 DTO에는 없을 수 있음. */
type TrainedTeacherListItemDto = AdminProgramListItemDto & {
  textbookName?: string | null
  detailedProgramName?: string | null
  /** 후원사 담당자명 — 생성 관리자가 아님 */
  managerName?: string | null
  venue?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  educationProcess?: string | null
  ipOwned?: string | null
  courseDeliveredBy?: string | null
  institutionType?: string | null
  teamDivision?: string | null
  district?: string | null
}

export const TRAINED_TEACHER_PROGRAM_API_TYPE = 'TRAINED_TEACHER'

/** BE `ProgramUpdateRequest` Integer — 초과 시 Jackson MALFORMED_REQUEST */
const JAVA_INT_MAX = 2_147_483_647

function toJavaInt(value: number | null | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  const n = Math.trunc(value)
  if (n < 0) return undefined
  return Math.min(n, JAVA_INT_MAX)
}

function toStudentListRequired(value: string | undefined): Program['studentListRequired'] {
  return value === 'required' || value === 'not_required' ? value : undefined
}

function toCourseDeliveredBy(
  value: string | null | undefined
): Program['courseDeliveredBy'] {
  return normalizeCourseDeliveredByFormValue(value)
}

/** 프로그램 상세의 교육 일정은 ACTIVE만 남기고 시작 시각 기준으로 정렬한다. */
function mapProgramSchedules(
  schedules: ProgramResponse['schedules'] | null | undefined
): ProgramSchedule[] | undefined {
  if (!Array.isArray(schedules)) return undefined

  return schedules
    .filter(schedule => schedule.scheduleStatus === 'ACTIVE')
    .map(schedule => ({
      id: schedule.id ?? null,
      sessionNo: schedule.sessionNo ?? null,
      scheduleName: schedule.scheduleName ?? null,
      startAt: schedule.startAt ?? null,
      endAt: schedule.endAt ?? null,
      startDate: schedule.startDate ?? null,
      endDate: schedule.endDate ?? null,
      scheduleStatus: schedule.scheduleStatus ?? null,
      scheduleOrigin: schedule.scheduleOrigin ?? null,
    }))
    .sort((a, b) => String(a.startAt ?? '').localeCompare(String(b.startAt ?? '')))
}

/** @deprecated shared `mergeProgramSponsorAssignments` 사용. TT 기존 import 호환. */
export { mergeProgramSponsorAssignments as mergeTrainedTeacherSponsorAssignments } from '@/features/program/shared/lib/merge-program-sponsor-assignments'

function toDate(value: Date | string | undefined): string | undefined {
  if (value instanceof Date) return value.toISOString()
  return value
}

/** BE `educationStructure` → FE `generalProgramEducationStructure` */
export function mapApiEducationStructureToDomain(
  value?: ProgramResponseEducationStructure | string | null
): GeneralProgramEducationStructure | undefined {
  switch (value?.trim().toUpperCase()) {
    case 'CURRICULUM':
      return 'curriculum'
    case 'SCHEDULE':
      return 'schedule'
    default:
      return undefined
  }
}

/** FE `generalProgramEducationStructure` → BE `educationStructure` */
export function mapDomainEducationStructureToApi(
  value?: GeneralProgramEducationStructure | null
): ProgramCreateRequestEducationStructure | ProgramUpdateRequestEducationStructure | undefined {
  if (value === 'curriculum') return 'CURRICULUM'
  if (value === 'schedule') return 'SCHEDULE'
  return undefined
}

function resolveListLifecycleStatus(dto: AdminProgramListItemDto): ProgramLifecycleStatus {
  return (
    toTypedProgramLifecycleStatus(dto.lifecycleStatus) ??
    toTypedProgramLifecycleStatus(dto.periodStatus) ??
    'scheduled'
  )
}

function baseProgram(partial: Partial<Program> & Pick<Program, 'id' | 'title'>): Program {
  const now = new Date().toISOString()
  return {
    sponsorId: '',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: now,
    endDate: now,
    status: 'pending',
    generalParticipantTypes: ['school_institution'],
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function mapTrainedTeacherListItemToProgram(dto: AdminProgramListItemDto): Program {
  const item = dto as TrainedTeacherListItemDto
  const title = item.title?.trim() || ''
  const mainTitle = item.mainTitle?.trim() || undefined
  const textbookName = item.textbookName?.trim() || undefined
  const detailedProgramName = item.detailedProgramName?.trim() || undefined
  const managerName = item.managerName?.trim() || undefined
  const venue = item.venue?.trim() || undefined
  const targetLevels = resolveProgramTargetLevels({
    targetLevel: item.targetLevel,
    targetLevels: item.targetLevels,
  })
  return baseProgram({
    id: item.id == null ? '' : String(item.id),
    title,
    mainTitle,
    titleEn: item.titleEn?.trim() || undefined,
    ...resolveBusinessPeriodDates(item),
    lifecycleStatus: resolveListLifecycleStatus(item),
    listDeleteBlocked: resolveProgramListDeleteBlocked({
      lifecycleStatus: resolveListLifecycleStatus(item),
      participantApprovedCount: toOptionalNumber(item.participantApprovedCount),
      approvedOrganizationApplicationCount: toOptionalNumber(
        item.approvedOrganizationApplicationCount
      ),
      participatingSchoolCount:
        toOptionalNumber(item.participatingSchoolCount) ??
        toOptionalNumber(item.participatingOrganizationCount),
      participatingStudentCount: toOptionalNumber(item.participatingStudentCount),
    }),
    targetLevel: targetLevels[0],
    targetLevels: targetLevels.length > 0 ? targetLevels : undefined,
    approvedStudentCount:
      toOptionalNumber(item.participantApprovedCount) ??
      toOptionalNumber(item.approvedOrganizationApplicationCount) ??
      toOptionalNumber(item.applicantCount),
    ...mapListParticipantRecruitment(item),
    participatingSchoolCount:
      toOptionalNumber(item.participatingSchoolCount) ??
      toOptionalNumber(item.participatingOrganizationCount),
    participatingStudentCount: toOptionalNumber(item.participatingStudentCount),
    textbookName,
    managerName,
    venue,
    contactEmail: item.contactEmail?.trim() || undefined,
    contactPhone: item.contactPhone?.trim() || undefined,
    educationProcess: item.educationProcess?.trim() || undefined,
    ipOwned: normalizeIpOwnedSelectValue(item.ipOwned),
    courseDeliveredBy: toCourseDeliveredBy(item.courseDeliveredBy),
    institutionType: item.institutionType as Program['institutionType'],
    teamDivision: item.teamDivision?.trim() || undefined,
    district: item.district?.trim() || undefined,
    // 목록 GET `rounds: []` 는 경량 계약 — 저장 실패가 아님. 상세 GET 전 커리큘럼 원복으로 쓰지 말 것.
    rounds: [],
    generalCommonInfo: detailedProgramName
      ? {
          detailedProgramName,
        }
      : undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    backendProgramType: item.programType ?? TRAINED_TEACHER_PROGRAM_API_TYPE,
  })
}

export function mapTrainedTeacherDetailToProgram(dto: ProgramResponse): Program {
  const title = dto.title?.trim() || ''
  const id = dto.id == null ? '' : String(dto.id)
  const now = new Date().toISOString()
  const details = parseTrainedTeacherServiceDetailJson(dto.serviceDetailJson)
  const {
    lifecycleStatus: _serviceDetailLifecycle,
    status: _serviceDetailStatus,
    ...detailFields
  } = details
  void _serviceDetailLifecycle
  void _serviceDetailStatus

  const educationStructure = mapApiEducationStructureToDomain(dto.educationStructure)
  const announcementTitle = dto.title?.trim() || undefined
  const detailedProgramName = dto.detailedProgramName?.trim() || undefined
  const otherNotes =
    resolveOtherNotesFromProgramResponse({
      otherMatters: dto.otherMatters,
      otherNotes: undefined,
    }) || undefined
  const remarks = dto.remarks?.trim() || undefined
  const educationTargetDetail = dto.educationTargetDetail?.trim() || undefined
  const nestedStudentListRequired = toStudentListRequired(
    (
      details.generalCommonInfo?.participantRecruitmentInfo as
        | { studentListRequired?: string }
        | undefined
    )?.studentListRequired
  )

  const nestedKpi = details.generalCommonInfo?.kpi
  const rootFinalParticipants = toJavaInt(dto.totalParticipants)
  const resolvedKpi = nestedKpi
    ? {
        ...nestedKpi,
        finalParticipants: rootFinalParticipants ?? nestedKpi.finalParticipants,
      }
    : rootFinalParticipants != null
      ? {
          finalParticipants: rootFinalParticipants,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 0,
          finalClasses: 0,
        }
      : undefined
  const topVenue = dto.venue?.trim() || undefined
  const topVenueDetail =
    typeof dto.venueDetail === 'string' ? dto.venueDetail.trim() || undefined : undefined
  const venueKind =
    dto.venueKind === 'inside' || dto.venueKind === 'outside' || dto.venueKind === 'other'
      ? dto.venueKind
      : undefined
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
    generalCommonInfo: details.generalCommonInfo,
  })
  const mapped = baseProgram({
    ...detailFields,
    id,
    sponsorId: dto.sponsorId ?? '',
    title,
    mainTitle:
      dto.mainTitle !== undefined
        ? dto.mainTitle?.trim() || undefined
        : typeof detailFields.mainTitle === 'string'
          ? detailFields.mainTitle
          : undefined,
    // 세부 프로그램 마스터 id — 일반 프로그램 어댑터와 동일하게 top-level 필드로 읽어온다.
    detailedProgramId: dto.detailedProgramId != null ? String(dto.detailedProgramId) : undefined,
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
    ...resolveBusinessPeriodDates(dto),
    applicationStartDate: dto.applicationStartDate,
    applicationEndDate: dto.applicationEndDate,
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus:
      toTypedProgramLifecycleStatus(dto.lifecycleStatus) ??
      toTypedProgramLifecycleStatus(dto.periodStatus),
    businessArea: resolveStoredBusinessArea(dto.businessArea) || undefined,
    titleEn: dto.titleEn !== undefined ? dto.titleEn : detailFields.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district !== undefined ? dto.district : detailFields.district,
    ips: dto.ips !== undefined ? (dto.ips as Program['ips']) : detailFields.ips,
    targetLevel: persistedTargetLevels[0],
    targetLevels:
      columnSource !== undefined || persistedTargetLevels.length > 0
        ? persistedTargetLevels
        : undefined,
    institutionType: dto.institutionType as Program['institutionType'],
    ipOwned: normalizeIpOwnedSelectValue(dto.ipOwned),
    courseDeliveredBy: toCourseDeliveredBy(dto.courseDeliveredBy),
    partnerInvolvement: dto.partnerInvolvement ?? undefined,
    programCategory:
      dto.programCategory !== undefined ? dto.programCategory : detailFields.programCategory,
    programChannel:
      dto.programChannel !== undefined ? dto.programChannel : detailFields.programChannel,
    educationTime: dto.educationTime,
    teamDivision: dto.teamDivision,
    educationProcess: dto.educationProcess?.trim() || undefined,
    maleParticipants: dto.maleParticipants,
    femaleParticipants: dto.femaleParticipants,
    totalParticipants: rootFinalParticipants ?? dto.totalParticipants,
    participatingSchoolCount: details.participatingSchoolCount,
    generalTeachers: dto.generalTeachers,
    educatedTeachers: dto.educatedTeachers,
    instructors: dto.instructors,
    managerName: dto.managerName,
    venue: topVenue,
    curriculum: dto.curriculum,
    contactName: dto.contactName?.trim() || undefined,
    contactEmail: dto.contactEmail?.trim() || undefined,
    contactPhone: dto.contactPhone?.trim() || undefined,
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
    // BE 응답은 구버전/Primary 데이터에서 serviceDetailJson 중첩값만 제공할 수 있다.
    // top-level 컬럼이 있으면 그것을 우선하고, 없을 때만 같은 원격 응답의 nested 값을 사용한다.
    studentListRequired: toStudentListRequired(dto.studentListRequired) ?? nestedStudentListRequired,
    remarks,
    educationTargetDetail,
    generalParticipantTypes: ['school_institution'],
    generalProgramEducationStructure: educationStructure,
    generalCommonInfo: clearTeacherTrainingScheduleIfOff({
      ...details.generalCommonInfo,
      announcementTitle,
      detailedProgramName,
      venueKind,
      venueDetail: topVenueDetail,
      ...(resolvedKpi ? { kpi: resolvedKpi } : { kpi: undefined }),
      participantRecruitmentInfo: mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
        {
          ...details.generalCommonInfo?.participantRecruitmentInfo,
          ...(remarks ? { remarks } : {}),
          ...(educationTargetDetail ? { educationTargetDetail } : {}),
        },
        dto
      ),
    }),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    backendProgramType: dto.programType ?? TRAINED_TEACHER_PROGRAM_API_TYPE,
    programRecruitments: toProgramRecruitmentWindows(dto.recruitments),
    schedules: mapProgramSchedules(dto.schedules),
  })
  return mapped
}

function mapRounds(program: Program): ProgramUpdateRequest['rounds'] {
  return program.rounds.map(round => ({
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

function mergeTrainedTeacherUpdateProgram(program: Program, patch: Partial<Program>): Program {
  const merged: Program = { ...program, ...patch }
  if (patch.generalCommonInfo) {
    merged.generalCommonInfo = {
      ...program.generalCommonInfo,
      ...patch.generalCommonInfo,
    }
  }
  return merged
}

export function mapTrainedTeacherToUpdateRequest(
  program: Program,
  patch?: Partial<Program>,
  options?: { omitInfoDetailOwnedFields?: boolean; omitRegistrationOverlay?: boolean }
): ProgramUpdateRequest {
  const merged = patch ? mergeTrainedTeacherUpdateProgram(program, patch) : program
  const educationStructure = mapDomainEducationStructureToApi(
    merged.generalProgramEducationStructure
  )
  // 일정형은 id 를 보내면 BE 가 거절한다. 커리큘럼형은 마스터 id 가 없으면
  // CURRICULUM_PROGRAM_DETAILED_PROGRAM_REQUIRED.
  const detailedProgramId =
    educationStructure === 'SCHEDULE'
      ? undefined
      : parseDetailedProgramMasterId(merged.detailedProgramId)
  const detailedProgramName = merged.generalCommonInfo?.detailedProgramName
  const sponsorIdsFromForm = (
    merged.generalCommonInfo?.sponsorManagementIds?.length
      ? merged.generalCommonInfo.sponsorManagementIds
      : merged.generalCommonInfo?.sponsorManagementId
        ? [merged.generalCommonInfo.sponsorManagementId]
        : merged.sponsorId
          ? [merged.sponsorId]
          : []
  )
    .map(id => String(id).trim())
    .filter(Boolean)
  const contactIds = merged.generalCommonInfo?.sponsorManagerContactIds
  const contactRefs =
    contactIds != null
      ? normalizeSponsorManagerContactIds({ ids: contactIds })
      : normalizeSponsorManagerContactIds({
          id: merged.generalCommonInfo?.sponsorManagerContactId,
        })
  const sponsors = buildProgramSponsorAssignmentsWire(sponsorIdsFromForm, contactRefs)
  const primarySponsorId =
    sponsors.find(s => s.sponsorContactId)?.sponsorId || sponsors[0]?.sponsorId || merged.sponsorId
  const businessArea = resolveStoredBusinessArea(merged.businessArea) || undefined
  const previousBusinessArea = resolveStoredBusinessArea(program.businessArea) || undefined
  // 빈 문자열로 사업을 지우면 400 — clearFields만 사용
  const clearBusinessArea = !businessArea && Boolean(previousBusinessArea)
  const persistedTargetLevels = resolvePersistedProgramTargetLevels(merged)
  const includeTargetLevels = Array.isArray(merged.targetLevels) || persistedTargetLevels.length > 0
  const serializeBase = includeTargetLevels
    ? { ...merged, targetLevels: persistedTargetLevels, targetLevel: persistedTargetLevels[0] }
    : merged
  // clearFields 시 envelope에 stale BA가 남지 않도록 제거
  const serializeSource = clearBusinessArea
    ? { ...serializeBase, businessArea: undefined }
    : serializeBase
  const venueName = merged.venue?.trim() || undefined
  const venueDetail = merged.generalCommonInfo?.venueDetail?.trim() || undefined
  const venueKind =
    merged.generalCommonInfo?.venueKind === 'inside' ||
    merged.generalCommonInfo?.venueKind === 'outside' ||
    merged.generalCommonInfo?.venueKind === 'other'
      ? merged.generalCommonInfo.venueKind
      : undefined
  const body: ProgramUpdateRequest = {
    sponsorId: primarySponsorId,
    sponsors,
    // 공고용 프로그램명 — 최상위 title (JSON announcementTitle은 echo)
    title: merged.title,
    type: merged.type,
    format: merged.format,
    category: merged.category,
    description: merged.description,
    startDate: toDate(merged.startDate),
    endDate: toDate(merged.endDate),
    businessStartDate: toDate(merged.startDate),
    businessEndDate: toDate(merged.endDate),
    applicationStartDate: toDate(merged.applicationStartDate),
    applicationEndDate: toDate(merged.applicationEndDate),
    ...(businessArea ? { businessArea } : {}),
    // 일정형은 id 를 생략한다. 커리큘럼형은 숫자 마스터 id 만 보낸다.
    // 교재명·팀구분에 detailedProgramName 을 복제한 값이면 omit.
    educationStructure,
    detailedProgramId,
    titleEn: merged.titleEn,
    // 대표 프로그램명 국문 — title·announcementTitle로 채우지 않는다.
    mainTitle: merged.mainTitle,
    // 세부 프로그램명은 detailedProgramName. 교재명 컬럼을 그 값으로 덮지 않는다.
    textbookName: merged.textbookName,
    textbookNameEn: merged.textbookNameEn,
    schoolId: merged.schoolId,
    district: merged.district,
    ips: merged.ips,
    targetLevels: includeTargetLevels ? persistedTargetLevels : undefined,
    targetLevel: persistedTargetLevels[0],
    institutionType: merged.institutionType,
    ipOwned: merged.ipOwned,
    courseDeliveredBy: merged.courseDeliveredBy,
    partnerInvolvement: merged.partnerInvolvement,
    programCategory: merged.programCategory ?? undefined,
    programChannel: merged.programChannel ?? undefined,
    educationTime: toJavaInt(merged.educationTime),
    teamDivision: omitIfDetailedProgramNameAlias(merged.teamDivision, detailedProgramName),
    educationProcess: merged.educationProcess,
    maleParticipants: toJavaInt(merged.maleParticipants),
    femaleParticipants: toJavaInt(merged.femaleParticipants),
    totalParticipants: toJavaInt(
      merged.totalParticipants ?? merged.generalCommonInfo?.kpi?.finalParticipants
    ),
    generalTeachers: toJavaInt(merged.generalTeachers),
    educatedTeachers: toJavaInt(merged.educatedTeachers),
    instructors: toJavaInt(merged.instructors),
    managerName: merged.managerName,
    venue: venueName,
    ...(venueDetail ? { venueDetail } : {}),
    ...(venueKind ? { venueKind } : {}),
    curriculum: merged.curriculum,
    contactEmail: merged.contactEmail,
    contactPhone: merged.contactPhone,
    remarks: merged.remarks,
    educationTargetDetail: merged.educationTargetDetail,
    studentListRequired: merged.studentListRequired,
    oneLineIntroduction: merged.oneLineIntroduction,
    keyVisualImage: merged.keyVisualImage ?? merged.posterImage,
    settlementRuleId: merged.settlementRuleId,
    applicationPathId: merged.applicationPathId,
    additionalContentHtml: merged.additionalContentHtml,
    recruitmentGuide: merged.recruitmentGuide,
    learningSupportContent: merged.learningSupportContent,
    attachmentFileNames: merged.attachmentFileNames,
    rounds: mapRounds(merged),
    serviceDetailJson: serializeTrainedTeacherServiceDetailJson(serializeSource, {
      omitInfoDetailOwnedFields: options?.omitInfoDetailOwnedFields !== false,
      omitRegistrationOverlay: options?.omitRegistrationOverlay === true,
    }),
  }
  // top-level 3필드가 stale serviceDetailJson 보다 우선 (BE handoff 2026-09-29)
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'full',
    merged,
    existing: program,
  })
  if (clearBusinessArea) {
    const clearFields = [...(body.clearFields ?? [])]
    if (!clearFields.includes('businessArea')) clearFields.push('businessArea')
    body.clearFields = clearFields
  }
  return body
}

export function mapTrainedTeacherToCreateRequest(program: Program): ProgramCreateRequest {
  return omitNullRecordValues({
    ...mapTrainedTeacherToUpdateRequest(program, undefined, {
      omitInfoDetailOwnedFields: false,
      omitRegistrationOverlay: true,
    }),
    programType: TRAINED_TEACHER_PROGRAM_API_TYPE,
    applicationTargetMode: 'ORGANIZATION',
    businessStartDate: toDate(program.startDate),
    businessEndDate: toDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }) as ProgramCreateRequest
}
