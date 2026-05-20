import type { UjatInstitutionEducationSemesterKey } from '../education-schedule'

export type UjatScheduleAssignGradeOptionValue = string

export type UjatScheduleAssignRow = {
  id: string
  institutionRowId: string | null
  gradeValues: UjatScheduleAssignGradeOptionValue[]
}

export type UjatScheduleAssignDayState = {
  isoDate: string
  rows: UjatScheduleAssignRow[]
}

export type UjatScheduleAssignEstimationSemester = {
  expectedVolunteerCount: string
}

export type UjatScheduleAssignRegionState = {
  days: Record<string, UjatScheduleAssignDayState>
  /** 1일 최대 교육 학급 수 — 1·2학기 공통 */
  maxClassesPerDay: string
  estimation: Record<UjatInstitutionEducationSemesterKey, UjatScheduleAssignEstimationSemester>
}
