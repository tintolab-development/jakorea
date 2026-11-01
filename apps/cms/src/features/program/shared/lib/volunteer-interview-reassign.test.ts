import { describe, expect, it } from 'vitest'
import {
  canReassignVolunteerInterviewAssignment,
  pickVolunteerInterviewAssignmentApiStatus,
} from './volunteer-interview-reassign'

describe('pickVolunteerInterviewAssignmentApiStatus', () => {
  it('EVALUATED를 ASSIGNED보다 우선한다', () => {
    expect(
      pickVolunteerInterviewAssignmentApiStatus('ASSIGNED', 'EVALUATED', 'DOCUMENT_PASSED')
    ).toBe('EVALUATED')
  })

  it('ASSIGNED만 있으면 ASSIGNED를 반환한다', () => {
    expect(pickVolunteerInterviewAssignmentApiStatus('ASSIGNED', null)).toBe('ASSIGNED')
  })
})

describe('canReassignVolunteerInterviewAssignment', () => {
  it('ASSIGNED·평가 없으면 재배정 가능', () => {
    expect(
      canReassignVolunteerInterviewAssignment({
        interviewAssignmentStatus: 'assigned',
        interviewAssignmentApiStatus: 'ASSIGNED',
        secondInterviewScreeningStatus: 'waiting',
      })
    ).toBe(true)
  })

  it('EVALUATED면 재배정 불가', () => {
    expect(
      canReassignVolunteerInterviewAssignment({
        interviewAssignmentStatus: 'assigned',
        interviewAssignmentApiStatus: 'EVALUATED',
      })
    ).toBe(false)
  })

  it('점수가 있으면 재배정 불가', () => {
    expect(
      canReassignVolunteerInterviewAssignment({
        interviewAssignmentStatus: 'assigned',
        interviewAssignmentApiStatus: 'ASSIGNED',
        managerAScore: 4,
      })
    ).toBe(false)
  })

  it('2차 합격·불합격이면 재배정 불가', () => {
    expect(
      canReassignVolunteerInterviewAssignment({
        interviewAssignmentStatus: 'assigned',
        interviewAssignmentApiStatus: 'ASSIGNED',
        secondInterviewScreeningStatus: 'pass',
      })
    ).toBe(false)
  })
})
