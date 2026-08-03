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
}

export type ProgramLabeledValue = {
  label: string
  value: string
}

export type ProgramExtraSection = {
  title: string
  body: string
}

export type ProgramAttachment = {
  name: string
  url: string
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
  sessions: ProgramSession[]
  recruitmentPhaseGroupLabel: string
  recruitmentPhases: ProgramLabeledValue[]
  educationSchedules: ProgramLabeledValue[]
  extraSections: ProgramExtraSection[]
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
  /** 운영 연도 (`all` | `YYYY`) */
  operatingPeriod: string
  educationTarget: string
  educationForm: string
  sort: ProgramSort
  page: number
}
