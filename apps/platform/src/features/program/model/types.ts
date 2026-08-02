import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'

export type ProgramCategory = 'all' | 'youth' | 'institution' | 'instructor'

export type ProgramSort = 'latest' | 'name' | 'closing-soon'

export type EducationForm = 'online' | 'offline' | 'hybrid'

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
  recruitmentPeriodLabel: string
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  /** 목록 썸네일 이미지 URL — 없으면 썸네일 영역 배경색만 표시 */
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
  sponsor: string
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
  applicationMethodValue: string
  attachments: ProgramAttachment[]
}

export type ProgramsListParams = {
  /** 상단 탭 — 모집대상 필터와 동일 값·연동 */
  category: ProgramCategory
  q: string
  /** 모집대상 필터 — 상단 탭(category)과 동일 값·연동 */
  recruitmentTarget: ProgramCategory
  recruitmentStatus: string
  /** 운영 연도 (`all` | `YYYY`) */
  operatingPeriod: string
  educationTarget: string
  educationForm: string
  sort: ProgramSort
  page: number
}
