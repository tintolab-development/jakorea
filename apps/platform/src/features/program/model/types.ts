import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'

export type ProgramCategory = 'all' | 'youth' | 'institution' | 'instructor'

export type ProgramSort = 'latest' | 'name' | 'closing-soon'

export type EducationForm = 'online' | 'offline' | 'hybrid'

export type ProgramListItem = {
  id: string
  category: Exclude<ProgramCategory, 'all'>
  categoryLabel: string
  title: string
  operatingPeriodLabel: string
  recruitmentPeriodLabel: string
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  thumbnailUrl: string
}

export type ProgramDetail = ProgramListItem & {
  sponsor: string
  summary: string
  applicationPeriodLabel: string
  isRecruiting: boolean
}

export type ProgramsListParams = {
  category: ProgramCategory
  q: string
  recruitmentTarget: string
  recruitmentStatus: string
  educationTarget: string
  educationForm: string
  sort: ProgramSort
  page: number
}
