import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'

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
  /** 교육 진행 일정 — 다중 선택 ISO. 빈 배열은 전체 */
  educationScheduleIsoDates: string[]
  teacherName: string
}

export const EMPTY_UJAT_EDU_PROGRESS_INSTITUTION_FILTERS: UjatEducationProgressInstitutionFilters = {
  institutionName: '',
  educationRegion: '',
  educationScheduleIsoDates: [],
  teacherName: '',
}
