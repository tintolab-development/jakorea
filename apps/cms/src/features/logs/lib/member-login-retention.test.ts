import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { listMockMemberLoginLogs } from '@/data/mock/member-login-logs'
import type { MemberLoginLog } from '@/types/member-login-log'
import {
  filterMemberLoginLogsByRetention,
  isMemberLoginLogWithinRetention,
  memberLoginRetentionCutoff,
} from './member-login-retention'

function row(id: string, loggedAt: string): MemberLoginLog {
  return {
    id,
    adminName: '홍길동',
    loginId: 'admin@jakorea.org',
    loggedAt,
    ipAddress: '14.90.80.100',
  }
}

describe('member-login-retention', () => {
  const now = dayjs('2026-08-24T12:00:00')

  it('keeps logs from the retention cutoff onward', () => {
    const cutoff = memberLoginRetentionCutoff(now)
    expect(isMemberLoginLogWithinRetention(cutoff.toISOString(), now)).toBe(true)
    expect(
      isMemberLoginLogWithinRetention(cutoff.add(1, 'minute').toISOString(), now)
    ).toBe(true)
  })

  it('drops logs older than one month and invalid timestamps', () => {
    const cutoff = memberLoginRetentionCutoff(now)
    expect(
      isMemberLoginLogWithinRetention(cutoff.subtract(1, 'minute').toISOString(), now)
    ).toBe(false)
    expect(isMemberLoginLogWithinRetention('not-a-date', now)).toBe(false)
  })

  it('filters a list to retained rows only', () => {
    const kept = row('in', now.subtract(10, 'day').toISOString())
    const dropped = row('out', now.subtract(2, 'month').toISOString())
    expect(filterMemberLoginLogsByRetention([kept, dropped], now)).toEqual([kept])
  })

  it('keeps the mock seed inside the one-month window', () => {
    const rows = listMockMemberLoginLogs()
    expect(rows).toHaveLength(130)
    expect(filterMemberLoginLogsByRetention(rows)).toHaveLength(130)
  })
})
