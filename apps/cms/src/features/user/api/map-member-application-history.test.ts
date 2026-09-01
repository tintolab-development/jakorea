import { describe, expect, it } from 'vitest'
import { mapMemberApplicationHistoryItem } from './map-member-application-history'

describe('mapMemberApplicationHistoryItem subjectType', () => {
  it('maps ORGANIZATION applicationType to school (not student)', () => {
    const app = mapMemberApplicationHistoryItem(
      {
        applicationId: 174001,
        programId: 167001,
        applicationType: 'ORGANIZATION',
        applicationStatus: 'APPROVED',
      },
      'user-1'
    )
    expect(app.subjectType).toBe('school')
  })

  it('maps INDIVIDUAL applicationType to student', () => {
    const app = mapMemberApplicationHistoryItem(
      {
        applicationId: 173011,
        programId: 167001,
        applicationType: 'INDIVIDUAL',
        applicationStatus: 'APPROVED',
      },
      'user-1'
    )
    expect(app.subjectType).toBe('student')
  })

  it('maps INSTRUCTOR applicationType to instructor', () => {
    const app = mapMemberApplicationHistoryItem(
      {
        applicationId: 173021,
        programId: 167001,
        applicationType: 'INSTRUCTOR',
        applicationStatus: 'APPROVED',
      },
      'user-1'
    )
    expect(app.subjectType).toBe('instructor')
  })
})
