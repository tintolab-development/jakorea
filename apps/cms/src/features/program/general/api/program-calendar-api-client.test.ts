import { describe, expect, it } from 'vitest'
import { buildAdminProgramCalendarRequestParams } from './program-calendar-api-client'

describe('buildAdminProgramCalendarRequestParams', () => {
  it('always sends operational flag, Seoul date range, and matching Instants', () => {
    const params = buildAdminProgramCalendarRequestParams({
      includeOperationalEvents: true,
      startDate: '2026-09-27',
      endDate: '2026-10-31',
      programType: 'GENERAL',
      programStatus: 'ALL',
    })

    expect(params.includeOperationalEvents).toBe(true)
    expect(params.myProgramsOnly).toBe(false)
    expect(params.startDate).toBe('2026-09-27')
    expect(params.endDate).toBe('2026-10-31')
    expect(params.startAt).toBe('2026-09-26T15:00:00.000Z')
    expect(params.endAt).toBe('2026-10-31T14:59:59.999Z')
    expect(params.programType).toBe('GENERAL')
    expect(params.programStatus).toBeUndefined()
    expect(params.viewType).toBeUndefined()
  })

  it('sends programStatus and viewType only when the tab is not ALL', () => {
    const params = buildAdminProgramCalendarRequestParams({
      includeOperationalEvents: true,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      programStatus: 'IN_PROGRESS',
    })
    expect(params.programStatus).toBe('IN_PROGRESS')
    expect(params.viewType).toBe('IN_PROGRESS')
  })
})
