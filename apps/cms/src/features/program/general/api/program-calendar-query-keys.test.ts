import { describe, expect, it } from 'vitest'
import { generalProgramQueryKeys } from './general-program-query-keys'
import { programCalendarQueryKeys } from './program-calendar-query-keys'

describe('programCalendarQueryKeys', () => {
  it('does not share a key prefix with the program list cache', () => {
    const calendar = programCalendarQueryKeys.list({
      includeOperationalEvents: true,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      programType: 'GENERAL',
      programStatus: 'IN_PROGRESS',
    })
    const list = generalProgramQueryKeys.list('in_progress')

    expect(calendar[0]).toBe('cms')
    expect(calendar[1]).toBe('programs')
    expect(calendar[2]).toBe('calendar')
    expect(list[0]).toBe('general-programs')
    expect(JSON.stringify(calendar)).not.toBe(JSON.stringify(list))
  })
})
