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
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from '@/features/program/general/lib/general-program-service-detail-json'

/**
 * BE `applicationTargetMode` — OpenAPI codegen에 아직 없음.
 * CMS `generalProgramAudience`(기관/개인)와 대응. BOTH는 BE 허용값이나 CMS 대분류는 상호 배타.
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

const DEFAULT_SPONSOR_ID = 'sponsor-default'
const DEFAULT_ROUNDS: Program['rounds'] = []

function toProgramId(value: number | string | undefined): string {
  if (value == null || value === '') return ''
  return String(value)
}

function toRequestDate(value: Date | string | undefined): string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) return value.toISOString()
  return value
}

function mapPeriodStatusToLifecycle(periodStatus?: string): ProgramLifecycleStatus | undefined {
  if (!periodStatus) return undefined
  const normalized = periodStatus.trim().toUpperCase()
  switch (normalized) {
    case 'RECRUITING':
    case 'SCHEDULED':
    case 'PLANNED':
      return 'recruiting_students'
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'education_in_progress'
    case 'COMPLETED':
    case 'ENDED':
      return 'education_completed'
    default:
      return undefined
  }
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
  // 목록 OpenAPI 예시는 nameKo, 실제 BE 응답은 title/mainTitle을 내려준다.
  const title =
    dto.nameKo?.trim() || dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  const lifecycleStatus =
    mapPeriodStatusToLifecycle(dto.periodStatus) ??
    (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ??
    ('recruiting_students' as ProgramLifecycleStatus)

  return baseProgramDefaults({
    id: toProgramId(dto.id ?? dto.uuid),
    title,
    mainTitle: dto.mainTitle?.trim() || title,
    startDate: dto.businessStartDate ?? dto.startDate ?? undefined,
    endDate: dto.businessEndDate ?? dto.endDate ?? undefined,
    lifecycleStatus,
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount,
    instructors: dto.instructorApplicantCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  })
}

export function mapAdminProgramDetailToProgram(dto: ProgramResponse): Program {
  const dtoWithNameKo = dto as ProgramResponse & { nameKo?: string }
  const title =
    dto.title?.trim() ||
    dto.mainTitle?.trim() ||
    dtoWithNameKo.nameKo?.trim() ||
    '제목 없음'
  const id = toProgramId(dto.id)
  const now = new Date().toISOString()
  const serviceDetail = parseGeneralProgramServiceDetailJson(dto.serviceDetailJson)

  return baseProgramDefaults({
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
      })) ?? DEFAULT_ROUNDS,
    startDate: dto.startDate,
    endDate: dto.endDate,
    applicationStartDate: dto.applicationStartDate,
    applicationEndDate: dto.applicationEndDate,
    status: (dto.status as Status | undefined) ?? 'pending',
    lifecycleStatus: (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ?? undefined,
    businessArea: dto.businessArea,
    titleEn: dto.titleEn,
    textbookName: dto.textbookName,
    textbookNameEn: dto.textbookNameEn,
    schoolId: dto.schoolId,
    district: dto.district,
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
    ...serviceDetail,
    targetLevel: serviceDetail.targetLevels?.[0] ?? (dto.targetLevel as Program['targetLevel']),
  })
}

export function filterGeneralProgramsByOverviewStatus(
  programs: Program[],
  statusFilter: GeneralProgramOverviewStatusFilter | null
): Program[] {
  if (!statusFilter) return programs

  if (statusFilter === 'scheduled') {
    return programs.filter(program =>
      [
        'recruiting_students',
        'recruiting_instructors',
        'matching_completed',
        'education_before_textbook',
      ].includes(program.lifecycleStatus || '')
    )
  }

  if (statusFilter === 'in_progress') {
    return programs.filter(program =>
      ['education_after_textbook', 'education_in_progress'].includes(program.lifecycleStatus || '')
    )
  }

  return programs.filter(program =>
    ['education_completed', 'document_processing_completed'].includes(program.lifecycleStatus || '')
  )
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

function mapProgramCoreFieldsToRequest(program: Program): ProgramUpdateRequestBody {
  const targetLevel = program.targetLevels?.[0] ?? program.targetLevel
  const applicationTargetMode = mapAudienceToApplicationTargetMode(
    program.generalProgramAudience,
    program.generalParticipantTypes
  )

  return {
    sponsorId: program.sponsorId,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: toRequestDate(program.startDate),
    endDate: toRequestDate(program.endDate),
    applicationStartDate: toRequestDate(program.applicationStartDate),
    applicationEndDate: toRequestDate(program.applicationEndDate),
    businessArea: program.businessArea,
    titleEn: program.titleEn,
    mainTitle: program.mainTitle ?? program.title,
    textbookName: program.textbookName,
    textbookNameEn: program.textbookNameEn,
    schoolId: program.schoolId,
    district: program.district,
    ips: program.ips,
    targetLevel,
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
    // BE 필수 — serviceDetailJson 앞쪽에 둬 로깅·디버깅 시 잘리지 않게
    applicationTargetMode,
    rounds: mapProgramRoundsToRequest(program),
    serviceDetailJson: serializeGeneralProgramServiceDetailJson(program),
  }
}

export function mapGeneralProgramToCreateRequest(program: Program): ProgramCreateRequestBody {
  const core = mapProgramCoreFieldsToRequest(program)
  return {
    ...core,
    // OpenAPI `sponsorId`는 string — 숫자 id가 number로 직렬화되면 BE 검증/DB 오류 유발 가능
    sponsorId: program.sponsorId != null ? String(program.sponsorId) : undefined,
    programType: resolveGeneralProgramCreateProgramType(
      program.generalProgramAudience,
      program.generalParticipantTypes
    ),
    businessStartDate: toRequestDate(program.startDate),
    businessEndDate: toRequestDate(program.endDate),
    autoApplyDefaultFormBindings: true,
  }
}

export function mapGeneralProgramToUpdateRequest(
  program: Program,
  patch?: Partial<Program>
): ProgramUpdateRequestBody {
  const merged = patch ? { ...program, ...patch } : program
  return mapProgramCoreFieldsToRequest(merged)
}
