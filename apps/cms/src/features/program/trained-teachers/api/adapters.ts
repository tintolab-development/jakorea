import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramCreateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programCreateRequestEducationStructure'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramUpdateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestEducationStructure'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { ProgramResponseEducationStructure } from '@/shared/api/generated/logs/schemas/programResponseEducationStructure'
import type {
  GeneralProgramEducationStructure,
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types'
import { toTypedProgramLifecycleStatus } from '@/shared/lib/program-typed-lifecycle'
import {
  encodeSponsorManagerContactRef,
  buildProgramSponsorAssignmentsWire,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import type { AdminProgramSponsorAssignmentDto } from '@/features/program/general/api/programs-api-client'
import { resolveProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  parseTrainedTeacherServiceDetailJson,
  serializeTrainedTeacherServiceDetailJson,
} from './service-detail-json'
import { clearTeacherTrainingScheduleIfOff } from '../lib/teacher-training-schedule'

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

const DEFAULT_SPONSOR_ID = 'sponsor-default'

/** BE `ProgramUpdateRequest` Integer — 초과 시 Jackson MALFORMED_REQUEST */
const JAVA_INT_MAX = 2_147_483_647

function toJavaInt(value: number | null | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  const n = Math.trunc(value)
  if (n < 0) return undefined
  return Math.min(n, JAVA_INT_MAX)
}

/** GET …/sponsors 배정을 Program 후원·담당자 필드로 병합 (contact∈sponsor 유지) */
export function mergeTrainedTeacherSponsorAssignments(
  program: Program,
  assignments: readonly AdminProgramSponsorAssignmentDto[]
): Program {
  const valid = assignments.filter(
    row => row.sponsorId != null && String(row.sponsorId).trim() !== ''
  )
  if (valid.length === 0) return program

  const sponsorManagementIds = [
    ...new Set(valid.map(row => String(row.sponsorId).trim())),
  ]
  const sponsorManagerContactIds: string[] = []
  const sponsorManagerContactNames: Record<string, string> = {}
  for (const row of valid) {
    const contactId = row.sponsorContactId != null ? String(row.sponsorContactId).trim() : ''
    if (!contactId) continue
    const ref = encodeSponsorManagerContactRef(String(row.sponsorId).trim(), contactId)
    if (!sponsorManagerContactIds.includes(ref)) sponsorManagerContactIds.push(ref)
    const contactName = row.sponsorContactName?.trim()
    if (contactName) sponsorManagerContactNames[ref] = contactName
  }
  const managerName =
    Object.values(sponsorManagerContactNames)[0] || program.managerName

  return {
    ...program,
    sponsorId: sponsorManagementIds[0] ?? program.sponsorId,
    managerName,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      sponsorManagementIds,
      sponsorManagerContactIds,
      sponsorManagerContactId: sponsorManagerContactIds[0],
      sponsorManagerContactNames,
    },
  }
}

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
  const title =
    item.nameKo?.trim() || item.title?.trim() || item.mainTitle?.trim() || '제목 없음'
  const textbookName = item.textbookName?.trim() || item.detailedProgramName?.trim() || undefined
  const managerName = item.managerName?.trim() || undefined
  const venue = item.venue?.trim() || undefined
  const targetLevels = resolveProgramTargetLevels({
    targetLevel: item.targetLevel,
    targetLevels: item.targetLevels,
  })
  return baseProgram({
    id: item.id == null ? '' : String(item.id),
    title,
    mainTitle: item.mainTitle?.trim() || title,
    startDate: item.businessStartDate ?? item.startDate,
    endDate: item.businessEndDate ?? item.endDate,
    lifecycleStatus: resolveListLifecycleStatus(item),
    targetLevel: targetLevels[0],
    targetLevels: targetLevels.length > 0 ? targetLevels : undefined,
    approvedStudentCount:
      toOptionalNumber(item.participantApprovedCount) ??
      toOptionalNumber(item.approvedOrganizationApplicationCount) ??
      toOptionalNumber(item.applicantCount),
    participantCapacity:
      toOptionalNumber(item.participantCapacity) ??
      toOptionalNumber(item.participantRecruitmentCount),
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
    ipOwned: item.ipOwned?.trim() || undefined,
    courseDeliveredBy: item.courseDeliveredBy as Program['courseDeliveredBy'],
    institutionType: item.institutionType as Program['institutionType'],
    teamDivision: item.teamDivision?.trim() || undefined,
    district: item.district?.trim() || undefined,
    // 목록 GET `rounds: []` 는 경량 계약 — 저장 실패가 아님. 상세 GET 전 커리큘럼 원복으로 쓰지 말 것.
    rounds: [],
    generalCommonInfo: textbookName
      ? {
          detailedProgramName: textbookName,
        }
      : undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })
}

export function mapTrainedTeacherDetailToProgram(dto: ProgramResponse): Program {
  const title = dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
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

  /** 1급 API 필드 우선, 없을 때만 serviceDetailJson fallback */
  const educationStructure =
    mapApiEducationStructureToDomain(dto.educationStructure) ??
    details.generalProgramEducationStructure
  /** 공고용 — top-level title SSOT. nested announcementTitle 구값으로 헤더만 바뀐 것처럼 보이지 않게 */
  const announcementTitle =
    dto.title?.trim() || details.generalCommonInfo?.announcementTitle
  /** 세부명 — PATCH는 textbookName. nested detailedProgramName 구값이 신 컬럼을 가리지 않게 */
  const detailedProgramName =
    dto.detailedProgramName?.trim() ||
    dto.textbookName?.trim() ||
    details.generalCommonInfo?.detailedProgramName
  const participantRemarks = (
    details.generalCommonInfo?.participantRecruitmentInfo as { remarks?: string } | undefined
  )?.remarks
  /** otherNotes ≠ remarks — 모집 비고(remarks)와 분리 */
  const otherNotes = dto.otherMatters?.trim() || details.otherNotes?.trim() || undefined
  const remarks = dto.remarks?.trim() || participantRemarks?.trim() || undefined
  const educationTargetDetail =
    (
      details.generalCommonInfo?.participantRecruitmentInfo as
        | { educationTargetDetail?: string }
        | undefined
    )?.educationTargetDetail?.trim() ||
    (details as { educationTargetDetail?: string }).educationTargetDetail?.trim() ||
    undefined

  const nestedKpi = details.generalCommonInfo?.kpi
  const rootFinalParticipants = toJavaInt(dto.totalParticipants)
  /** KPI는 serviceDetailJson nested kpi SSOT — top-level finalSchools/venueKind 등은 OpenAPI v9에서 제거 */
  const resolvedKpi = {
    ...nestedKpi,
    finalParticipants: rootFinalParticipants ?? nestedKpi?.finalParticipants ?? 0,
    instructorCount: nestedKpi?.instructorCount ?? 0,
    volunteerCount: nestedKpi?.volunteerCount ?? 0,
    finalSchools: nestedKpi?.finalSchools ?? details.participatingSchoolCount ?? 0,
    finalClasses: nestedKpi?.finalClasses ?? 0,
  }
  const nestedVenueKind = details.generalCommonInfo?.venueKind
  const nestedVenueDetail = details.generalCommonInfo?.venueDetail?.trim()
  const venueDetail = dto.venue?.trim() || nestedVenueDetail
  const explicitVenueKind =
    nestedVenueKind === 'inside' ||
    nestedVenueKind === 'outside' ||
    nestedVenueKind === 'other'
      ? nestedVenueKind
      : undefined
  // 기타(직접입력)는 institutionType 컬럼에 없다. nested venueKind가 있으면 그 선택을 유지한다.
  const venueKind =
    explicitVenueKind ??
    (dto.institutionType === 'inside_school'
      ? ('inside' as const)
      : dto.institutionType === 'outside_school'
        ? ('outside' as const)
        : venueDetail
          ? ('other' as const)
          : undefined)

  return baseProgram({
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
    startDate: dto.startDate,
    endDate: dto.endDate,
    applicationStartDate: dto.applicationStartDate,
    applicationEndDate: dto.applicationEndDate,
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus: toTypedProgramLifecycleStatus(dto.lifecycleStatus),
    businessArea: dto.businessArea,
    titleEn: dto.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district,
    ips: dto.ips as Program['ips'],
    targetLevel:
      resolveProgramTargetLevels({
        targetLevels: details.targetLevels,
        targetLevel: details.targetLevels?.[0] ?? dto.targetLevel,
      })[0] ?? undefined,
    targetLevels: resolveProgramTargetLevels({
      targetLevels: details.targetLevels,
      targetLevel: details.targetLevels?.[0] ?? dto.targetLevel,
    }),
    institutionType:
      venueKind === 'other'
        ? undefined
        : venueKind === 'outside'
          ? 'outside_school'
          : venueKind === 'inside'
            ? 'inside_school'
            : (dto.institutionType as Program['institutionType']),
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
    totalParticipants: rootFinalParticipants ?? dto.totalParticipants,
    participatingSchoolCount:
      details.participatingSchoolCount ?? resolvedKpi.finalSchools,
    generalTeachers: dto.generalTeachers,
    educatedTeachers: dto.educatedTeachers,
    /** TT Primary — 강사 Relation 없음. API null/0을 유지하고 UI에 노출하지 않음 */
    instructors: dto.instructors ?? 0,
    managerName: dto.managerName,
    venue: dto.venue?.trim() || nestedVenueDetail || undefined,
    curriculum: dto.curriculum,
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
    studentListRequired: details.studentListRequired,
    remarks,
    educationTargetDetail,
    generalParticipantTypes: ['school_institution'],
    generalProgramEducationStructure: educationStructure,
    generalCommonInfo: clearTeacherTrainingScheduleIfOff({
      ...details.generalCommonInfo,
      ...(announcementTitle ? { announcementTitle } : {}),
      ...(detailedProgramName ? { detailedProgramName } : {}),
      ...(venueKind ? { venueKind } : {}),
      ...(venueDetail ? { venueDetail } : {}),
      kpi: resolvedKpi,
      participantRecruitmentInfo: {
        ...details.generalCommonInfo?.participantRecruitmentInfo,
        ...(remarks ? { remarks } : {}),
        ...(educationTargetDetail ? { educationTargetDetail } : {}),
      },
    }),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  })
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

export function mapTrainedTeacherToUpdateRequest(
  program: Program,
  patch?: Partial<Program>
): ProgramUpdateRequest {
  const merged = patch ? { ...program, ...patch } : program
  const educationStructure = mapDomainEducationStructureToApi(
    merged.generalProgramEducationStructure
  )
  const announcementTitle =
    merged.generalCommonInfo?.announcementTitle?.trim() || merged.title?.trim()
  const detailedProgramName =
    merged.generalCommonInfo?.detailedProgramName?.trim() || merged.textbookName?.trim()
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
  const contactRefs = normalizeSponsorManagerContactIds({
    ids: merged.generalCommonInfo?.sponsorManagerContactIds,
    id: merged.generalCommonInfo?.sponsorManagerContactId,
  })
  const sponsors = buildProgramSponsorAssignmentsWire(sponsorIdsFromForm, contactRefs)
  const primarySponsorId =
    sponsors.find(s => s.sponsorContactId)?.sponsorId ||
    sponsors[0]?.sponsorId ||
    merged.sponsorId
  return {
    sponsorId: primarySponsorId,
    sponsors: sponsors.length > 0 ? sponsors : undefined,
    title: announcementTitle || merged.title,
    type: merged.type,
    format: merged.format,
    category: merged.category,
    description: merged.description,
    startDate: toDate(merged.startDate),
    endDate: toDate(merged.endDate),
    applicationStartDate: toDate(merged.applicationStartDate),
    applicationEndDate: toDate(merged.applicationEndDate),
    businessArea: merged.businessArea,
    educationStructure,
    titleEn: merged.titleEn,
    mainTitle: merged.mainTitle ?? merged.title,
    textbookName: detailedProgramName || merged.textbookName,
    textbookNameEn: merged.textbookNameEn,
    schoolId: merged.schoolId,
    district: merged.district,
    ips: merged.ips,
    targetLevel: merged.targetLevels?.[0] ?? merged.targetLevel,
    institutionType: merged.institutionType,
    ipOwned: merged.ipOwned,
    courseDeliveredBy: merged.courseDeliveredBy,
    partnerInvolvement: merged.partnerInvolvement,
    programCategory: merged.programCategory ?? undefined,
    programChannel: merged.programChannel ?? undefined,
    educationTime: toJavaInt(merged.educationTime),
    teamDivision: merged.teamDivision,
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
    venue:
      merged.venue?.trim() ||
      merged.generalCommonInfo?.venueDetail?.trim() ||
      undefined,
    curriculum: merged.curriculum,
    contactEmail: merged.contactEmail,
    contactPhone: merged.contactPhone,
    oneLineIntroduction: merged.oneLineIntroduction,
    keyVisualImage: merged.keyVisualImage ?? merged.posterImage,
    settlementRuleId: merged.settlementRuleId,
    applicationPathId: merged.applicationPathId,
    additionalContentHtml: merged.additionalContentHtml,
    recruitmentGuide: merged.recruitmentGuide,
    learningSupportContent: merged.learningSupportContent,
    attachmentFileNames: merged.attachmentFileNames,
    rounds: mapRounds(merged),
    serviceDetailJson: serializeTrainedTeacherServiceDetailJson(merged),
  }
}

export function mapTrainedTeacherToCreateRequest(program: Program): ProgramCreateRequest {
  return {
    ...mapTrainedTeacherToUpdateRequest(program),
    programType: TRAINED_TEACHER_PROGRAM_API_TYPE,
    applicationTargetMode: 'ORGANIZATION',
    businessStartDate: toDate(program.startDate),
    businessEndDate: toDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }
}
