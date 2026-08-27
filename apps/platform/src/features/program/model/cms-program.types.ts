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

/** CMS 일반 프로그램 공통정보 — 참여 방식 (신청 폼 teamInfo 분기) */
export type CmsParticipationMethod = 'individual' | 'team'

export type CmsProgramCommonInfo = {
  announcementTitle?: string
  educationFormLabel?: string
  sponsorDisplayName?: string
  curriculumSessions?: CmsCurriculumSession[]
  /** 일정형 — 세부 일정 NN / 행사 일정 NN */
  scheduleDetails?: CmsScheduleDetail[]
  educationScheduleLines?: string[]
  notes?: string
  /** 공통 정보 > 교육 장소 표시 라벨 (venueKind + venueDetail) */
  educationVenueLabel?: string
  /** 강사·UJAT 등 모집 소속/지부 표기 */
  recruitmentAffiliationLabel?: string
  /** 교육 대상 상세 오버라이드 (특성화고 3학년 등) */
  educationTargetDetailLabel?: string
  /** Gemini 등 기수·회차 요약 */
  sessionCountLabel?: string
  /**
   * 참여 방식 — CMS `generalCommonInfo.participationMethod`.
   * `team`이면 개인 신청 폼에 teamInfo 단락 노출 (CMS 미리보기와 동일).
   */
  participationMethod?: CmsParticipationMethod
}

/** UJAT 공개 상세 교육 일정 행 (불가일 제외·사전교육/진행/해단식) */
export type CmsUjatEducationScheduleLine = {
  label: string
  value: string
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
  /** 모집 유형별 비고 (CMS oneLineIntroduction 등) */
  notes?: string
  /** 상세 정보 > 추가 내용 (HTML/plain) */
  additionalContent?: string
  /** 참여자 모집 > 학습 지원 내용 */
  learningSupportContent?: string
  contactPhone?: string
  contactEmail?: string
  rounds?: CmsProgramRound[]
  /** 프로그램 출처 유형 (Platform 탭 매핑용) */
  registrationKind?: 'general' | 'economy' | 'trainedTeachers' | 'gemini' | 'ujat'
  /** UJAT 진행 현황 (registrationKind=ujat) */
  ujatProgressStatus?: CmsUjatProgressStatus
  /** 봉사 모집 기간 (일반 봉사·UJAT 봉사) */
  volunteerApplicationStartDate?: string
  volunteerApplicationEndDate?: string
  /** 강사 모집 기간 */
  instructorApplicationStartDate?: string
  instructorApplicationEndDate?: string
  volunteerTarget?: string
  volunteerTargetDetail?: string
  /**
   * 면접 유무. false/'no'면 서류·면접 phase 숨김.
   * 미설정 시 관련 날짜 존재 여부로 추론.
   */
  interviewEnabled?: boolean | 'yes' | 'no'
  documentPassAnnouncementDate?: string
  interviewStartDate?: string
  interviewEndDate?: string
  finalPassAnnouncementDate?: string
  resultAnnouncementDate?: string
  /**
   * UJAT 공개 상세 교육 일정 (기관: 상·하반기 / 봉사: 사전교육·교육 진행·해단식).
   * 있으면 educationScheduleLines 보다 우선. 불가일 행은 넣지 않는다.
   */
  ujatPublicEducationSchedules?: CmsUjatEducationScheduleLine[]
}

export type CmsRegistrationCaseKind =
  | 'general-org-curriculum-single'
  | 'general-org-curriculum-single-participant-choice'
  | 'general-org-curriculum-multi'
  | 'general-org-curriculum-multi-participant-choice'
  | 'general-org-schedule-single'
  | 'general-org-schedule-single-participant-choice'
  | 'general-org-schedule-multi'
  | 'general-org-schedule-multi-participant-choice'
  | 'general-ind-curriculum-single'
  | 'general-ind-curriculum-single-team'
  | 'general-ind-curriculum-multi-individual'
  | 'general-ind-curriculum-multi'
  | 'general-ind-schedule-single'
  | 'general-ind-schedule-single-team'
  | 'general-ind-schedule-multi'
  | 'general-ind-schedule-multi-team'
  | 'economy-company-school'
  | 'economy-participant-choice'
  | 'trained-teachers-program'
  | 'gemini-recruitment'
  | 'gemini-instructor'
  | 'ujat-volunteer-recruitment'
  | 'ujat-participant-recruitment'
