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
  category: ProgramCategory
  q: string
  recruitmentTarget: string
  recruitmentStatus: string
  educationTarget: string
  educationForm: string
  sort: ProgramSort
  page: number
}
