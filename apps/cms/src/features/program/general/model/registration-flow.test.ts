import { describe, expect, it } from 'vitest'
import {
  getVisibleGeneralProgramApplicationTabKeys,
  getVisibleGeneralProgramRecruitTabKeys,
  type GeneralProgramRegistrationParticipantFlags,
} from './registration-flow'

const individualOnly: GeneralProgramRegistrationParticipantFlags = {
  individual: true,
  organization: false,
  teacherInstructor: false,
  volunteer: false,
}

const organizationWithInstructor: GeneralProgramRegistrationParticipantFlags = {
  individual: false,
  organization: true,
  teacherInstructor: true,
  volunteer: false,
}

const allTypes: GeneralProgramRegistrationParticipantFlags = {
  individual: true,
  organization: true,
  teacherInstructor: true,
  volunteer: true,
}

describe('general program registration tab visibility', () => {
  it('shows only participant recruit/application forms when teacher/instructor is unchecked', () => {
    expect(getVisibleGeneralProgramRecruitTabKeys(individualOnly)).toEqual([
      'recruit-participant-individual',
    ])
    expect(getVisibleGeneralProgramApplicationTabKeys(individualOnly)).toEqual([
      'application-participant-individual',
    ])
  })

  it('adds instructor recruit and application forms only when teacher/instructor is checked', () => {
    expect(getVisibleGeneralProgramRecruitTabKeys(organizationWithInstructor)).toEqual([
      'recruit-participant-school',
      'recruit-instructor',
    ])
    expect(getVisibleGeneralProgramApplicationTabKeys(organizationWithInstructor)).toEqual([
      'application-participant-school',
      'application-instructor',
    ])
  })

  it('shows volunteer forms only when volunteer is checked, and hides them for 1사1교', () => {
    expect(getVisibleGeneralProgramRecruitTabKeys(allTypes)).toEqual([
      'recruit-participant-school',
      'recruit-participant-individual',
      'recruit-instructor',
      'recruit-volunteer',
    ])
    expect(getVisibleGeneralProgramRecruitTabKeys(allTypes, { hideVolunteer: true })).toEqual([
      'recruit-participant-school',
      'recruit-participant-individual',
      'recruit-instructor',
    ])
    expect(
      getVisibleGeneralProgramApplicationTabKeys(allTypes, { hideVolunteer: true })
    ).toEqual([
      'application-participant-school',
      'application-participant-individual',
      'application-instructor',
    ])
  })
})
