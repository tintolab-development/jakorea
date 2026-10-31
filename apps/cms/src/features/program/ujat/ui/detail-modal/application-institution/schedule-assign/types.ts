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
  /** 1일 최대 교육 학급 수 — 학기별 독립 (시안) */
  maxClassesPerDay: string
  expectedVolunteerCount: string
}

export type UjatScheduleAssignRegionState = {
  days: Record<string, UjatScheduleAssignDayState>
  estimation: Record<UjatInstitutionEducationSemesterKey, UjatScheduleAssignEstimationSemester>
}
