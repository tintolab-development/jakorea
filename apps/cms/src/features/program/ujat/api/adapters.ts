import type {
  AdminProgramListItemDto,
} from '@/features/program/general/api/programs-api-client'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type {
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types/index'
import {
  parseServiceDetail,
  serializeServiceDetail,
  type RegistrationSnapshot,
} from './service-detail'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

function now(): string {
  return new Date().toISOString()
}

function idOf(value: string | number | undefined): string {
  return value == null ? '' : String(value)
}

function dateValue(value: Date | string | undefined): string | undefined {
  return value instanceof Date ? value.toISOString() : value
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
  const title =
    dto.nameKo?.trim() || dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  return baseProgram({
    id: idOf(dto.id ?? dto.uuid),
    title,
    mainTitle: dto.mainTitle?.trim() || title,
    startDate: dto.businessStartDate ?? dto.startDate,
    endDate: dto.businessEndDate ?? dto.endDate,
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount,
    participatingSchoolCount: dto.organizationApplicationCount,
    instructors: dto.instructorApplicantCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  })
}

export function fromDetail(dto: ProgramResponse): Program {
  const id = idOf(dto.id)
  const title = dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  const timestamp = now()
  return baseProgram({
    id,
    sponsorId: dto.sponsorId ?? DEFAULT_SPONSOR_ID,
    title,
    mainTitle: dto.mainTitle ?? title,
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
    startDate: dto.startDate,
    endDate: dto.endDate,
    applicationStartDate: dto.applicationStartDate,
    applicationEndDate: dto.applicationEndDate,
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus: (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ?? 'planned',
    businessArea: dto.businessArea,
    titleEn: dto.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district,
    targetLevel: dto.targetLevel as Program['targetLevel'],
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
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    ...parseServiceDetail(dto.serviceDetailJson),
  })
}

function coreRequest(
  program: Program,
  registration?: RegistrationSnapshot
): ProgramUpdateRequest {
  return {
    sponsorId: program.sponsorId,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: dateValue(program.startDate),
    endDate: dateValue(program.endDate),
    applicationStartDate: dateValue(program.applicationStartDate),
    applicationEndDate: dateValue(program.applicationEndDate),
    businessArea: program.businessArea,
    titleEn: program.titleEn,
    mainTitle: program.mainTitle ?? program.title,
    textbookName: program.textbookName,
    textbookNameEn: program.textbookNameEn,
    schoolId: program.schoolId,
    district: program.district,
    targetLevel: program.targetLevels?.[0] ?? program.targetLevel,
    institutionType: program.institutionType,
    ipOwned: program.ipOwned,
    courseDeliveredBy: program.courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement,
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
    serviceDetailJson: serializeServiceDetail(program, registration),
  }
}

export function toCreateRequest(
  program: Program,
  registration?: RegistrationSnapshot
): ProgramCreateRequest {
  return {
    ...coreRequest(program),
    programType: 'UJAT',
    businessStartDate: dateValue(program.startDate),
    businessEndDate: dateValue(program.endDate),
    serviceDetailJson: serializeServiceDetail(program, registration),
    autoApplyDefaultFormBindings: true,
  }
}

export function toUpdateRequest(
  program: Program,
  patch?: Partial<Program>,
  registration?: RegistrationSnapshot
): ProgramUpdateRequest {
  return coreRequest(patch ? { ...program, ...patch } : program, registration)
}
