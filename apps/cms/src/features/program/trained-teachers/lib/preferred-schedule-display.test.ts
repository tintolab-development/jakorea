import { describe, expect, it } from 'vitest'
import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import {
  formatTrainedTeacherPreferredScheduleLines,
  resolveTrainedTeacherBlockSessionCount,
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
      '2026.11.17(화) ㅣ 1차시 ㅣ 1차시: 15:07 ~ 16:07',
      '2026.11.16(월) ㅣ 1차시 ㅣ 1차시: 4교시 ㅣ 15:07 ~ 16:07',
      '2026.11.19(목) ㅣ 1차시 ㅣ 1차시: 2교시 ㅣ 15:07 ~ 16:07',
    ])
    expect(lines.some(line => line.includes('공통 교육 예정'))).toBe(false)
    expect(lines.some(line => line.includes('1교시'))).toBe(false)
  })

  it('keeps date and weekday only when sessionTimes is empty', () => {
    expect(
      formatTrainedTeacherPreferredScheduleLines({
        date: '2026-11-17',
        dayOfWeek: '화',
        sessionCount: 0,
        sessionTimes: [],
      })
    ).toEqual(['2026.11.17(화)'])
  })

  it('시안: 2차시 신청은 교시·시간 두 줄을 한 줄로 (CMS-FUNC-0072)', () => {
    expect(
      formatTrainedTeacherPreferredScheduleLines({
        date: '2026-04-27',
        dayOfWeek: '월',
        sessionCount: 2,
        sessionTimes: [
          { sessionIndex: 1, classPeriod: '1교시', timeRange: '09:00 ~ 09:40' },
          { sessionIndex: 2, classPeriod: '2', timeRange: '09:50 ~ 10:30' },
        ],
      })
    ).toEqual(['2026.04.27(월) ㅣ 2차시 ㅣ 1차시: 1교시 ㅣ 09:00 ~ 09:40 / 2차시: 2교시 ㅣ 09:50 ~ 10:30'])
  })

  it('기존 데이터 sessionCount(교시 번호)보다 시간 줄 수를 차시 수로 쓴다', () => {
    expect(
      resolveTrainedTeacherBlockSessionCount({
        sessionCount: 3,
        sessionTimes: [{ sessionIndex: 1, classPeriod: '3교시', timeRange: '10:40 ~ 11:20' }],
      })
    ).toBe(1)
    expect(resolveTrainedTeacherBlockSessionCount({ sessionCount: 2, sessionTimes: [] })).toBe(2)
  })

  it('does not use array index as a stable key', () => {
    expect(trainedTeacherPreferredScheduleLineKey(qaBlocks[0]!, 0)).toBe(
      '1-2026-11-17-187701-1'
    )
  })
})
