import { describe, expect, it } from 'vitest'
import {
  mapEducationSlotToAdminScheduleShape,
  mapEducationSlotsToPlannedAdminSchedules,
  resolvePlannedEducationSlotsFromCaches,
} from '@/features/program/general/lib/program-planned-education-slots'
import {
  buildPlannedEducationSlotsFixture,
} from '@/features/program/general/lib/schedule-domain-three-way.fixture'
import { PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED } from '@/features/program/shared/lib/program-schedule-origin'

describe('program-planned-education-slots', () => {
  it('maps education slot fields without coercing allDay', () => {
    const slot = buildPlannedEducationSlotsFixture()[0]!
    const mapped = mapEducationSlotToAdminScheduleShape(slot)
    expect(mapped.id).toBe(slot.scheduleId)
    expect(mapped.allDay).toBe(true)
    expect(mapped.educationSlotKey).toBe(slot.educationSlotKey)
    expect(mapped.startAt).toBe(slot.startAt)
  })

  it('excludes non PROGRAM_DEFINED education-slots', () => {
    const planned = mapEducationSlotsToPlannedAdminSchedules([
      ...buildPlannedEducationSlotsFixture(),
      {
        scheduleId: 999001,
        sessionNo: 99,
        scheduleOrigin: PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED,
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
      },
    ])
    expect(planned).toHaveLength(4)
    expect(planned.some(s => s.scheduleOrigin === PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED)).toBe(
      false
    )
  })

  it('uses education-slots cache only', () => {
    const fromSlots = resolvePlannedEducationSlotsFromCaches({
      educationSlots: buildPlannedEducationSlotsFixture(),
    })
    expect(fromSlots).toHaveLength(4)
  })

  it('does not fallback to schedules when education-slots is empty', () => {
    const fromEmptySlots = resolvePlannedEducationSlotsFromCaches({
      educationSlots: [],
    })
    expect(fromEmptySlots).toHaveLength(0)
  })
})
