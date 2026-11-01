import { describe, expect, it, vi } from 'vitest'
import {
  collectDatesOutsideBusinessPeriod,
  reportRegistrationBusinessPeriodIssuesIfAny,
} from './registration-business-period-issues'

const PERIOD = { start: '2026-11-01', end: '2026-12-31' }

describe('collectDatesOutsideBusinessPeriod', () => {
  it('T21 keeps previously entered dates and reports ones outside a shrunk period', () => {
    const issues = collectDatesOutsideBusinessPeriod(
      [
        {
          'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-10-15'],
          'recruit.instructor.interviewRangeSeal': {
            start: '2026-10-15T00:00:00.000Z',
            end: '2026-10-16T00:00:00.000Z',
          },
        },
      ],
      PERIOD
    )
    expect(issues.some(issue => issue.fieldLabel === '교육 진행 예정일')).toBe(true)
    expect(issues.some(issue => issue.fieldLabel === '면접 일정')).toBe(true)
  })

  it('does not flag the business operation period itself', () => {
    const issues = collectDatesOutsideBusinessPeriod(
      [
        {
          'generalRegistration.basicInfo.operationRangeSeal': {
            start: '2026-11-01',
            end: '2026-12-31',
          },
          'recruit.institution.programRangeSeal': {
            start: '2026-11-01',
            end: '2026-12-31',
          },
        },
      ],
      PERIOD
    )
    expect(issues).toEqual([])
  })
})

describe('reportRegistrationBusinessPeriodIssuesIfAny', () => {
  it('does not show the registration wizard business-period alert', () => {
    const showAlert = vi.fn()
    const reportIncomplete = vi.fn()
    expect(reportRegistrationBusinessPeriodIssuesIfAny({ showAlert, reportIncomplete })).toBe(false)
    expect(showAlert).not.toHaveBeenCalled()
    expect(reportIncomplete).not.toHaveBeenCalled()
  })
})
