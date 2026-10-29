import { describe, expect, it } from 'vitest'
import { buildCompanySchoolPreferredScheduleBlocks } from './company-school-preferred-schedule-blocks'

describe('buildCompanySchoolPreferredScheduleBlocks', () => {
  it('시안처럼 지망·희망 교육일 및 차시·차시별 교시/시간으로 바꾼다', () => {
    const blocks = buildCompanySchoolPreferredScheduleBlocks([
      {
        id: 1,
        preferenceOrder: 1,
        requestedDate: '2026-04-20',
        startPeriod: 1,
        sessionCount: 1,
        sessionTimes: [{ sessionOrder: 1, period: 1, startTime: '09:00:00', endTime: '09:40:00' }],
      },
      {
        id: 2,
        preferenceOrder: 2,
        requestedDate: '2026-04-27',
        startPeriod: 1,
        sessionCount: 2,
        sessionTimes: [
          { sessionOrder: 1, period: 1, startTime: '09:00', endTime: '09:40' },
          { sessionOrder: 2, period: 2, startTime: '09:50', endTime: '10:30' },
        ],
      },
    ])
    expect(blocks.map(b => b.rankLabel)).toEqual(['■ 1지망', '■ 2지망'])
    expect(blocks[0]!.dateSegments).toEqual(['2026.04.20(월)', '1차시'])
    expect(blocks[0]!.timeRows).toHaveLength(1)
    expect(blocks[0]!.timeRows[0]!.map(c => [c.label, c.segments])).toEqual([
      ['1차시 희망 교육 시간', ['1교시', '09:00 ~ 09:40']],
    ])
    expect(blocks[1]!.dateSegments).toEqual(['2026.04.27(월)', '2차시'])
    expect(blocks[1]!.timeRows).toHaveLength(1)
    expect(blocks[1]!.timeRows[0]!.map(c => [c.label, c.segments])).toEqual([
      ['1차시 희망 교육 시간', ['1교시', '09:00 ~ 09:40']],
      ['2차시 희망 교육 시간', ['2교시', '09:50 ~ 10:30']],
    ])
  })

  it('서버 순서를 그대로 두고 비어 있는 값은 빈 세그먼트로 둔다', () => {
    const blocks = buildCompanySchoolPreferredScheduleBlocks([
      { preferenceOrder: 2, requestedDate: '', sessionCount: 1, sessionTimes: [] },
      { preferenceOrder: 1, requestedDate: '2026-04-20', sessionCount: 1 },
    ])
    expect(blocks.map(b => b.rankLabel)).toEqual(['■ 2지망', '■ 1지망'])
    expect(blocks[0]!.dateSegments).toEqual(['1차시'])
    expect(blocks[0]!.timeRows[0]![0]!.segments).toEqual([])
  })

  it('응답이 없으면 빈 배열', () => {
    expect(buildCompanySchoolPreferredScheduleBlocks(undefined)).toEqual([])
  })
})

describe('parseCompanySchoolRequestedScheduleMemo', () => {
  it('서버 메모를 지망별 일정으로 읽는다 (서버 순서 유지)', async () => {
    const { parseCompanySchoolRequestedScheduleMemo } = await import(
      './company-school-preferred-schedule-blocks'
    )
    const parsed = parseCompanySchoolRequestedScheduleMemo(
      '2026-12-22 2교시/2차시 [1:2:03:00-04:00;2:3:04:00-05:00], 2026-12-30 3교시/2차시 [1:3:04:04-07:00;2:4:08:00-09:00]'
    )
    expect(parsed).toHaveLength(2)
    const blocks = buildCompanySchoolPreferredScheduleBlocks(parsed)
    expect(blocks[0]!.rankLabel).toBe('■ 1지망')
    expect(blocks[0]!.dateSegments).toEqual(['2026.12.22(화)', '2차시'])
    expect(blocks[0]!.timeRows[0]!.map(c => [c.label, c.segments])).toEqual([
      ['1차시 희망 교육 시간', ['2교시', '03:00 ~ 04:00']],
      ['2차시 희망 교육 시간', ['3교시', '04:00 ~ 05:00']],
    ])
    expect(blocks[1]!.dateSegments).toEqual(['2026.12.30(수)', '2차시'])
    expect(blocks[1]!.timeRows[0]![0]!.segments).toEqual(['3교시', '04:04 ~ 07:00'])
  })
  it('형식이 다르면 빈 배열', async () => {
    const { parseCompanySchoolRequestedScheduleMemo } = await import(
      './company-school-preferred-schedule-blocks'
    )
    expect(parseCompanySchoolRequestedScheduleMemo('2026.12.22 오전')).toEqual([])
    expect(parseCompanySchoolRequestedScheduleMemo(null)).toEqual([])
  })
})
