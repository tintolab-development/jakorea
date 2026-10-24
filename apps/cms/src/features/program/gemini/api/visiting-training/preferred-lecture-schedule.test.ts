import { describe, expect, it } from 'vitest'
import {
  formatGeminiPreferredLectureScheduleFromBlocks,
  resolveGeminiPreferredLectureSchedule,
} from './preferred-lecture-schedule'

describe('formatGeminiPreferredLectureScheduleFromBlocks', () => {
  it('formats ranked blocks into CMS cell lines', () => {
    expect(
      formatGeminiPreferredLectureScheduleFromBlocks([
        {
          preferenceRank: 2,
          date: '2026-01-16',
          dayOfWeek: '금',
          sessionCount: 2,
          sessionTimes: [{ startTime: '15:30', endTime: '16:40' }],
        },
        {
          preferenceRank: 1,
          date: '2026-01-09',
          dayOfWeek: '금',
          sessionCount: 2,
          sessionTimes: [{ startTime: '15:30', endTime: '16:40' }],
        },
      ])
    ).toBe(
      [
        '1지망 : 2026.01.09(금) | 15:30~16:40(2차시)',
        '2지망 : 2026.01.16(금) | 15:30~16:40(2차시)',
      ].join('\n')
    )
  })

  it('returns empty string for null/empty blocks', () => {
    expect(formatGeminiPreferredLectureScheduleFromBlocks(null)).toBe('')
    expect(formatGeminiPreferredLectureScheduleFromBlocks([])).toBe('')
  })
})

describe('resolveGeminiPreferredLectureSchedule', () => {
  it('prefers preferredLectureScheduleText over blocks', () => {
    expect(
      resolveGeminiPreferredLectureSchedule({
        preferredLectureScheduleText: '1지망 : 2026.01.09(금) | 15:30~16:40(2차시)',
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-02-01',
            sessionTimes: [{ startTime: '10:00', endTime: '11:00' }],
          },
        ],
      })
    ).toBe('1지망 : 2026.01.09(금) | 15:30~16:40(2차시)')
  })
})
