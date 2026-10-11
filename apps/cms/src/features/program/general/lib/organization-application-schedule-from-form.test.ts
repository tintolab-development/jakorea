import { describe, expect, it } from 'vitest'
import { pickInstitutionScheduleSessionsFromFormAnswers } from './organization-application-schedule-from-form'

describe('pickInstitutionScheduleSessionsFromFormAnswers', () => {
  it('answerDisplayText의 PERIOD 라벨 여러 줄을 sessions로 만든다', () => {
    const sessions = pickInstitutionScheduleSessionsFromFormAnswers([
      {
        questionKeySnapshot: 'program-application-institution-seed-schedule',
        answerValueJson: '["schedule:186659:education-period:0"]',
        answerDisplayText:
          '26년 10월 28일(수) ~ 26년 11월 12일(목)\n26년 11월 25일(수) ~ 26년 12월 11일(금)',
      },
    ])
    expect(sessions?.map(s => s.scheduleLabel)).toEqual([
      '26년 10월 28일(수) ~ 26년 11월 12일(목)',
      '26년 11월 25일(수) ~ 26년 12월 11일(금)',
    ])
  })

  it('preferredScheduleBlocks JSON을 sessions로 만든다', () => {
    const sessions = pickInstitutionScheduleSessionsFromFormAnswers([
      {
        questionKeySnapshot: 'program-application-institution-seed-schedule',
        answerValueJson: JSON.stringify([
          {
            preferenceRank: 1,
            date: '2026-10-28',
            sessionTimes: [
              { startTime: '09:30', endTime: '12:20', classPeriod: '1교시' },
            ],
          },
        ]),
      },
    ])
    expect(sessions).toHaveLength(1)
    expect(sessions?.[0]?.date).toBe('2026-10-28')
    expect(sessions?.[0]?.timeRange).toBe('09:30 ~ 12:20')
  })
})
