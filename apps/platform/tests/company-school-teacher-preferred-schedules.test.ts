import { describe, expect, it } from 'vitest'
import { resolveTeacherPreferredSchedules } from '../src/features/mypage/education/applications/lib/teacher-preferred-schedules'

describe('1사1교 교사 신청 내용 희망 일정 (USER-FUNC-0205)', () => {
  const blocks = [
    {
      preferenceRank: 1,
      date: '2026-11-12',
      sessionCount: 2,
      sessionTimes: [
        { sessionIndex: 1, classPeriod: '2', startTime: '09:50', endTime: '10:30' },
        { sessionIndex: 2, classPeriod: '3', startTime: '10:40', endTime: '11:20' },
      ],
    },
    {
      preferenceRank: 2,
      date: '2026-11-19',
      sessionCount: 1,
      sessionTimes: [{ sessionIndex: 1, classPeriod: '4', startTime: '11:30', endTime: '12:10' }],
    },
  ]

  it('「날짜 | N~(N+1)교시 (N차시)」 + 「N교시 (시간) | N+1교시 (시간)」', () => {
    const cards = resolveTeacherPreferredSchedules({
      companySchoolPeriodDetail: true,
      preferredScheduleBlocks: blocks,
    })
    expect(cards[0]?.value).toBe('2026.11.12(목) | 2~3교시 (2차시)')
    expect(cards[0]?.sessionLines).toEqual(['2교시 (09:50 ~ 10:30) | 3교시 (10:40 ~ 11:20)'])
    expect(cards[1]?.value).toBe('2026.11.19(목) | 4교시 (1차시)')
    expect(cards[1]?.sessionLines).toEqual(['4교시 (11:30 ~ 12:10)'])
  })

  it('1사1교가 아니면 기존 표기(교시 라벨 없음, 플랫폼 공통 날짜)', () => {
    const cards = resolveTeacherPreferredSchedules({ preferredScheduleBlocks: blocks })
    expect(cards[0]?.value).not.toContain('교시 (2차시)')
    expect(cards[0]?.value).toContain('2026년')
    expect(cards[0]?.sessionLines).toBeUndefined()
  })
})
