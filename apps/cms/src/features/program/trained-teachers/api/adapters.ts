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
  const sponsorManagerContactIds = valid
    .filter(
      row => row.sponsorContactId != null && String(row.sponsorContactId).trim() !== ''
    )
    .map(row =>
      encodeSponsorManagerContactRef(String(row.sponsorId), String(row.sponsorContactId))
    )
  const withContact = valid.find(
    row => row.sponsorContactId != null && String(row.sponsorContactId).trim() !== ''
  )
  const managerName =
    withContact?.sponsorContactName?.trim() || program.managerName

  return {
    ...program,
    sponsorId: sponsorManagementIds[0] ?? program.sponsorId,
    managerName,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      sponsorManagementIds,
      sponsorManagerContactIds,
      sponsorManagerContactId: sponsorManagerContactIds[0],
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

export function mapTrainedTeacherListItemToProgram(dto: AdminProgramListItemDto): Program {
  const title =
    dto.nameKo?.trim() || dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  return baseProgram({
    id: dto.id == null ? '' : String(dto.id),
    title,
    mainTitle: dto.mainTitle?.trim() || title,
    startDate: dto.businessStartDate ?? dto.startDate,
    endDate: dto.businessEndDate ?? dto.endDate,
    lifecycleStatus: resolveListLifecycleStatus(dto),
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount,
    participatingSchoolCount: dto.organizationApplicationCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
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

  const periodStatus = dto.periodStatus
  /** 1급 API 필드 우선, 없을 때만 serviceDetailJson fallback */
  const educationStructure =
    mapApiEducationStructureToDomain(dto.educationStructure) ??
    details.generalProgramEducationStructure
  const detailedProgramName =
    dto.detailedProgramName?.trim() || details.generalCommonInfo?.detailedProgramName
  const participantRemarks = (
    details.generalCommonInfo?.participantRecruitmentInfo as { remarks?: string } | undefined
  )?.remarks
  /** otherNotes ≠ remarks — 모집 비고(remarks)와 분리 */
  const otherNotes = dto.otherMatters?.trim() || details.otherNotes?.trim() || undefined
  const remarks = dto.remarks?.trim() || participantRemarks?.trim() || undefined
  const educationTargetDetail =
    dto.educationTargetDetail?.trim() ||
    (
      details.generalCommonInfo?.participantRecruitmentInfo as
        | { educationTargetDetail?: string }
        | undefined
    )?.educationTargetDetail?.trim() ||
    (details as { educationTargetDetail?: string }).educationTargetDetail?.trim() ||
    undefined

  const nestedKpi = details.generalCommonInfo?.kpi
  const rootFinalSchools = toJavaInt(dto.finalSchools)
  const rootFinalClasses = toJavaInt(dto.finalClasses)
  const rootFinalParticipants = toJavaInt(dto.totalParticipants)
  /** top-level KPI SSOT → nested kpi 표시 동기화 (BE는 root + generalCommonInfo.kpi 미러) */
  const resolvedKpi = {
    ...nestedKpi,
    finalParticipants: rootFinalParticipants ?? nestedKpi?.finalParticipants ?? 0,
    instructorCount: nestedKpi?.instructorCount ?? 0,
    volunteerCount: nestedKpi?.volunteerCount ?? 0,
    finalSchools: rootFinalSchools ?? nestedKpi?.finalSchools ?? details.participatingSchoolCount ?? 0,
    finalClasses: rootFinalClasses ?? nestedKpi?.finalClasses ?? 0,
  }

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
    lifecycleStatus:
      toTypedProgramLifecycleStatus(dto.lifecycleStatus) ??
      toTypedProgramLifecycleStatus(periodStatus),
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
    totalParticipants: rootFinalParticipants ?? dto.totalParticipants,
    participatingSchoolCount:
      rootFinalSchools ?? details.participatingSchoolCount ?? resolvedKpi.finalSchools,
    generalTeachers: dto.generalTeachers,
    educatedTeachers: dto.educatedTeachers,
    /** TT Primary — 강사 Relation 없음. API null/0을 유지하고 UI에 노출하지 않음 */
    instructors: dto.instructors ?? 0,
    managerName: dto.managerName,
    venue: dto.venue?.trim() || dto.venueDetail?.trim() || undefined,
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
    generalCommonInfo: {
      ...details.generalCommonInfo,
      ...(detailedProgramName ? { detailedProgramName } : {}),
      ...(dto.venueKind === 'inside' ||
      dto.venueKind === 'outside' ||
      dto.venueKind === 'other' ||
      dto.venueKind === 'inside_school' ||
      dto.venueKind === 'outside_school'
        ? {
            venueKind:
              dto.venueKind === 'inside_school'
                ? 'inside'
                : dto.venueKind === 'outside_school'
                  ? 'outside'
                  : dto.venueKind === 'other'
                    ? 'other'
                    : dto.venueKind,
          }
        : {}),
      ...(dto.venueDetail?.trim() ? { venueDetail: dto.venueDetail.trim() } : {}),
      kpi: resolvedKpi,
      participantRecruitmentInfo: {
        ...details.generalCommonInfo?.participantRecruitmentInfo,
        ...(remarks ? { remarks } : {}),
        ...(educationTargetDetail ? { educationTargetDetail } : {}),
      },
    },
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
    remarks: merged.remarks?.trim() || undefined,
    educationTargetDetail: merged.educationTargetDetail?.trim() || undefined,
    venueKind: merged.generalCommonInfo?.venueKind,
    venueDetail: merged.generalCommonInfo?.venueDetail?.trim() || undefined,
    studentListRequired: merged.studentListRequired,
    finalSchools: toJavaInt(
      merged.participatingSchoolCount ?? merged.generalCommonInfo?.kpi?.finalSchools
    ),
    finalClasses: toJavaInt(merged.generalCommonInfo?.kpi?.finalClasses),
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
