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
  PortalRecruitment,
  PortalSchedule,
  PortalVolunteerInterviewSchedule,
  PortalVolunteerInterviewScheduleOption,
} from '@jakorea/domain/portal/program-detail'

import type { PortalProgramDetail as DomainPortalProgramDetail } from '@jakorea/domain/portal/program-detail'

/**
 * 공개 Gemini 상세의 연수 요청 가능 기간은 기관 모집 기간과 별도인 최상위 필드다.
 * 백엔드가 비Gemini·미설정 값을 null로 반환하므로 optional/null을 모두 허용한다.
 */
export type PortalProgramDetail = DomainPortalProgramDetail & {
  trainingRequestStartDate?: string | null
  trainingRequestEndDate?: string | null
}

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

/**
 * 반복 query parameter로 전달되는 목록 필터.
 * 단일 값은 기존 계약과 동일하게 보내고, 여러 값은 같은 key를 반복한다.
 */
export type PortalProgramListFilterValue = string | readonly string[]

export type PortalProgramListQuery = {
  keyword?: string
  portalTab?: PortalProgramListFilterValue
  /** 모집 유형 직접 조회. 전체 목록의 모집 행이 필요한 경우 서버 계약과 함께 사용한다. */
  applicationType?: PortalProgramListFilterValue
  programType?: PortalProgramListFilterValue
  recruitmentStatus?: PortalProgramListFilterValue
  /** 모집 대상 필터. 같은 필터의 여러 값은 OR, 다른 필터와는 AND로 적용한다. */
  recruitmentTarget?: PortalProgramListFilterValue
  /** 교육 대상 필터. 같은 필터의 여러 값은 OR, 다른 필터와는 AND로 적용한다. */
  educationTarget?: PortalProgramListFilterValue
  educationMethod?: PortalProgramListFilterValue
  operatingFrom?: string
  operatingTo?: string
  sort?: string
  page: number
  size: number
}
