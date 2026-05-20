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
  maxClassesPerDay: string
  expectedVolunteerCount: string
}

export type UjatScheduleAssignRegionState = {
  days: Record<string, UjatScheduleAssignDayState>
  estimation: Record<UjatInstitutionEducationSemesterKey, UjatScheduleAssignEstimationSemester>
}
