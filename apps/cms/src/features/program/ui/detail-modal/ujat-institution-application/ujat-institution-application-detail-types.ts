import type { UjatInstitutionTempAssignmentStatus } from './ujat-institution-application-types'

export type UjatInstitutionApplicationGradeClassDetail = {
  classNo: number
  studentCount: number
}

export type UjatInstitutionApplicationGradeBlockDetail = {
  gradeLabel: string
  classCount: number
  classes: UjatInstitutionApplicationGradeClassDetail[]
}

export type UjatInstitutionApplicationClassTimeRowDetail = {
  gradeRangeLabel: string
  periods: readonly [string, string, string, string]
}

export type UjatInstitutionApplicationDetail = {
  institutionName: string
  regionLabel: string
  tempAssignmentStatus: UjatInstitutionTempAssignmentStatus
  address: string
  addressDetail: string
  teacherInfoMasked: string
  teacherInfoRevealed: string
  otherRequests: string
  gradeBlocks: UjatInstitutionApplicationGradeBlockDetail[]
  classTimeRows: UjatInstitutionApplicationClassTimeRowDetail[]
  preferredEducationDates: string[]
}
