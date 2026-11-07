import { describe, expect, it } from 'vitest'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { mapParticipantSessionsToEducationSchedules } from './map-participant-sessions-to-education-schedules'

describe('mapParticipantSessionsToEducationSchedules', () => {
  it('UTC startAt은 KST 달력일로 표시한다 (2026-10-28T19:00Z → 2026.10.29)', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { sessionNo: 1, scheduleId: 187396, startAt: '2026-10-28T19:00:00Z' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('1회차 · 2026.10.29')
  })

  it('KST 오전 9시 이후 시각은 같은 날짜를 유지한다', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { sessionNo: 2, scheduleId: 187518, startAt: '2026-10-29T00:00:00Z' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('2회차 · 2026.10.29')
  })

  it('시간대 없는 날짜 문자열은 그대로 쓴다', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { sessionNo: 1, scheduleId: 1, startAt: '2026-10-28' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('1회차 · 2026.10.28')
  })

  it('사전교육은 회차 번호 대신 사전교육으로 표시한다', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      {
        sessionNo: 1,
        scheduleId: 2,
        startAt: '2026-10-28T19:00:00Z',
        scheduleRole: 'PRE_EDUCATION',
        educationSlotKey: 'general-pre-education:1',
        scheduleName: '사전 교육',
      } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('사전교육 · 2026.10.29')
    expect(rows[0]?.scheduleLabel).not.toContain('1회차')
  })

  it('회차가 없으면 인덱스로 교육 일정 번호를 만들지 않는다', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { scheduleId: 3, startAt: '2026-10-28' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('2026.10.28')
  })
})
