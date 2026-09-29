/**
 * CMS Portal 공개 프로그램 상세 계약
 * GET /api/portal/programs/{programId}
 *
 * CMS 모집 미리보기도 같은 형태로 조립해 Platform 미리보기 번들에 전달한다.
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
  interviewEnabled?: boolean | null
  documentPassAnnouncementAt?: string | null
  interviewStartAt?: string | null
  interviewEndAt?: string | null
  finalPassAnnouncementAt?: string | null
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
  term?: string | null
  scheduleKind?: string | null
  publiclyVisible?: boolean | null
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
  /** CMS 공통정보 참여 방식. `team`이면 개인 신청 팀 정보 노출 */
  participationMethod?: string
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
  applicationMethod?: string | null
  educationTarget?: string
  /** 복수 교육 대상 (BE 확장 시). 없으면 `educationTarget` 단수·콤마 구분 fallback */
  educationTargets?: string[]
  educationTargetDetail?: string
  recruitmentTargetDetail?: string
  thumbnailFileObjectId?: number
  sponsorNames?: string[]
  recruitments?: PortalRecruitment[]
  schedules?: PortalSchedule[]
  curricula?: PortalCurriculum[]
  attachments?: PortalAttachment[]
}

export const PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE = 'jakorea:program-preview' as const
export const PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE = 'jakorea:program-preview-ready' as const

/** CMS 번들 내 Platform 미리보기 진입 경로 */
export const PLATFORM_PROGRAM_PREVIEW_PATH = '/platform-preview/preview.html'

/**
 * 저장 전 포스터·첨부 등 portal 공개 파일 URL로 접근할 수 없는 자원.
 * 값이 있으면 Platform 매핑 결과를 덮어쓴다.
 */
export type PlatformProgramPreviewAssets = {
  thumbnailUrl?: string
  attachments?: { name: string; url?: string }[]
}

/** CMS → Platform 미리보기 iframe */
export type PlatformProgramPreviewMessage = {
  type: typeof PLATFORM_PROGRAM_PREVIEW_MESSAGE_TYPE
  version: 1
  detail: PortalProgramDetail
  assets?: PlatformProgramPreviewAssets
}

/** Platform 미리보기 iframe → CMS */
export type PlatformProgramPreviewReadyMessage = {
  type: typeof PLATFORM_PROGRAM_PREVIEW_READY_MESSAGE_TYPE
}
