/**
 * CMS 프로그램 시드/등록 스냅샷에서 Platform으로 매핑할 때 쓰는 최소 계약.
 * `apps/cms` 를 import 하지 않고 동일 shape 의 fixture 로 연결한다.
 */

export type CmsParticipantType =
  | 'individual'
  | 'school_institution'
  | 'teacher_instructor'
  | 'volunteer'

export type CmsProgramAudience = 'organization' | 'individual'

export type CmsEducationStructure = 'curriculum' | 'schedule'

export type CmsSessionRound = 'single' | 'multi'

export type CmsProgramDeliveryType = 'online' | 'offline' | 'hybrid'

/** CMS `ProgramLifecycleStatus` 중 홈 목록 모집 상태 매핑에 쓰는 값 */
export type CmsLifecycleStatus =
  | 'planned'
  | 'instructor_recruitment_planned'
  | 'volunteer_recruitment_planned'
  | 'participant_instructor_recruitment_planned'
  | 'recruiting_students'
  | 'recruiting_instructors'
  | 'recruiting_volunteers'
  | 'participant_instructor_recruiting'
  | 'education_in_progress'
  | 'matching_completed'
  | 'education_before_textbook'
  | 'education_after_textbook'
  | 'education_completed'
  | 'document_processing_completed'
  | 'participant_instructor_recruitment_completed'

export type CmsTargetLevel = 'elementary' | 'middle' | 'high' | 'university' | 'adult'

export type CmsCurriculumSession = {
  sessionLabel?: string
  title?: string
  description?: string
  /** 복수 회차 과제 기간 등 (예: 26년 4월 20일(월) ~ 26년 4월 27일(월)) */
  assignmentPeriod?: string
}

/** 일정형 세부·행사 일정 행 (CMS `scheduleDetails`) */
export type CmsScheduleDetail = {
  scheduleLabel?: string
  name?: string
  progressTimeSummary?: string
  scheduleDateLabel?: string
}

export type CmsProgramCommonInfo = {
  announcementTitle?: string
  educationFormLabel?: string
  sponsorDisplayName?: string
  curriculumSessions?: CmsCurriculumSession[]
  /** 일정형 — 세부 일정 NN / 행사 일정 NN */
  scheduleDetails?: CmsScheduleDetail[]
  educationScheduleLines?: string[]
  notes?: string
  /** 강사·UJAT 등 모집 소속/지부 표기 */
  recruitmentAffiliationLabel?: string
  /** 교육 대상 상세 오버라이드 (특성화고 3학년 등) */
  educationTargetDetailLabel?: string
  /** Gemini 등 기수·회차 요약 */
  sessionCountLabel?: string
}

/** UJAT 목록 `ujatProgressStatus` 중 홈 상세 매핑에 쓰는 값 */
export type CmsUjatProgressStatus =
  | 'EDUCATION_SCHEDULED'
  | 'PARTICIPANT_RECRUITING'
  | 'VOLUNTEER_RECRUITING'
  | 'EDUCATION_IN_PROGRESS'
  | 'PROGRAM_ENDED'

export type CmsProgramRound = {
  id?: string
  roundNumber?: number
  startDate?: string
  endDate?: string
  curriculum?: string
  deliveryType?: CmsProgramDeliveryType
}

/**
 * CMS `Program` 목록/등록 스냅샷 필드 중 Platform 목록·상세에 필요한 부분집합.
 * Gemini·교육받은 교사도 `registrationKind` 로 표현 (전용 스키마 축소 매핑).
 */
export type CmsProgramLike = {
  id: string
  title: string
  mainTitle?: string
  description?: string
  type?: CmsProgramDeliveryType
  /** CMS category: individual | school | instructor | volunteer */
  category?: string
  startDate?: string
  endDate?: string
  applicationStartDate?: string
  applicationEndDate?: string
  lifecycleStatus?: CmsLifecycleStatus
  businessArea?: string
  targetLevel?: CmsTargetLevel
  district?: string
  generalParticipantTypes?: CmsParticipantType[]
  generalProgramAudience?: CmsProgramAudience
  generalProgramEducationStructure?: CmsEducationStructure
  generalProgramSessionRound?: CmsSessionRound
  generalCommonInfo?: CmsProgramCommonInfo
  attachmentFileNames?: string[]
  applicationMethod?: string
  recruitmentGuide?: string
  otherNotes?: string
  rounds?: CmsProgramRound[]
  /** 프로그램 출처 유형 (Platform 탭 매핑용) */
  registrationKind?: 'general' | 'economy' | 'trainedTeachers' | 'gemini' | 'ujat'
  /** UJAT 진행 현황 (registrationKind=ujat) */
  ujatProgressStatus?: CmsUjatProgressStatus
  /** 봉사 모집 기간 (일반 봉사·UJAT 봉사) */
  volunteerApplicationStartDate?: string
  volunteerApplicationEndDate?: string
  volunteerTarget?: string
  volunteerTargetDetail?: string
  documentPassAnnouncementDate?: string
  interviewStartDate?: string
  interviewEndDate?: string
  finalPassAnnouncementDate?: string
  resultAnnouncementDate?: string
}

export type CmsRegistrationCaseKind =
  | 'general-org-curriculum-single'
  | 'general-org-curriculum-multi'
  | 'general-ind-curriculum-single'
  | 'general-ind-curriculum-multi'
  | 'general-org-schedule-single'
  | 'general-org-schedule-multi'
  | 'general-ind-schedule-single'
  | 'general-ind-schedule-multi'
  | 'economy-company-school'
  | 'trained-teachers-program'
  | 'gemini-recruitment'
  | 'case-instructor-recruitment'
  | 'case-volunteer-recruitment'
  | 'ujat-volunteer-recruitment'
  | 'ujat-participant-recruitment'
