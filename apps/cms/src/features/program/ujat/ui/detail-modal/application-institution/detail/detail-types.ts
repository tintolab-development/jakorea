import type { UjatInstitutionTempAssignmentStatus } from '../list/types'

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

export type UjatInstitutionApplicationTeacherContact = {
  teacherName: string
  tel: string
  mobile: string
  email: string
}

export type UjatInstitutionApplicationDetail = {
  institutionName: string
  regionLabel: string
  tempAssignmentStatus: UjatInstitutionTempAssignmentStatus
  /** 기관 소재지 — 마스킹·블러 미적용 */
  address: string
  /** 기관 상세 주소 — 마스킹·블러 미적용 */
  addressDetail: string
  teacherContact: UjatInstitutionApplicationTeacherContact
  /** 사용자 자택 주소(있을 때만) — 마스킹 시 동·구까지 노출·이후 블러 */
  teacherHomeAddress?: string
  otherRequests: string
  gradeBlocks: UjatInstitutionApplicationGradeBlockDetail[]
  classTimeRows: UjatInstitutionApplicationClassTimeRowDetail[]
  preferredEducationDates: string[]
}
