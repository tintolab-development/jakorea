/**
 * CMS Portal 공개 프로그램 계약
 * GET /api/portal/programs/{programId}
 */

export type {
  PortalAttachment,
  PortalCurriculum,
  PortalCurriculumSession,
  PortalEducationCurriculumSession,
  PortalEducationScheduleDetail,
  PortalEducationScheduleRange,
  PortalProgramDetail,
  PortalRecruitment,
  PortalSchedule,
  PortalVolunteerInterviewSchedule,
  PortalVolunteerInterviewScheduleOption,
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
  /**
   * 목록 교육 형태. `online` | `offline` | `hybrid` | `participant_choice`.
   * 없으면 `operationMethod`. 목록에는 한글 라벨이 없다.
   */
  educationForm?: 'online' | 'offline' | 'hybrid' | 'participant_choice' | string | null
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  /** 목록 운영 기간. 없으면 사업 기간. */
  operationStartDate?: string | null
  operationEndDate?: string | null
  periodStatus?: string
  recruitmentStatus?: string
  recruitmentStartAt?: string
  recruitmentEndAt?: string
  applicationTargetMode?: string
  availableApplicationTypes?: string[]
  /**
   * 모집 공고 행 단위로 내려올 때만 존재한다.
   * program당 1행인 현행 응답에는 없다. 프론트에서 생성하지 않는다.
   */
  recruitmentId?: number
  recruitmentType?: string
  targetType?: string
  /** 행 단위 단일 신청 유형. 있으면 `availableApplicationTypes`보다 우선한다. */
  applicationType?: string
  canApply?: boolean
  thumbnailFileObjectId?: number
  educationTarget?: string
  educationTargets?: string[]
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
  programType?: string
  recruitmentStatus?: string
  /** 목록 필터 — 프로그램 `educationTargets` 포함(OR) 매칭. UI `recruitmentTarget`/`educationTarget` 병합값 */
  educationTargets?: string
  educationMethod?: string
  operatingFrom?: string
  operatingTo?: string
  sort?: string
  page: number
  size: number
}
