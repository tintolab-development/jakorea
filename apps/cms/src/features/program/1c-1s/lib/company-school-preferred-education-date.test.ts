/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { normalizePreferredEducationScheduleEntry } from '@/features/program/general/lib/organization-application-preferred-education-schedules'
import { mapPreferredEducationSchedulesToSessions } from '@/features/program/general/api/adapters/general-applications-adapters'

describe('1사1교 preferredEducationSchedules educationDate', () => {
  const entry = normalizePreferredEducationScheduleEntry({
    scheduleId: null,
    scheduleIds: [],
    round: 1,
    startAt: '2026-12-22T18:00:00Z',
    endAt: '2026-12-22T19:00:00Z',
    educationDate: '2026-12-23',
    unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
  })

  it('normalizer가 educationDate를 보존한다', () => {
    expect(entry?.educationDate).toBe('2026-12-23')
  })

  it('useEducationDate면 날짜는 educationDate, 시각은 Seoul', () => {
    const [session] = mapPreferredEducationSchedulesToSessions([entry!], { useEducationDate: true })
    expect(session!.date).toBe('2026.12.23')
    expect(session!.timeRange).toContain('03:00')
  })

  it('educationDate가 없는 레거시는 startAt의 Seoul 날짜', () => {
    const legacy = { ...entry!, educationDate: null }
    const [session] = mapPreferredEducationSchedulesToSessions([legacy], { useEducationDate: true })
    expect(session!.date).toBe('2026.12.23')
  })
})
