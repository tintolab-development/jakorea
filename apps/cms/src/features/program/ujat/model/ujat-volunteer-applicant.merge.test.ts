import { describe, expect, it } from 'vitest'
import {
  mergeUjatVolunteerApplicantQueryRow,
  type UjatVolunteerApplicantRow,
} from './ujat-volunteer-applicant'

function row(overrides: Partial<UjatVolunteerApplicantRow> = {}): UjatVolunteerApplicantRow {
  return {
    id: '1',
    interviewAssignmentStatus: 'waiting',
    ...overrides,
  } as UjatVolunteerApplicantRow
}

describe('mergeUjatVolunteerApplicantQueryRow', () => {
  it('uses the server row when it is newly assigned', () => {
    const merged = mergeUjatVolunteerApplicantQueryRow(
      row({ interviewAssignmentStatus: 'waiting' }),
      row({
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: '2026.11.19(목)',
        assignedInterviewTime: '10:00 ~ 10:30',
        interviewAssignmentId: 99,
      })
    )
    expect(merged.interviewAssignmentStatus).toBe('assigned')
    expect(merged.interviewAssignmentId).toBe(99)
  })

  it('lets GET waiting overwrite a local assigned patch', () => {
    const merged = mergeUjatVolunteerApplicantQueryRow(
      row({
        interviewAssignmentStatus: 'assigned',
        assignedInterviewDateLabel: '2026.11.19(목)',
        assignedInterviewTime: '10:00 ~ 10:30',
        interviewAssignmentId: 99,
      }),
      row({ interviewAssignmentStatus: 'waiting' })
    )
    expect(merged.interviewAssignmentStatus).toBe('waiting')
    expect(merged.interviewAssignmentId).toBeUndefined()
    expect(merged.assignedInterviewTime).toBeUndefined()
  })
})
