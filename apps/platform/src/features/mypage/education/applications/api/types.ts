import type { PortalPreferredScheduleBlock } from '@/features/program/api/application-types'

export const PROGRAM_APPLICATION_TYPES = [
  'INDIVIDUAL',
  'ORGANIZATION',
  'INSTRUCTOR',
  'VOLUNTEER',
] as const

export type ProgramApplicationType = (typeof PROGRAM_APPLICATION_TYPES)[number]

/**
 * GET /api/portal/me/program-applications `statusGroup`.
 * `CANCELLED`는 BE에서 deprecated(COMPLETED와 동일) — FE 탭 조회에는 쓰지 않는다.
 */
export type ProgramApplicationStatusGroup =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type PortalProgramApplicationListQuery = {
  applicationType: ProgramApplicationType
  statusGroup?: ProgramApplicationStatusGroup
  status?: string
  programGroup?: string
  keyword?: string
  from?: string
  to?: string
  page: number
  size: number
}

export type PortalProgramApplicationListItem = {
  applicationId?: number
  applicationType?: string
  programId?: number
  programTitle?: string
  programType?: string
  programGroup?: string
  recruitmentId?: number
  recruitmentType?: string
  applicationStatus?: string
  submittedAt?: string
  updatedAt?: string
  cancellable?: boolean
  thumbnailFileObjectId?: number | null
  participationStatus?: string
  displayStatus?: string
  educationStartAt?: string | null
  educationEndAt?: string | null
  recruitmentStartAt?: string | null
  recruitmentEndAt?: string | null
  nextScheduleAt?: string | null
  progressPercent?: number | null
  unreadNoticeCount?: number
  pendingAssignmentCount?: number
  pendingSurveyCount?: number
  certificateAvailable?: boolean
  availableActions?: string[]
  /**
   * OpenAPI `ProgramApplicationSupplement`.
   * UJAT 기관 일정협의 배너는 `supplement.ujat.portalBannerState`만 SSOT.
   */
  supplement?: PortalProgramApplicationSupplement | null
}

/**
 * OpenAPI `UjatApplicationSupplementPortalBannerState`
 * (`MemberPortalUjatApplicationSupplement.portalBannerState`).
 * 배너 분기는 이 enum만 사용한다. applicationStatus/displayStatus로 추론하지 않는다.
 */
export const UJAT_PORTAL_BANNER_STATES = {
  NONE: 'NONE',
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  ADMIN_REVIEW: 'ADMIN_REVIEW',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  FINAL_APPROVED: 'FINAL_APPROVED',
  REJECTED: 'REJECTED',
} as const

export type UjatPortalBannerState =
  (typeof UJAT_PORTAL_BANNER_STATES)[keyof typeof UJAT_PORTAL_BANNER_STATES]

/** OpenAPI `UjatApplicationSupplement` — 포털 배너는 `portalBannerState`만 사용 */
export type PortalUjatApplicationSupplement = {
  temporaryAssignmentStatus?: string
  institutionConfirmationStatus?: string
  institutionConfirmedAt?: string
  assignmentLockedAt?: string
  assignmentRevision?: number
  assignmentLocked?: boolean
  portalBannerState?: UjatPortalBannerState | string
}

/** OpenAPI `ProgramApplicationSupplement` */
export type PortalProgramApplicationSupplement = {
  ujat?: PortalUjatApplicationSupplement
}

export type PortalProgramApplicationListPage = {
  items?: PortalProgramApplicationListItem[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

/**
 * `MemberPortalApplicationDetail` (Portal me program-application detail).
 * @see JABACK `docs/frontend/mypage-application-content-interview-banner-frontend-handoff-2026-10-09.md`
 */
export type PortalProgramApplicationDetail = PortalProgramApplicationListItem & {
  resultReason?: string | null
  formResponseId?: number
  formBindingId?: number
  templateVersionId?: number
  formResponseStatus?: string
  /**
   * 문단 id → 제출 답변. 없으면 BE `{}`.
   * MEMBER_SELF 상세의 기본정보(`*seed-basic-info`) `teacherTel` / `teacherMobile` /
   * `teacherEmail`은 마스킹되지 않은 원문 string (CMS admin 마스킹과 별개).
   */
  answers?: Record<string, unknown>
  /** 관리자 배정 2차 면접 — 미배정 `null` */
  assignedInterviewStartAt?: string | null
  assignedInterviewEndAt?: string | null
  /** Asia/Seoul `YYYY년 MM월 DD일(요일), HH시` — 미배정 `null` */
  interviewAtLabel?: string | null
  /** 항상 존재(신규). `program.interviewEnabled === true` 또는 배정 슬롯 있음 */
  hasInterview?: boolean | null
  /** 없으면 BE `[]` — answers에 일정 키 없을 때 fallback */
  preferredScheduleBlocks?: PortalPreferredScheduleBlock[] | null
  program?: {
    programId?: number
    title?: string
    programType?: string
    programGroup?: string
    educationFormLabel?: string | null
    educationJournalEnabled?: boolean | null
    surveyConfigured?: boolean | null
    satisfactionConfigured?: boolean | null
    thumbnailFileObjectId?: number | null
    recruitmentStartAt?: string | null
    recruitmentEndAt?: string | null
    educationStartAt?: string | null
    educationEndAt?: string | null
    /** 모집 미설정 `null` */
    interviewEnabled?: boolean | null
  }
  participation?: {
    status?: string
    completionStatus?: string
  }
  summary?: unknown
  capabilities?: {
    canCancelApplication?: boolean
  }
}
