import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'

/** members-permission-table.config 신청 시기 클라와 동일 규칙 */
function filterByAppliedAtRange(
  rows: Pick<MemberPermissionApplicationRow, 'id' | 'appliedAt'>[],
  fromStr: string | null,
  toStr: string | null
) {
  if (!fromStr && !toStr) return rows
  const from = fromStr ? dayjs(fromStr).startOf('day') : null
  const to = toStr ? dayjs(toStr).endOf('day') : null
  return rows.filter(r => {
    const d = dayjs(r.appliedAt)
    if (!d.isValid()) return false
    if (from?.isValid() && d.isBefore(from)) return false
    if (to?.isValid() && d.isAfter(to)) return false
    return true
  })
}

describe('instructor permission appliedAt date filter', () => {
  const rows = [
    { id: '1', appliedAt: '2026-09-16T10:21:19.885856Z' },
    { id: '2', appliedAt: '2026-09-11T06:13:17.798639Z' },
    { id: '3', appliedAt: '2026-08-01T00:00:00.000Z' },
  ]

  it('includes ISO requestedAt that falls on the selected local calendar day', () => {
    expect(filterByAppliedAtRange(rows, '2026-09-16', '2026-09-16').map(r => r.id)).toEqual([
      '1',
    ])
  })

  it('includes range spanning multiple days', () => {
    expect(filterByAppliedAtRange(rows, '2026-09-11', '2026-09-16').map(r => r.id)).toEqual([
      '1',
      '2',
    ])
  })

  it('excludes dates outside the range', () => {
    expect(filterByAppliedAtRange(rows, '2026-09-01', '2026-09-10').map(r => r.id)).toEqual([])
  })
})
