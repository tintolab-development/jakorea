import { describe, expect, it } from 'vitest'
import { buildGeneralProgressSessionTableHeader } from './general-progress-session-table-header'
import { shouldHideGiveUpParticipantFromSchedule } from './general-progress-give-up-visibility'
import type { Program } from '@/types/domain'

describe('buildGeneralProgressSessionTableHeader', () => {
  it('uses round and date-only title, duration, format, and clock when 교시 is absent', () => {
    const header = buildGeneralProgressSessionTableHeader({
      round: 1,
      startAt: '2026-01-09T09:20:00+09:00',
      endAt: '2026-01-09T11:10:00+09:00',
      sessionFormat: '오프라인',
    })

    expect(header.headerTitle).toBe('1회차 : 2026.01.09(금)')
    expect(header.headerScheduleSummary).toBe('110분 (오프라인)')
    expect(header.headerPeriodRangeLabel).toBe('09:20 ~ 11:10')
  })

  it('prefers a named schedule over the generic round label', () => {
    const header = buildGeneralProgressSessionTableHeader({
      round: 1,
      scheduleName: '오리엔테이션',
      startAt: '2026-01-09T09:20:00+09:00',
      endAt: '2026-01-09T11:10:00+09:00',
    })

    expect(header.headerTitle).toBe('오리엔테이션 : 2026.01.09(금)')
  })

  it('does not treat 공통 교육 예정 N as a named schedule', () => {
    const header = buildGeneralProgressSessionTableHeader({
      round: 1,
      leadLabel: '1회차',
      scheduleName: '공통 교육 예정 1',
      startAt: '2026-10-24T07:00:00Z',
      endAt: '2026-10-24T07:02:00Z',
    })

    expect(header.headerTitle).toBe('1회차 : 2026.10.24(토)')
  })

  it('shows stored 교시 ranges instead of inventing them from the round', () => {
    const header = buildGeneralProgressSessionTableHeader({
      round: 1,
      startAt: '2026-01-09T09:20:00+09:00',
      endAt: '2026-01-09T11:10:00+09:00',
      sessionDuration: '2시간',
      sessionFormat: '오프라인',
      sessionClassNum: '1교시',
      sessionTimeRange: '1교시 (09:20 ~ 10:10) ~ 2교시 (10:20 ~ 11:10)',
    })

    expect(header.headerScheduleSummary).toBe('2시간 (오프라인)')
    expect(header.headerPeriodRangeLabel).toBe(
      '1교시 (09:20 ~ 10:10) ~ 2교시 (10:20 ~ 11:10)'
    )
  })

  it('ignores synthetic N교시 classNum from session mapping', () => {
    const header = buildGeneralProgressSessionTableHeader({
      round: 1,
      sessionClassNum: '1교시',
      sessionTimeRange: '9:20~11:10',
      sessionDuration: '2시간',
      sessionFormat: '오프라인',
      dateLabel: '2026.01.09(금)',
    })

    expect(header.headerPeriodRangeLabel).toBe('09:20 ~ 11:10')
  })

  it('fills education form from commonInfo when the session format is a schedule name', () => {
    const program = {
      id: 'p1',
      generalCommonInfo: {
        educationFormLabel: '오프라인',
      },
    } as Program
    const header = buildGeneralProgressSessionTableHeader({
      round: 1,
      sessionFormat: '공통 교육 예정 1',
      sessionDuration: '2시간',
      dateLabel: '2026.01.09(금)',
      sessionTimeRange: '09:20 ~ 11:10',
      program,
    })

    expect(header.headerScheduleSummary).toBe('2시간 (오프라인)')
  })
})

describe('shouldHideGiveUpParticipantFromSchedule', () => {
  it('keeps the give-up day and hides later calendar days', () => {
    expect(
      shouldHideGiveUpParticipantFromSchedule({
        giveUpAt: '2026-01-09T18:00:00+09:00',
        participantStatus: 'GIVE_UP',
        scheduleStartAt: '2026-01-09T09:20:00+09:00',
      })
    ).toBe(false)
    expect(
      shouldHideGiveUpParticipantFromSchedule({
        giveUpAt: '2026-01-09T18:00:00+09:00',
        scheduleStartAt: '2026-01-16T09:20:00+09:00',
      })
    ).toBe(true)
  })

  it('hides every schedule when status is GIVE_UP without giveUpAt', () => {
    expect(
      shouldHideGiveUpParticipantFromSchedule({
        participantStatus: 'GIVE_UP',
        scheduleStartAt: '2026-01-09T09:20:00+09:00',
      })
    ).toBe(true)
  })
})
