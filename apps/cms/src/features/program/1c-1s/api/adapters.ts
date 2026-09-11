import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
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
import type { Status } from '@/types'
import {
  parseCompanySchoolServiceDetailJson,
  serializeCompanySchoolServiceDetailJson,
} from './service-detail-json'

export const COMPANY_SCHOOL_PROGRAM_API_TYPE = 'COMPANY_SCHOOL'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

function toDate(value: Date | string | undefined): string | undefined {
  if (value instanceof Date) return value.toISOString()
  return value
}

function lifecycleStatusFromPeriodStatus(value?: string): ProgramLifecycleStatus {
  switch (value?.trim().toUpperCase()) {
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'education_in_progress'
    case 'COMPLETED':
    case 'ENDED':
      return 'education_completed'
    default:
      return 'recruiting_students'
  }
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
  const title =
    dto.nameKo?.trim() || dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  return baseProgram({
    id: dto.id == null ? '' : String(dto.id),
    title,
    mainTitle: dto.mainTitle?.trim() || title,
    startDate: dto.businessStartDate ?? dto.startDate,
    endDate: dto.businessEndDate ?? dto.endDate,
    lifecycleStatus: dto.periodStatus
      ? lifecycleStatusFromPeriodStatus(dto.periodStatus)
      : ((dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ?? 'recruiting_students'),
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount,
    instructors: dto.instructorApplicantCount,
    participatingSchoolCount: dto.organizationApplicationCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  })
}

export function mapCompanySchoolDetailToProgram(dto: ProgramResponse): Program {
  const title = dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  const id = dto.id == null ? '' : String(dto.id)
  const now = new Date().toISOString()
  const details = parseCompanySchoolServiceDetailJson(dto.serviceDetailJson)

  return baseProgram({
    ...details,
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
    lifecycleStatus: dto.lifecycleStatus as ProgramLifecycleStatus | undefined,
    businessArea: dto.businessArea,
    titleEn: dto.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district,
    ips: dto.ips as Program['ips'],
    targetLevel: details.targetLevels?.[0] ?? (dto.targetLevel as Program['targetLevel']),
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
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
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
] as const satisfies ReadonlyArray<keyof Program>

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

/** GET 마스킹 값(`김*원`, `010-****-1234`)을 PATCH로 되쓰지 않기 위함 */
function looksMaskedProgramPii(value: string | null | undefined): boolean {
  if (value == null) return false
  return value.includes('*')
}

function mapCompanySchoolCoreFieldsToRequest(program: Program): ProgramUpdateRequest {
  return {
    sponsorId: program.sponsorId,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: toDate(program.startDate),
    endDate: toDate(program.endDate),
    applicationStartDate: toDate(program.applicationStartDate),
    applicationEndDate: toDate(program.applicationEndDate),
    businessArea: program.businessArea,
    titleEn: program.titleEn,
    mainTitle: program.mainTitle ?? program.title,
    textbookName: program.textbookName,
    textbookNameEn: program.textbookNameEn,
    schoolId: program.schoolId,
    district: program.district,
    ips: program.ips,
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
    keyVisualImage: program.keyVisualImage ?? program.posterImage,
    settlementRuleId: program.settlementRuleId,
    applicationPathId: program.applicationPathId,
    additionalContentHtml: program.additionalContentHtml,
    recruitmentGuide: program.recruitmentGuide,
    learningSupportContent: program.learningSupportContent,
    attachmentFileNames: program.attachmentFileNames,
    rounds: mapRounds(program),
    serviceDetailJson: serializeCompanySchoolServiceDetailJson(program),
  }
}

/**
 * 공통·모집 정보 등 **부분 수정**용 — `patch`에 있는 도메인 키만 UpdateRequest에 실음.
 * rounds·curriculum·담당자(미변경/마스킹) 등 화면 밖 필드는 보내지 않음.
 */
function mapCompanySchoolPatchFieldsToRequest(
  merged: Program,
  patch: Partial<Program>
): ProgramUpdateRequest {
  const body: ProgramUpdateRequest = {}
  const has = (key: keyof Program) => patchHasKey(patch, key)

  if (has('sponsorId')) {
    body.sponsorId = merged.sponsorId != null ? String(merged.sponsorId) : undefined
  }
  if (has('title')) body.title = merged.title
  if (has('type')) body.type = merged.type
  if (has('format')) body.format = merged.format
  if (has('category')) body.category = merged.category
  if (has('description')) body.description = merged.description
  if (has('startDate')) body.startDate = toDate(merged.startDate)
  if (has('endDate')) body.endDate = toDate(merged.endDate)
  if (has('applicationStartDate')) {
    body.applicationStartDate = toDate(merged.applicationStartDate)
  }
  if (has('applicationEndDate')) {
    body.applicationEndDate = toDate(merged.applicationEndDate)
  }
  if (has('businessArea')) body.businessArea = merged.businessArea
  if (has('titleEn')) body.titleEn = merged.titleEn
  if (has('mainTitle')) body.mainTitle = merged.mainTitle ?? merged.title
  if (has('textbookName')) body.textbookName = merged.textbookName
  if (has('textbookNameEn')) body.textbookNameEn = merged.textbookNameEn
  if (has('schoolId')) body.schoolId = merged.schoolId
  if (has('district')) body.district = merged.district
  if (has('ips')) body.ips = merged.ips
  if (has('targetLevel') || has('targetLevels')) {
    body.targetLevel = merged.targetLevels?.[0] ?? merged.targetLevel
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
  if (has('generalVolunteers')) body.generalVolunteers = 0
  if (has('staffVolunteers')) body.staffVolunteers = 0
  if (has('returningVolunteers')) body.returningVolunteers = 0
  if (has('generalTeachers')) body.generalTeachers = merged.generalTeachers
  if (has('educatedTeachers')) body.educatedTeachers = merged.educatedTeachers
  if (has('instructors')) body.instructors = merged.instructors
  if (has('managerName') && !looksMaskedProgramPii(merged.managerName)) {
    body.managerName = merged.managerName
  }
  if (has('venue')) body.venue = merged.venue
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
    body.serviceDetailJson = serializeCompanySchoolServiceDetailJson(merged)
  }

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
    return mapCompanySchoolPatchFieldsToRequest({ ...program, ...patch }, patch)
  }
  return mapCompanySchoolCoreFieldsToRequest(program)
}

export function mapCompanySchoolToCreateRequest(program: Program): ProgramCreateRequest {
  return {
    ...mapCompanySchoolToUpdateRequest(program),
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    businessStartDate: toDate(program.startDate),
    businessEndDate: toDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }
}
