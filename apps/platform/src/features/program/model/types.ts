import type { EducationTarget } from '@jakorea/domain/recruitment/education-target'
import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { PortalApplicationType } from '../api/application-types'

export type ProgramCategory = 'all' | 'youth' | 'institution' | 'instructor'

/** 목록·상세에 그리는 탭. `all`은 필터 값이라 카드 배지에 쓰지 않는다. */
export type ProgramTab = Exclude<ProgramCategory, 'all'>

export type ProgramSort = 'latest' | 'name' | 'closing-soon'

export type EducationForm = 'online' | 'offline' | 'hybrid' | 'participant_choice'

export type EducationTargetKey = EducationTarget

export type ProgramListItem = {
  id: string
  /** 원장 프로그램 유형 — 목록 유형 필터용 */
  programType?: string
  /** 교육받은 교사 교육일지 탭 노출 정책. 서버가 명시한 true일 때만 노출한다. */
  educationJournalEnabled?: boolean | null
  /**
   * 신청 양식 등 단일 분기에 쓰는 대표 탭.
   * 배지는 `categories` 전체를 그린다.
   */
  category: ProgramTab
  /**
   * `portalCategories`에 해당하는 탭 전부.
   * 공개 모집이 없으면 빈 배열이다. 진행 중 행만 남기지 않는다.
   */
  categories: ProgramTab[]
  /** `categories` 라벨을 ` · `로 이은 문자열. 배지가 없으면 빈 문자열. */
  categoryLabel: string
  title: string
  /** 운영 기간 표시용 라벨 */
  operatingPeriodLabel: string
  /** YYYY-MM-DD — 운영기간 필터 매칭용 */
  operatingPeriodStart: string
  /** YYYY-MM-DD — 운영기간 필터 매칭용 */
  operatingPeriodEnd: string
  /** YYYY-MM-DD — 최신순 정렬 */
  applicationStartDate: string | null
  /** YYYY-MM-DD — 마감일 가까운순 정렬 */
  applicationEndDate: string | null
  recruitmentPeriodLabel: string
  recruitmentStatus: RecruitmentStatus
  /** 도메인 education-target value — 표시·단일 fallback (복수일 때 첫 코드) */
  educationTargetKey: EducationTargetKey | null
  /** `educationTargets` 전체 — 목록 모집대상·교육대상 필터(OR 포함) */
  educationTargetKeys: EducationTargetKey[]
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  /**
   * 목록 행의 `availableApplicationTypes`.
   * 탭 호출이면 그 탭 모집의 신청 유형만 온다.
   */
  applicationTypes?: string[]
  /**
   * 모집 공고 행 identity. API가 줄 때만 채운다.
   * 같은 `id`(programId)가 여러 행이어도 `recruitmentId`로 구분한다.
   */
  recruitmentId?: number
  recruitmentType?: string
  targetType?: string
  /** 행 단위 단일 신청 유형. 있으면 상세·신청 focus의 기준. */
  applicationType?: string
  /** 목록 썸네일 이미지 URL(저해상) — 없으면 썸네일 영역 배경색만 표시 */
  thumbnailUrl?: string
}

export type ProgramSession = {
  sessionLabel: string
  title: string
  description: string
  /** 복수 회차 과제기간 등 — 없으면 비노출 */
  dateLabel?: string
  /** 공통 교육 형태가 없을 때 차시 행 값 */
  educationFormLabel?: string
  /** 공통 참여 방식이 없을 때 차시 행 값 */
  participationMethodLabel?: string
  /** 차시별 과제 설정 여부 */
  assignmentEnabled?: boolean
  /** 차시별 과제 기간 */
  assignmentPeriod?: string
}

/** 일정형 기본정보 — 사전교육 / 세부 일정 / 행사 일정 */
export type ProgramScheduleBlockKind = 'preEducation' | 'sub' | 'event'

export type ProgramEventSchedule = {
  scheduleLabel: string
  name: string
  /** 일시·그룹 시간 요약 */
  dateLabel: string
  /** Portal `schedules[].scheduleId` — 신청 내용 `schedule:{id}` 해석용 */
  scheduleId?: number
  /** Portal 원본 시각 — 신청 내용 표시 포맷용 */
  startAt?: string
  endAt?: string
  blockKind?: ProgramScheduleBlockKind
  educationFormLabel?: string
  participationMethodLabel?: string
  /** 일정별 과제 설정 여부 */
  assignmentEnabled?: boolean
  /** 일정별 과제 기간 */
  assignmentPeriod?: string
}

export type ProgramLabeledValue = {
  label: string
  value: string
}

/** Portal `volunteerInterviewSchedule` (신청 폼 등 — 프로그램 상세 세부내용에는 비노출) */
export type ProgramVolunteerInterviewScheduleOption = {
  id: string
  label: string
}

export type ProgramVolunteerInterviewSchedule = {
  periodLabel?: string
  availableTimeSlots?: string
  recurringUnavailable?: string
  options: ProgramVolunteerInterviewScheduleOption[]
}

/** 교육 진행 구조 (커리큘럼형 | 일정형). 없거나 비일반 시 커리큘럼 폴백 매핑. */
export type ProgramEducationStructure = 'curriculum' | 'schedule'

/** 수업 회차 유형 */
export type ProgramSessionRound = 'single' | 'multi'

/** 교육 진행 일정 유형 — 날짜 지정(개별일자) / 기간 지정 */
export type ProgramEducationScheduleMode = 'date' | 'period'

export type ProgramExtraSection = {
  title: string
  body: string
  bodyFormat?: 'text' | 'html'
}

export type ProgramAttachment = {
  name: string
  url: string
}

/** 공개 상세 케이스 — 기본정보 필드 세트·모집 phase 라벨 분기 */
export type ProgramDetailCase =
  | 'instructor'
  | 'volunteer'
  | 'ujat-volunteer'
  | 'ujat-participant'
  | 'gemini'
  | 'general'

/** CMS 참여 방식 — 개인 신청 폼 teamInfo 노출 여부 */
export type ProgramParticipationMethod = 'individual' | 'team'

export type ProgramBasicInfoField = {
  label: string
  value: string
}

export type ProgramDetail = ProgramListItem & {
  /**
   * 상세 배너 이미지 URL(고해상).
   * 없으면 `thumbnailUrl` 폴백.
   */
  detailImageUrl?: string
  sponsor: string
  /** 빈 문자열이면 상세에서 비노출 */
  summary: string
  applicationPeriodLabel: string
  /** Gemini 전용 연수 요청 가능 기간. 기관 모집 기간과 별도이며 미설정이면 비어 있다. */
  geminiTrainingRequestPeriodLabel?: string
  /** Gemini 연수 요청 가능기간 시작 `YYYY-MM-DD`. 미설정이면 없음. */
  geminiTrainingRequestStartDate?: string
  /** Gemini 연수 요청 가능기간 종료 `YYYY-MM-DD`. 미설정이면 없음. */
  geminiTrainingRequestEndDate?: string
  /** Gemini 전용 최소 수강 인원 표시. 미설정이면 비어 있다. */
  geminiMinStudentCountLabel?: string
  isRecruiting: boolean
  businessFieldLabel: string
  educationTargetGroupLabel: string
  educationTargetDetailLabel: string
  educationVenueLabel: string
  /** 상세 케이스 (강사·봉사·UJAT·Gemini 등) */
  detailCase: ProgramDetailCase
  /**
   * Portal/CMS programType (예: TRAINED_TEACHER).
   * 신청 양식 케이스 분기용. 시드·구 맵핑에서는 없을 수 있다.
   */
  programType?: string
  /**
   * CMS registrationKind. mock/CMS 스냅샷 연동 시 신청 양식 케이스에 사용.
   */
  registrationKind?: 'general' | 'economy' | 'trainedTeachers' | 'gemini' | 'ujat'
  /** CMS 일반 프로그램 대상 — 기관 / 개인. 봉사 배정 테이블 분기 */
  programAudience: 'organization' | 'individual'
  /**
   * CMS 참여 방식. 개인 프로그램에서 `team`이면 신청 폼 teamInfo 노출.
   * 미설정·기관 등은 `individual`로 정규화.
   */
  participationMethod: ProgramParticipationMethod
  /** 기관 모집 「사전 안내 사항 작성 여부」. false면 신청 양식 안내사항 단락 비노출. */
  preEducationNoticeRequired?: boolean | null
  /** `preEducationNoticeRequired` 구필드 호환값. 두 값은 동일 boolean이다. */
  advanceGuidanceRequired?: boolean | null
  /** 배지·요약용 모집 역할 (강사·봉사자·기관·교육생 등) */
  recruitmentRoleLabel: string
  /**
   * 목록에서 고른 모집. exact match로 1건만 확정됐을 때 채운다.
   * 후보가 여러 건이면 비우고 `recruitmentSelectionAmbiguous`를 켠다.
   */
  focusedRecruitmentIds?: number[]
  focusedApplicationTypes?: string[]
  /**
   * focus로 모집을 좁혔지만 후보가 2건 이상.
   * 대표 상태·기간·신청 option을 임의로 고르지 않는다.
   */
  recruitmentSelectionAmbiguous?: boolean
  /** 확정된 모집의 신청 유형. 신청 양식 케이스의 기준. */
  applicationType?: string
  /**
   * 기본정보 그리드 — 케이스별 라벨/값 세트.
   * 비어 있으면 레거시 5칸(사업 분야~교육 장소) 폴백 렌더.
   */
  basicInfoFields: ProgramBasicInfoField[]
  /** curriculum | schedule — 기본정보 블록 분기 */
  educationStructure: ProgramEducationStructure
  /** 수업 회차 — 일정형 복수 회차이면 신청 폼 교육 일정 단락 숨김 */
  sessionRound: ProgramSessionRound
  /** 날짜 지정 / 기간 지정 — 신청 폼 진행 희망 교육 일정 UI */
  educationScheduleMode: ProgramEducationScheduleMode
  /** 기간 지정 — 서버가 계산한 교육 운영 기간. 없으면 기간형 일정을 임의로 만들지 않는다. */
  educationScheduleRange?: { start: string | null; end: string | null } | null
  /** 등록된 교육 진행 예정일 (신청 폼 체크박스 선택지) */
  educationScheduleLines: string[]
  /** 기간 지정 지망 상한. 없으면 1 */
  maxPreferredScheduleCount: number
  /** 기간 지정 — 희망 차시 셀렉 상한 (모집 1일 최대 차시). */
  maxSessionsPerDay?: number
  /** 커리큘럼형 차시/회차 (일정형이면 빈 배열) */
  sessions: ProgramSession[]
  /** 일정형 세부·행사 일정 (커리큘럼형이면 빈 배열) */
  eventSchedules: ProgramEventSchedule[]
  recruitmentPhaseGroupLabel: string
  recruitmentPhases: ProgramLabeledValue[]
  /** 세부내용 「교육 일정 N」 카드 — 보통 educationScheduleLines */
  educationSchedules: ProgramLabeledValue[]
  /**
   * VOLUNTEER 면접 운영 행의 `volunteerInterviewSchedule`이 있을 때만.
   * 프로그램 상세 UI에는 노출하지 않음(신청서 면접 일정 단락과 분리).
   * `schedules[]`·`educationScheduleLines`·면접 기간만으로 만들지 않는다.
   */
  volunteerInterviewSchedule?: ProgramVolunteerInterviewSchedule
  extraSections: ProgramExtraSection[]
  /**
   * 문의처 표시 줄. 비어 있으면 상세에서 비노출.
   * 예: 「02-6085-6028 · cc@jakorea.org」
   */
  contactValue: string
  applicationMethodLabel: string
  /** 빈 문자열이면 상세에서 비노출 */
  applicationMethodValue: string
  attachments: ProgramAttachment[]
  /**
   * 교육현황 상세 — 설문조사 탭 노출.
   * `false`면 프로그램에 설문 항목 미설정 → 탭 비노출.
   * 미지정·`true`면 진행 중 내용이 없어도 탭 유지.
   */
  surveyConfigured?: boolean
  /**
   * 교육현황 상세 — 만족도조사 탭 노출.
   * `false`면 프로그램에 만족도 항목 미설정 → 탭 비노출.
   * 미지정·`true`면 진행 중 내용이 없어도 탭 유지.
   */
  satisfactionConfigured?: boolean
}

export type ProgramsListParams = {
  /** 상단 탭 — 프로그램 유형 (청소년·기관·강사) */
  category: ProgramCategory
  q: string
  /** 모집 유형 직접 조회용 URL 상태. 기본 목록에서는 생략한다. */
  applicationType?: PortalApplicationType
  /** 원장 프로그램 유형 필터 (예: UJAT) */
  programType: string
  /** URL/API에 반복값으로 복원된 프로그램 유형 필터. 기존 단일 선택 UI는 programType을 사용한다. */
  programTypeValues?: string[]
  /** 모집대상 필터 — 초등~성인 (탭과 분리) */
  recruitmentTarget: string
  recruitmentTargetValues?: string[]
  recruitmentStatus: string
  recruitmentStatusValues?: string[]
  /** 운영 기간 (`all` | `YYYY-MM-DD~YYYY-MM-DD`, 단일·레거시 `YYYY` 허용) */
  operatingPeriod: string
  educationTarget: string
  educationTargetValues?: string[]
  educationForm: string
  educationFormValues?: string[]
  sort: ProgramSort
  page: number
}
