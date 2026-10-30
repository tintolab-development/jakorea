import { describe, expect, it } from 'vitest'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { mapParticipantSessionsToEducationSchedules } from './map-participant-sessions-to-education-schedules'

describe('mapParticipantSessionsToEducationSchedules', () => {
  it('UTC startAt은 KST 달력일로 표시한다 (2026-10-28T19:00Z → 2026.10.29)', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { sessionNo: 1, scheduleId: 187396, startAt: '2026-10-28T19:00:00Z' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('1차시 · 2026.10.29')
  })

  it('KST 오전 9시 이후 시각은 같은 날짜를 유지한다', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { sessionNo: 2, scheduleId: 187518, startAt: '2026-10-29T00:00:00Z' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('2차시 · 2026.10.29')
  })

  it('시간대 없는 날짜 문자열은 그대로 쓴다', () => {
    const rows = mapParticipantSessionsToEducationSchedules([
      { sessionNo: 1, scheduleId: 1, startAt: '2026-10-28' } as SessionProgress,
    ])
    expect(rows[0]?.scheduleLabel).toBe('1차시 · 2026.10.28')
  })
})
