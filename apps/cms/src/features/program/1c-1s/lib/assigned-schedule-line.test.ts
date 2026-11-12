import { describe, expect, it } from 'vitest'
import {
  buildCompanySchoolAssignedScheduleLine,
  buildCompanySchoolScheduleUnitByScheduleId,
  formatCompanySchoolScheduleUnitLabel,
  resolveCompanySchoolAssignSessionRoundLabel,
} from './assigned-schedule-line'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'

describe('1사1교 배정 일정 표시', () => {
  it('희망 일정이 배정 일정에 연결된 경우만 차시·교시를 만든다', () => {
    const map = buildCompanySchoolScheduleUnitByScheduleId([
      { id: 1, preferenceOrder: 1, sessionCount: 2, startPeriod: 2, resolvedScheduleId: 501 },
      { id: 2, preferenceOrder: 2, sessionCount: 1, startPeriod: 3, resolvedScheduleIds: [502] },
      { id: 3, preferenceOrder: 3, sessionCount: 1, startPeriod: 1, resolvedScheduleId: null },
    ])
    expect(map.get('501')).toEqual({ sessionCount: 2, startPeriod: 2 })
    expect(map.get('502')).toEqual({ sessionCount: 1, startPeriod: 3 })
    expect(map.size).toBe(2)
  })

  it('한 배정 일정에 희망 일정이 둘 이상 연결되면 지어내지 않고 뺀다', () => {
    const map = buildCompanySchoolScheduleUnitByScheduleId([
      { id: 1, sessionCount: 2, startPeriod: 2, resolvedScheduleId: 501 },
      { id: 2, sessionCount: 1, startPeriod: 4, resolvedScheduleIds: [501] },
    ])
    expect(map.has('501')).toBe(false)
  })

  it('교시 라벨(USER-FUNC-0205) — 2차시는 「N~(N+1)교시 (2차시)」, 1차시는 「N교시 (1차시)」', () => {
    expect(formatCompanySchoolScheduleUnitLabel({ sessionCount: 2, startPeriod: 2 })).toBe('2~3교시 (2차시)')
    expect(formatCompanySchoolScheduleUnitLabel({ sessionCount: 1, startPeriod: 3 })).toBe('3교시 (1차시)')
    expect(formatCompanySchoolScheduleUnitLabel({ sessionCount: 2 })).toBe('2차시')
    expect(formatCompanySchoolScheduleUnitLabel({ startPeriod: 4 })).toBe('4교시')
    expect(formatCompanySchoolScheduleUnitLabel(undefined)).toBe('')
  })

  it('「날짜 | N~(N+1)교시 (N차시) | 시간」, 연결이 없으면 「날짜 | 시간」', () => {
    const withUnit = buildCompanySchoolAssignedScheduleLine({
      date: '2026-12-22',
      time: '09:00 ~ 10:30',
      unit: { sessionCount: 2, startPeriod: 1 },
    })
    expect(withUnit).toBe('2026-12-22 | 1~2교시 (2차시) | 09:00 ~ 10:30')
    expect(formatCmsScheduleDisplayLabel(withUnit)).toBe('2026.12.22(화) | 1~2교시 (2차시) | 09:00 ~ 10:30')
    expect(
      formatCmsScheduleDisplayLabel(
        buildCompanySchoolAssignedScheduleLine({ date: '2026-12-22', time: '09:00 ~ 10:30' })
      )
    ).toBe('2026.12.22(화) | 09:00 ~ 10:30')
  })

  it('배정일 칩 순위 — 지망만, 모르면 빈 값(회차 없음)', () => {
    expect(resolveCompanySchoolAssignSessionRoundLabel({ preferenceOrder: 2 })).toBe('2지망')
    expect(resolveCompanySchoolAssignSessionRoundLabel({})).toBe('')
  })
})
