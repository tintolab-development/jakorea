import type { UjatInstitutionApplicationDetail } from '../../../application-institution/detail/detail-types'
import type { EducationProgressHalfKey } from '../../tabs'

export const UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TABS = [
  'application',
  'assignment',
  'posts',
] as const

export type UjatEducationProgressInstitutionDetailTab =
  (typeof UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TABS)[number]

export const UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS: Record<
  UjatEducationProgressInstitutionDetailTab,
  string
> = {
  application: '신청 정보',
  assignment: '교육 배정 및 진행 현황',
  posts: '게시글',
}

export type UjatEducationProgressInstitutionGuidance = {
  deviceAvailability: string
  waitingAreaGuide: string
  leftoverTextbookDisposal: string
  parkingAndNotes: string
  snackAvailability: string
  criminalRecordCheckRequest: string
}

export type UjatEducationProgressInstitutionConfirmedScheduleRow = {
  id: string
  dateDisplay: string
  classLabels: string[]
}

export type UjatEducationProgressInstitutionDetail = {
  institutionId: string
  half: EducationProgressHalfKey
  institutionName: string
  educationRegion: string
  adminComment: string
  applicationDetail: UjatInstitutionApplicationDetail
  confirmedScheduleRows: UjatEducationProgressInstitutionConfirmedScheduleRow[]
  guidance: UjatEducationProgressInstitutionGuidance
}
