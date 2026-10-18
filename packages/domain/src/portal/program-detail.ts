/**
 * CMS Portal 공개 프로그램 상세 계약
 * GET /api/portal/programs/{programId}
 *
 * CMS 모집 미리보기도 같은 형태로 조립해 Platform 미리보기 번들에 전달한다.
 */

/** 봉사자 면접 진행 가능 일정 한 칸. 신청폼 items[]와 id/label 규칙이 같다. */
export type PortalVolunteerInterviewScheduleOption = {
  id?: string
  label?: string
  source?: 'SLOT' | 'SCHEDULE_INFO' | string
  slotDate?: string | null
  startAt?: string | null
  endAt?: string | null
}

/**
 * 봉사자 모집 행의 「면접 진행 가능 일정」.
 * 신청폼 면접 선택지와 같은 출처(슬롯 우선, 없으면 CMS volunteerInterviewScheduleInfo).
 * VOLUNTEER이 아니거나 면접 미운영이면 상위 필드가 null/생략.
 */
export type PortalVolunteerInterviewSchedule = {
  source?: 'SLOT' | 'SCHEDULE_INFO' | 'EMPTY' | string
  /** YYYY-MM-DD(KST). 슬롯만 있거나 기간을 못 정하면 null. */
  periodStartDate?: string | null
  periodEndDate?: string | null
  /** CMS availableTimeSlots 원문. 예: 10:00 ~ 10:30. 슬롯만 있으면 null. */
  availableTimeSlots?: string | null
  /** CMS recurringUnavailable 원문. 예: 공휴일. */
  recurringUnavailable?: string | null
  /** 오늘 이후 선택 가능 일정. 없으면 []. null 금지. */
  options?: PortalVolunteerInterviewScheduleOption[]
}

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
  /**
   * VOLUNTEER 면접 운영 행만. 그 외 null/생략.
   * 상세 「면접 진행 가능 일정」 표시용(표시 전용, 선택은 신청폼).
   */
  volunteerInterviewSchedule?: PortalVolunteerInterviewSchedule | null
  /** GENERAL_*·UJAT 모집 행 값. 비어 있으면 null이며 프로그램 값으로 채우지 않는다. */
  applicationType?: string | null
  /** 기관 모집 「사전 안내 사항 작성 여부」. false면 신청 양식 안내사항 단락 비노출. */
  preEducationNoticeRequired?: boolean | null
  /** BE 구필드 호환: 기관 모집 「사전 안내 사항 작성 여부」. */
  advanceGuidanceRequired?: boolean | null
  announcementTitle?: string | null
  summary?: string | null
  programDescription?: string | null
  recruitmentGuide?: string | null
  applicationMethod?: string | null
  learningSupportContent?: string | null
  additionalContentHtml?: string | null
  remarks?: string | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  thumbnailFileObjectId?: number | null
  attachments?: PortalAttachment[] | null
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

export type PortalProgramDetail = {
  programId?: number
  programUuid?: string
  programCode?: string
  programType?: string
  /** 교육받은 교사 교육일지 탭 노출 정책. 계약 미전달 시 미설정으로 둔다. */
  educationJournalEnabled?: boolean | null
  portalCategories?: string[]
  title?: string
  titleEn?: string
  /** `recruitmentId` 상세(GENERAL_*·UJAT)는 행 값만. 없으면 null */
  summary?: string | null
  description?: string | null
  operationMethod?: string
  businessYear?: number
  businessStartDate?: string
  businessEndDate?: string
  /** 상세 운영 기간. 없으면 사업 기간 */
  operationStartDate?: string | null
  operationEndDate?: string | null
  periodStatus?: string
  recruitmentStatus?: string
  applicationTargetMode?: string
  businessField?: string
  /** 교육 장소 상세 문장 */
  venue?: string
  /** inside=기관 안, outside=기관 밖, other=기타. 없으면 상세만 표시 */
  venueKind?: 'inside' | 'outside' | 'other' | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  additionalContentHtml?: string | null
  recruitmentGuide?: string | null
  learningSupportContent?: string | null
  otherMatters?: string | null
  remarks?: string | null
  /** 기관 모집 「사전 안내 사항 작성 여부」. false면 신청 양식 안내사항 단락 비노출. */
  preEducationNoticeRequired?: boolean | null
  /** BE 구필드 호환: 기관 모집 「사전 안내 사항 작성 여부」. */
  advanceGuidanceRequired?: boolean | null
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
  /**
   * 강사·봉사자 모집 포커스 한글 요약. PARTICIPANT 포커스에서는 null/생략.
   */
  recruitmentTarget?: string
  /** 강사·봉사자 모집 대상 코드 (`high`, `university` …). PARTICIPANT 포커스에서는 생략. */
  recruitmentTargets?: string[]
  recruitmentTargetDetail?: string
  /** GENERAL_*·UJAT 행 대표 이미지. 없으면 null이며 프로그램 썸네일로 채우지 않는다. */
  thumbnailFileObjectId?: number | null
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
