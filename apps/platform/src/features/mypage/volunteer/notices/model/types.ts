export type VolunteerInstitutionGuide = {
  schoolName: string
  computerInRoom: string
  waitingPlace: string
  meal: string
  otherNotes: string
  criminalCheckRequest: string
}

export type VolunteerInstitutionGuideField = {
  key: keyof Omit<VolunteerInstitutionGuide, 'schoolName'>
  label: string
}
