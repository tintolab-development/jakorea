import { describe, expect, it } from 'vitest'
import { resolveSatisfactionSurveyDisplayTitle } from './satisfaction-survey-display-title'

describe('resolveSatisfactionSurveyDisplayTitle', () => {
  it('uses only the mapped form name when not per-schedule', () => {
    expect(
      resolveSatisfactionSurveyDisplayTitle({
        title: '만족도조사 (학생용)',
        satisfactionRunMode: 'ONCE_AT_END',
        targetScope: 'PROGRAM',
      })
    ).toBe('만족도조사 (학생용)')
  })

  it('prefixes the schedule when PER_SCHEDULE', () => {
    expect(
      resolveSatisfactionSurveyDisplayTitle(
        {
          title: '만족도조사 (학생용)',
          satisfactionRunMode: 'PER_SCHEDULE',
          targetScope: 'SCHEDULE',
          targetScopeId: 1,
        },
        [
          {
            id: 1,
            sessionNo: 1,
            startAt: '2026-11-12T03:00:00.000Z',
          },
        ]
      )
    ).toBe('1회차 · 2026.11.12(목) 만족도조사 (학생용)')
  })
})
