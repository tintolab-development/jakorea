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
  /** 모집 행 운영 기간. 없으면 상세는 사업 기간으로 떨어진다. */
  operationStartDate?: string | null
  operationEndDate?: string | null
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

/** 공개 상세 교육 진행 — 커리큘럼 차시. 운영 `curricula[]`와 별개 */
export type PortalEducationCurriculumSession = {
  sessionLabel?: string
  title?: string
  description?: string
  assignmentEnabled?: boolean
  assignmentPeriod?: string
  educationFormLabel?: string
  participationMethodLabel?: string
  ipsTypeSummary?: string
  scheduleDateLabel?: string
}

/** 공개 상세 교육 진행 — 일정형 블록. 운영 `schedules[]`와 별개 */
export type PortalEducationScheduleDetail = {
  scheduleLabel?: string
  blockKind?: 'preEducation' | 'sub' | 'event'
  name?: string
  scheduleDateLabel?: string
  progressTimeSummary?: string
  groupTimes?: Array<{ startTime?: string; endTime?: string }>
  assignmentEnabled?: boolean
  assignmentPeriod?: string
  educationFormLabel?: string
  participationMethodLabel?: string
  ipsTypeSummary?: string
}

export type PortalEducationScheduleRange = {
  start?: string | null
  end?: string | null
}

export type PortalAttachment = {
  attachmentId?: number
  fileObjectId?: number
  attachmentType?: string
  originalFileName?: string
  contentType?: string
  fileSize?: number
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
  /** 교육 장소 상세 문장 */
  venue?: string
  /** inside=기관 안, outside=기관 밖, other=기타. 없으면 상세만 표시 */
  venueKind?: 'inside' | 'outside' | 'other' | null
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  additionalContentHtml?: string
  recruitmentGuide?: string
  learningSupportContent?: string | null
  otherMatters?: string | null
  remarks?: string
  /**
   * 교육 진행 정보. 모든 유형에 키가 온다.
   * 일반 개인/기관이 아니면 스칼라는 null, 배열은 [].
   * `curricula[]`·`schedules[]`와 섞지 않는다.
   */
  educationStructure?: 'curriculum' | 'schedule' | null
  sessionRound?: 'single' | 'multi' | null
  scheduleCurriculumPreEducation?: boolean | null
  educationFormScheduleDetail?: 'common' | 'perSchedule' | null
  participationScheduleDetail?: 'common' | 'perSchedule' | null
  ipsScheduleDetail?: 'common' | 'perSchedule' | null
  /**
   * 공통정보 교육 형태 코드. 없으면 `operationMethod`로 보정한다.
   * perSchedule이면 루트 라벨은 null이고 행 `educationFormLabel`을 쓴다.
   */
  educationForm?: 'online' | 'offline' | 'hybrid' | 'participant_choice' | null
  /** perSchedule이면 null */
  educationFormLabel?: string | null
  /** CMS 공통정보 참여 방식. `team`이면 개인 신청 팀 정보 노출. 미전달은 null */
  participationMethod?: 'individual' | 'team' | null
  ipsTypeSummary?: string | null
  curriculumSessions?: PortalEducationCurriculumSession[]
  scheduleDetails?: PortalEducationScheduleDetail[]
  educationScheduleMode?: 'date' | 'period' | null
  /** 공통정보 교육 일정 줄. 없으면 [] */
  educationScheduleLines?: string[]
  educationScheduleRange?: PortalEducationScheduleRange | null
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
