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
  decodeSponsorManagerContactRef,
} from '@/features/program/general/model/common-info-edit-schema'
import { resolveProgramTargetLevels } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  parseTrainedTeacherServiceDetailJson,
  serializeTrainedTeacherServiceDetailJson,
} from './service-detail-json'

export const TRAINED_TEACHER_PROGRAM_API_TYPE = 'TRAINED_TEACHER'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

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
  const dtoExt = dto as ProgramResponse & {
    remarks?: string
    otherMatters?: string
    contactName?: string
    recruitmentTargetDetail?: string
  }
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

  const periodStatus = (dto as ProgramResponse & { periodStatus?: string }).periodStatus
  /** 1급 API 필드 우선, 없을 때만 serviceDetailJson fallback */
  const educationStructure =
    mapApiEducationStructureToDomain(dto.educationStructure) ??
    details.generalProgramEducationStructure
  const detailedProgramName =
    dto.detailedProgramName?.trim() || details.generalCommonInfo?.detailedProgramName
  const participantRemarks = (
    details.generalCommonInfo?.participantRecruitmentInfo as { remarks?: string } | undefined
  )?.remarks
  const otherNotes =
    dtoExt.otherMatters?.trim() ||
    dtoExt.remarks?.trim() ||
    details.otherNotes?.trim() ||
    participantRemarks?.trim() ||
    undefined

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
    totalParticipants: dto.totalParticipants,
    generalTeachers: dto.generalTeachers,
    educatedTeachers: dto.educatedTeachers,
    /** TT Primary — 강사 Relation 없음. API null/0을 유지하고 UI에 노출하지 않음 */
    instructors: dto.instructors ?? 0,
    managerName: dto.managerName,
    venue: dto.venue,
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
    generalParticipantTypes: ['school_institution'],
    generalProgramEducationStructure: educationStructure,
    generalCommonInfo: {
      ...details.generalCommonInfo,
      ...(detailedProgramName ? { detailedProgramName } : {}),
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
  const sponsorContactRef = merged.generalCommonInfo?.sponsorManagerContactId?.trim()
  const decodedContact = sponsorContactRef
    ? decodeSponsorManagerContactRef(sponsorContactRef)
    : null
  const primarySponsorId =
    merged.generalCommonInfo?.sponsorManagementIds?.[0] ||
    decodedContact?.sponsorManagementId ||
    merged.sponsorId
  const sponsors =
    primarySponsorId != null && String(primarySponsorId).trim() !== ''
      ? [
          {
            sponsorId: String(primarySponsorId),
            ...(decodedContact?.contactId
              ? { sponsorContactId: decodedContact.contactId }
              : {}),
          },
        ]
      : undefined
  return {
    sponsorId: merged.sponsorId || primarySponsorId,
    sponsors,
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
    educationTime: merged.educationTime,
    teamDivision: merged.teamDivision,
    educationProcess: merged.educationProcess,
    maleParticipants: merged.maleParticipants,
    femaleParticipants: merged.femaleParticipants,
    totalParticipants: merged.totalParticipants,
    generalTeachers: merged.generalTeachers,
    educatedTeachers: merged.educatedTeachers,
    instructors: merged.instructors,
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
    businessStartDate: toDate(program.startDate),
    businessEndDate: toDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }
}
