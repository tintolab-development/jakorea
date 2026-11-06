import { describe, expect, it } from 'vitest'
import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import {
  formatTrainedTeacherPreferredScheduleLines,
  trainedTeacherPreferredScheduleLineKey,
} from './preferred-schedule-display'

const qaBlocks: ApplicantPreferredScheduleBlock[] = [
  {
    preferenceRank: 1,
    date: '2026-11-17',
    dayOfWeek: '화',
    sessionCount: 1,
    sessionTimes: [
      {
        sessionIndex: 1,
        classPeriod: '',
        startTime: '15:07',
        endTime: '16:07',
        timeRange: '15:07 ~ 16:07',
      },
    ],
    scheduleId: 187701,
    scheduleStatus: 'MATCHED',
  },
  {
    preferenceRank: 2,
    date: '2026-11-16',
    dayOfWeek: '월',
    sessionCount: 1,
    sessionTimes: [
      {
        sessionIndex: 1,
        classPeriod: '4교시',
        startTime: '15:07',
        endTime: '16:07',
        timeRange: '15:07 ~ 16:07',
      },
    ],
    scheduleId: 187704,
    scheduleStatus: 'MATCHED',
  },
  {
    preferenceRank: 3,
    date: '2026-11-19',
    dayOfWeek: '목',
    sessionCount: 1,
    sessionTimes: [
      {
        sessionIndex: 1,
        classPeriod: '2교시',
        startTime: '15:07',
        endTime: '16:07',
        timeRange: '15:07 ~ 16:07',
      },
    ],
    scheduleId: 187702,
    scheduleStatus: 'MATCHED',
  },
]

describe('formatTrainedTeacherPreferredScheduleLines', () => {
  it('formats the 186551/1691592 MATCHED slots without inventing 1교시 or 공통 교육 예정', () => {
    const lines = qaBlocks.flatMap(formatTrainedTeacherPreferredScheduleLines)
    expect(lines).toEqual([
      '2026-11-17 (화) 15:07 ~ 16:07',
      '2026-11-16 (월) 4교시 15:07 ~ 16:07',
      '2026-11-19 (목) 2교시 15:07 ~ 16:07',
    ])
    expect(lines.some(line => line.includes('공통 교육 예정'))).toBe(false)
    expect(lines.some(line => line.includes('1교시'))).toBe(false)
  })

  it('keeps date and weekday only when sessionTimes is empty', () => {
    expect(
      formatTrainedTeacherPreferredScheduleLines({
        date: '2026-11-17',
        dayOfWeek: '화',
        sessionTimes: [],
      })
    ).toEqual(['2026-11-17 (화)'])
  })

  it('does not use array index as a stable key', () => {
    expect(trainedTeacherPreferredScheduleLineKey(qaBlocks[0]!, 0)).toBe(
      '1-2026-11-17-187701-1'
    )
  })
})
