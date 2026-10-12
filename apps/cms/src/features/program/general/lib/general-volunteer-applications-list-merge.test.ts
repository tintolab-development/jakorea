import { describe, expect, it } from 'vitest'
import { mergeGeneralVolunteerApplicantListRows } from './general-volunteer-applications-list-merge'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

function row(
  id: string,
  assignmentId?: number,
  interviewAssignmentStatus: GeneralVolunteerApplicantRow['interviewAssignmentStatus'] = 'assigned'
): GeneralVolunteerApplicantRow {
  return {
    id,
    no: 1,
    name: '테스트',
    interviewAssignmentId: assignmentId,
    interviewAssignmentStatus,
  } as GeneralVolunteerApplicantRow
}

describe('mergeGeneralVolunteerApplicantListRows', () => {
  it('keeps local interviewAssignmentId when server row omits it but status is still assigned', () => {
    const previous = [row('1', 9001, 'assigned')]
    const next = [row('1', undefined, 'assigned')]
    expect(mergeGeneralVolunteerApplicantListRows(previous, next)[0].interviewAssignmentId).toBe(9001)
  })

  it('prefers server interviewAssignmentId when present', () => {
    const previous = [row('1', 9001)]
    const next = [row('1', 9002)]
    expect(mergeGeneralVolunteerApplicantListRows(previous, next)[0].interviewAssignmentId).toBe(9002)
  })

  it('drops stale local assignmentId when server shows assignment cleared', () => {
    const previous = [row('1', 9001, 'assigned')]
    const next = [row('1', undefined, 'waiting')]
    expect(mergeGeneralVolunteerApplicantListRows(previous, next)[0].interviewAssignmentId).toBeUndefined()
  })

  it('drops stale local assignmentId after activity withdraw on server row', () => {
    const previous = [row('1', 9001, 'assigned')]
    const next = [row('1', undefined, 'withdrawn')]
    expect(mergeGeneralVolunteerApplicantListRows(previous, next)[0].interviewAssignmentId).toBeUndefined()
  })
})
