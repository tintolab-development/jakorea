import { describe, expect, it } from 'vitest'
import { buildUjatAssignmentSessionsFromRemote } from './assignment-submissions-adapters'
import type { UjatAssignmentSubmissionListResponse } from './education-execution-api'

const DATA: UjatAssignmentSubmissionListResponse = {
  semesterType: 'FIRST_HALF',
  educationRegionCode: 'SEOUL',
  items: [
    {
      scheduleId: 701,
      isoDate: '2026-10-17',
      planSubmissionPeriodStart: '2026-10-10T00:00:00+09:00',
      planSubmissionPeriodEnd: '2026-10-16T23:59:59+09:00',
      logSubmissionPeriodStart: '2026-10-17T00:00:00+09:00',
      logSubmissionPeriodEnd: '2026-10-24T23:59:59+09:00',
      volunteers: [
        {
          participantId: 3001,
          memberName: '김봉사',
          institutionName: '○○초등학교',
          assignedClass: '3학년 2반',
          isDropout: false,
          hasProgressHistory: true,
          plan: {
            status: 'SUBMITTED',
            submittedAt: '2026-10-15T11:00:00+09:00',
            feedbackDeliveredAt: '2026-10-16T09:00:00+09:00',
            formResponseId: 91001,
          },
          log: {
            status: 'NOT_SUBMITTED',
            submittedAt: null,
            feedbackDeliveredAt: null,
            formResponseId: null,
          },
        },
        {
          participantId: 3002,
          memberName: '이포기',
          isDropout: true,
          hasProgressHistory: false,
          plan: { status: 'NOT_SUBMITTED' },
          log: { status: 'NOT_SUBMITTED' },
        },
      ],
    },
  ],
}

describe('buildUjatAssignmentSessionsFromRemote', () => {
  it('maps education-day groups and hides dropouts without history', () => {
    const sessions = buildUjatAssignmentSessionsFromRemote({
      data: DATA,
      half: 'h1',
      regionKey: 'seoul',
    })

    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.isoDate).toBe('2026-10-17')
    expect(sessions[0]?.planSubmissionPeriodLabel).toBe('2026.10.10 ~ 2026.10.16')
    expect(sessions[0]?.logSubmissionPeriodLabel).toBe('2026.10.17 ~ 2026.10.24')
    expect(sessions[0]?.volunteers).toHaveLength(1)
    expect(sessions[0]?.volunteers[0]).toMatchObject({
      name: '김봉사',
      institutionName: '○○초등학교',
      assignedClass: '3학년 2반',
      plan: {
        status: 'submitted',
        submittedDateLabel: '26.10.15',
        feedbackDeliveredDateLabel: '26.10.16',
        formResponseId: 91001,
      },
      log: { status: 'not_submitted' },
    })
  })

  it('returns empty sessions when items is empty', () => {
    expect(
      buildUjatAssignmentSessionsFromRemote({
        data: { items: [] },
        half: 'h2',
        regionKey: 'seoul',
      })
    ).toEqual([])
  })
})
