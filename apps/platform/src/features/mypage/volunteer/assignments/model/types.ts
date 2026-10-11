export type VolunteerAssignmentStatus = 'waiting' | 'cancelled'

export type VolunteerAssignedInstitutionRow = {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  region: string
  distanceFromHome: string
  scheduleLines: string[]
}

export type VolunteerWaitingInstitutionRow = {
  id: string
  no: number
  schoolName: string
  desiredGrade: string
  region: string
  distanceFromHome: string
  scheduleLine: string
  assignmentStatus: VolunteerAssignmentStatus
}

/** 개인 — 배정된 봉사 일정 (시안: 지역별 복수 일정 가능) */
export type VolunteerAssignedScheduleRow = {
  id: string
  no: number
  location: string
  distanceFromHome: string
  scheduleLines: string[]
}

/** 개인 — 배정된 봉사 일정 목록 (대기·취소) */
export type VolunteerWaitingScheduleRow = {
  id: string
  no: number
  location: string
  distanceFromHome: string
  scheduleLine: string
  assignmentStatus: VolunteerAssignmentStatus
}

export type VolunteerInstitutionAssignment = {
  assigned: VolunteerAssignedInstitutionRow[]
  waiting: VolunteerWaitingInstitutionRow[]
}

export type VolunteerIndividualAssignment = {
  assigned: VolunteerAssignedScheduleRow[]
  waiting: VolunteerWaitingScheduleRow[]
}

export type VolunteerAssignmentBundle =
  | { audience: 'organization'; data: VolunteerInstitutionAssignment }
  | { audience: 'individual'; data: VolunteerIndividualAssignment }
