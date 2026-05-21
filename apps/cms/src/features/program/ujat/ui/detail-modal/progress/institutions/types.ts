import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../ujat-education-progress-tabs'

export const UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '5학년',
  '6학년',
] as const

export type UjatEducationProgressInstitutionRow = {
  id: string
  sourceInstitutionId: string
  regionKey: UjatInstitutionApplicationRegionKey
  no: number
  institutionName: string
  educationRegion: string
  educationScheduleDisplay: string
  educationScheduleIsoDates: string[]
  gradeClassCounts: Record<(typeof UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS)[number], number>
  totalEducationClassCount: number
  teacherName: string
  half: EducationProgressHalfKey
}

export type UjatEducationProgressInstitutionFilters = {
  institutionName: string
  educationRegion: string
  educationScheduleIso: string
  teacherName: string
}

export const EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS: UjatEducationProgressInstitutionFilters = {
  institutionName: '',
  educationRegion: '',
  educationScheduleIso: '',
  teacherName: '',
}
