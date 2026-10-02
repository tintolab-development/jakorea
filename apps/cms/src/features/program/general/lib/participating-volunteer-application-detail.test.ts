import { describe, expect, it } from 'vitest'
import { mapVolunteerApplicationDetailToParticipatingRow } from './participating-volunteer-application-detail'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'

const base: ParticipatingVolunteerRow = {
  id: '1691601',
  volunteerApplicationId: '77002',
  memberId: 9101,
  programId: '168001',
  no: 1,
  volunteerName: '마스킹',
  id1365: '1365-****',
  assignedInstitutionNames: [],
  sessions: [],
  contact: '010-****-9999',
  email: 'v***@example.com',
}

describe('mapVolunteerApplicationDetailToParticipatingRow', () => {
  it('keeps participantId and maps application profile onto the progress row', () => {
    const mapped = mapVolunteerApplicationDetailToParticipatingRow(
      {
        id: 77002,
        memberId: 9101,
        profile: {
          name: '이봉사자',
          contact: '010-2222-3333',
          email: 'vol@example.com',
          external1365Id: '1365-10001',
          gender: '여성',
          birthDate: '1999-01-01',
          age: 27,
        },
      },
      base
    )

    expect(mapped.id).toBe('1691601')
    expect(mapped.volunteerApplicationId).toBe('77002')
    expect(mapped.volunteerName).toBe('이봉사자')
    expect(mapped.contact).toBe('010-2222-3333')
    expect(mapped.email).toBe('vol@example.com')
    expect(mapped.id1365).toBe('1365-10001')
  })
})
