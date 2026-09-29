/**
 * CMS Portal 공개 프로그램 계약
 * GET /api/portal/programs/{programId}
 */

export type {
  PortalAttachment,
  PortalCurriculum,
  PortalCurriculumSession,
  PortalProgramDetail,
  PortalRecruitment,
  PortalSchedule,
} from '@jakorea/domain/portal/program-detail'

/** GET /api/portal/programs 목록 행 (OpenAPI PortalProgramListItem) */
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
  educationTargets?: string[]
  featuredOnHome?: boolean
  homeDisplayOrder?: number
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
  featuredOnHome?: boolean
  page: number
  size: number
}
