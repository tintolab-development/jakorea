import type { EducationTarget } from '@jakorea/domain/recruitment/education-target'
import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'

export type ProgramCategory = 'all' | 'youth' | 'institution' | 'instructor'

export type ProgramSort = 'latest' | 'name' | 'closing-soon'

export type EducationForm = 'online' | 'offline' | 'hybrid' | 'participant_choice'

export type EducationTargetKey = EducationTarget

export type ProgramListItem = {
  id: string
  category: Exclude<ProgramCategory, 'all'>
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
  /** 도메인 education-target value — 모집대상·교육대상 필터 */
  educationTargetKey: EducationTargetKey | null
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  /** 목록 썸네일 이미지 URL(저해상) — 없으면 썸네일 영역 배경색만 표시 */
  thumbnailUrl?: string
}

export type ProgramSession = {
  sessionLabel: string
  title: string
  description: string
  /** 복수 회차 과제기간 등 — 없으면 비노출 */
  dateLabel?: string
}

/** 일정형 기본정보 — 세부 일정 / 행사 일정 */
export type ProgramEventSchedule = {
  scheduleLabel: string
  name: string
  /** 일시·그룹 시간 요약 */
  dateLabel: string
}

export type ProgramLabeledValue = {
  label: string
  value: string
}

/** 교육 진행 구조 (커리큘럼형 | 일정형). 없거나 비일반 시 커리큘럼 폴백 매핑. */
export type ProgramEducationStructure = 'curriculum' | 'schedule'

export type ProgramExtraSection = {
  title: string
  body: string
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
  isRecruiting: boolean
  businessFieldLabel: string
  educationTargetGroupLabel: string
  educationTargetDetailLabel: string
  educationVenueLabel: string
  /** 상세 케이스 (강사·봉사·UJAT·Gemini 등) */
  detailCase: ProgramDetailCase
  /**
   * CMS 참여 방식. 개인 프로그램에서 `team`이면 신청 폼 teamInfo 노출.
   * 미설정·기관 등은 `individual`로 정규화.
   */
  participationMethod: ProgramParticipationMethod
  /** 배지·요약용 모집 역할 (강사·봉사자·기관·교육생 등) */
  recruitmentRoleLabel: string
  /**
   * 기본정보 그리드 — 케이스별 라벨/값 세트.
   * 비어 있으면 레거시 5칸(사업 분야~교육 장소) 폴백 렌더.
   */
  basicInfoFields: ProgramBasicInfoField[]
  /** curriculum | schedule — 기본정보 블록 분기 */
  educationStructure: ProgramEducationStructure
  /** 커리큘럼형 차시/회차 (일정형이면 빈 배열) */
  sessions: ProgramSession[]
  /** 일정형 세부·행사 일정 (커리큘럼형이면 빈 배열) */
  eventSchedules: ProgramEventSchedule[]
  recruitmentPhaseGroupLabel: string
  recruitmentPhases: ProgramLabeledValue[]
  /** 세부내용 「교육 일정 N」 카드 — 보통 educationScheduleLines */
  educationSchedules: ProgramLabeledValue[]
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
}

export type ProgramsListParams = {
  /** 상단 탭 — 프로그램 유형 (청소년·기관·강사) */
  category: ProgramCategory
  q: string
  /** 모집대상 필터 — 초등~성인 (탭과 분리) */
  recruitmentTarget: string
  recruitmentStatus: string
  /** 운영 기간 (`all` | `YYYY-MM-DD~YYYY-MM-DD`, 단일·레거시 `YYYY` 허용) */
  operatingPeriod: string
  educationTarget: string
  educationForm: string
  sort: ProgramSort
  page: number
}
