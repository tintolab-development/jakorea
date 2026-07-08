import type {
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types/index'
import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'

const DEFAULT_SPONSOR_ID = 'sponsor-default'
const DEFAULT_ROUNDS: Program['rounds'] = []

function toProgramId(value: number | string | undefined): string {
  if (value == null || value === '') return ''
  return String(value)
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
  const title = dto.nameKo?.trim() || '제목 없음'
  const lifecycleStatus =
    mapPeriodStatusToLifecycle(dto.periodStatus) ?? ('recruiting_students' as ProgramLifecycleStatus)

  return baseProgramDefaults({
    id: toProgramId(dto.id),
    title,
    mainTitle: title,
    startDate: dto.businessStartDate ?? undefined,
    endDate: dto.businessEndDate ?? undefined,
    lifecycleStatus,
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount,
    instructors: dto.instructorApplicantCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  })
}

export function mapAdminProgramDetailToProgram(dto: ProgramResponse): Program {
  const title = dto.title?.trim() || dto.mainTitle?.trim() || '제목 없음'
  const id = toProgramId(dto.id)
  const now = new Date().toISOString()

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
