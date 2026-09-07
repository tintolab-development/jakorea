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

export type VolunteerAssignedScheduleRow = {
  id: string
  no: number
  location: string
  distanceFromHome: string
  scheduleLine: string
}

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
