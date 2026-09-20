/**
 * CMS Portal 공개 프로그램 계약
 * GET /api/portal/programs/{programId}
 */

export type PortalRecruitment = {
  recruitmentId?: number
  recruitmentType?: string
  targetType?: string
  status?: string
  startAt?: string
  endAt?: string
  applicationTypes?: string[]
  open?: boolean
}

export type PortalSchedule = {
  scheduleId?: number
  sessionNo?: number
  scheduleName?: string
  startAt?: string
  endAt?: string
  allDay?: boolean
  locationName?: string
  address?: string
  addressDetail?: string
}

export type PortalCurriculumSession = {
  sessionId?: number
  scheduleId?: number
  sessionNo?: number
  title?: string
  content?: string
  durationMinutes?: number
}

export type PortalCurriculum = {
  curriculumId?: number
  title?: string
  description?: string
  sessions?: PortalCurriculumSession[]
}

export type PortalAttachment = {
  attachmentId?: number
  fileObjectId?: number
  attachmentType?: string
  originalFileName?: string
  contentType?: string
  fileSize?: number
}

/** GET /api/portal/programs 목록 행 (런타임 계약. OpenAPI ProgramSummary와 다름) */
export type PortalProgramListItem = {
  programId?: number
  programUuid?: string
  programCode?: string
  programType?: string
  portalCategories?: string[]
  title?: string
  summary?: string
  operationMethod?: string
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  periodStatus?: string
  recruitmentStatus?: string
  recruitmentStartAt?: string
  recruitmentEndAt?: string
  applicationTargetMode?: string
  availableApplicationTypes?: string[]
  canApply?: boolean
  thumbnailFileObjectId?: number
  educationTarget?: string
}

export type PortalProgramListPage = {
  items?: PortalProgramListItem[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export type PortalProgramListQuery = {
  keyword?: string
  portalTab?: string
  recruitmentStatus?: string
  recruitmentTarget?: string
  educationTarget?: string
  educationMethod?: string
  operatingFrom?: string
  operatingTo?: string
  sort?: string
  page: number
  size: number
}

export type PortalProgramDetail = {
  programId?: number
  programUuid?: string
  programCode?: string
  programType?: string
  portalCategories?: string[]
  title?: string
  titleEn?: string
  summary?: string
  description?: string
  operationMethod?: string
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  periodStatus?: string
  recruitmentStatus?: string
  applicationTargetMode?: string
  businessField?: string
  venue?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  additionalContentHtml?: string
  recruitmentGuide?: string
  learningSupportContent?: string
  otherMatters?: string
  remarks?: string
  educationTarget?: string
  educationTargetDetail?: string
  recruitmentTargetDetail?: string
  thumbnailFileObjectId?: number
  sponsorNames?: string[]
  recruitments?: PortalRecruitment[]
  schedules?: PortalSchedule[]
  curricula?: PortalCurriculum[]
  attachments?: PortalAttachment[]
}
