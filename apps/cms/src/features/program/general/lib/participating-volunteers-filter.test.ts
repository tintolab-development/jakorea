import { describe, expect, it } from 'vitest'
import {
  formatParticipatingVolunteerInstitutionCell,
  participatingVolunteerInstitutionColumnTitle,
} from '@/features/program/general/lib/participating-volunteers-filter'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { Program } from '@/types/domain'

const baseRow: ParticipatingVolunteerRow = {
  id: '1',
  no: 1,
  volunteerName: '봉사자',
  id1365: '1365-1',
  assignedInstitutionNames: [],
  sessions: [],
  contact: '-',
  email: '-',
}

describe('participating-volunteers-filter institution cell', () => {
  it('uses affiliation fallback on individual program when 배정 기관 is empty', () => {
    const program = { generalProgramAudience: 'individual' } as Program
    expect(
      formatParticipatingVolunteerInstitutionCell(
        { ...baseRow, affiliation: '서울고등학교' },
        program
      )
    ).toBe('서울고등학교')
    expect(participatingVolunteerInstitutionColumnTitle(program)).toBe('배정 기관')
  })

  it('keeps institution column title for organization programs', () => {
    const program = { generalProgramAudience: 'school_institution' } as unknown as Program
    expect(participatingVolunteerInstitutionColumnTitle(program)).toBe('기관명')
  })
})
