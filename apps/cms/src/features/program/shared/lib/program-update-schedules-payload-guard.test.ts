import { describe, expect, it } from 'vitest'
import {
  omitSchedulesFromProgramUpdateRequest,
  programUpdateRequestIncludesSchedulesPayload,
} from '@/features/program/shared/lib/program-update-schedules-payload-guard'

const timedEducationSlots = [
  {
    id: 186909,
    sessionNo: 7,
    educationSlotKey: 'c415394c-ab6c-4e91-aa62-a6dce3842073',
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    allDay: false,
    startAt: '2026-11-02T00:30:00Z',
    endAt: '2026-11-02T02:30:00Z',
  },
  {
    id: 186908,
    sessionNo: 6,
    educationSlotKey: 'be115697-2ea1-4bb0-ad6c-7aee61ab8275',
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    allDay: false,
    startAt: '2026-11-02T04:30:00Z',
    endAt: '2026-11-02T06:30:00Z',
  },
] as const

describe('program-update-schedules-payload-guard', () => {
  it('detects schedules key on empty array (BE full replace risk)', () => {
    expect(programUpdateRequestIncludesSchedulesPayload({ schedules: [] })).toBe(true)
    expect(programUpdateRequestIncludesSchedulesPayload({ title: 'x' })).toBe(false)
  })

  it('strips schedules including timed education fixture without mutating other fields', () => {
    const payload = {
      title: '프로그램',
      schedules: [...timedEducationSlots, { id: 186903, allDay: true }],
    }
    const safe = omitSchedulesFromProgramUpdateRequest(payload)
    expect(safe).toEqual({ title: '프로그램' })
    expect(programUpdateRequestIncludesSchedulesPayload(safe)).toBe(false)
  })
})
