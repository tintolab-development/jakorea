import { describe, expect, it } from 'vitest'
import { filterVisibleAssignmentVolunteers, formatAssignmentRemarks } from './assignment-display'
import {
  buildUjatAssignmentSessionsFromResponse,
  formatAssignmentShortDate,
} from './assignment-submissions-adapter'

describe('buildUjatAssignmentSessionsFromResponse', () => {
  it('handoff 예시 — 계획서만 기한 내 제출', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h1',
      response: {
        sessions: [
          {
            scheduleId: 701,
            educationDate: '2026-10-17',
            planSubmissionPeriod: { from: '2026-10-10', to: '2026-10-16' },
            logSubmissionPeriod: { from: '2026-10-17', to: '2026-10-24' },
            volunteers: [
              {
                participantId: 3001,
                memberId: 4001,
                volunteerName: '김봉사',
                institutionName: '○○초등학교',
                assignedClass: '3학년 2반',
                activityAbandoned: false,
                hasProgressOnDate: true,
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
            ],
          },
        ],
      },
    })

    expect(session.id).toBe('701')
    expect(session.isoDate).toBe('2026-10-17')
    expect(session.planSubmissionPeriodLabel).toBe('2026.10.10 ~ 2026.10.16')
    expect(session.logSubmissionPeriodLabel).toBe('2026.10.17 ~ 2026.10.24')

    const [row] = session.volunteers
    expect(row.name).toBe('김봉사')
    expect(row.plan).toEqual({
      status: 'submitted',
      submittedDateLabel: '2026.10.15',
      feedbackDeliveredDateLabel: '2026.10.16',
      formResponseId: 91001,
    })
    expect(row.log).toEqual({ status: 'not_submitted' })
    expect(formatAssignmentRemarks(row)).toBe('피드백 전달 완료 (2026.10.16)')
  })

  it('활동 포기자는 그 날 진행 이력이 있을 때만 노출', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h2',
      response: {
        sessions: [
          {
            scheduleId: 1,
            educationDate: '2026-11-06',
            volunteers: [
              { participantId: 1, activityAbandoned: true, hasProgressOnDate: true },
              { participantId: 2, activityAbandoned: true, hasProgressOnDate: false },
            ],
          },
        ],
      },
    })
    expect(filterVisibleAssignmentVolunteers(session.volunteers).map(v => v.id)).toEqual(['1-1'])
  })

  it('REVISED는 피드백 비고 대신 수정 제출 비고, DEADLINE_MISSED는 기한 미준수', () => {
    const [session] = buildUjatAssignmentSessionsFromResponse({
      regionKey: 'seoul',
      half: 'h1',
      response: {
        sessions: [
          {
            scheduleId: 2,
            educationDate: '2026-04-03',
            volunteers: [
              {
                participantId: 9,
                plan: {
                  status: 'REVISED',
                  submittedAt: '2026-04-01T09:00:00+09:00',
                  feedbackDeliveredAt: '2026-03-30T09:00:00+09:00',
                  formResponseId: 1,
                },
                log: {
                  status: 'DEADLINE_MISSED',
                  submittedAt: '2026-04-12T10:00:00+09:00',
                  formResponseId: 2,
                },
              },
            ],
          },
        ],
      },
    })
    expect(formatAssignmentRemarks(session.volunteers[0])).toBe(
      '교육 계획서 수정 제출 (2026.04.01)\n교육일지 기한 미준수 (2026.04.12)'
    )
  })

  it('sessions 없으면 빈 배열', () => {
    expect(
      buildUjatAssignmentSessionsFromResponse({ regionKey: 'seoul', half: 'h1', response: {} })
    ).toEqual([])
  })
})

describe('formatAssignmentShortDate', () => {
  it('UTC 시각은 Asia/Seoul 날짜로', () => {
    expect(formatAssignmentShortDate('2026-10-15T16:00:00Z')).toBe('2026.10.16')
  })
})
