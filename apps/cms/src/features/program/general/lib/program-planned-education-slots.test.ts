import { describe, expect, it } from 'vitest'
import {
  filterProgramSchedulesForPlannedEducationDisplay,
  mapEducationSlotToAdminScheduleShape,
  resolvePlannedEducationSlotsFromCaches,
} from '@/features/program/general/lib/program-planned-education-slots'
import {
  buildPhysicalSchedulesWithMaterializedFixture,
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

  it('excludes APPLICATION_MATERIALIZED from legacy schedules fallback', () => {
    const schedules = buildPhysicalSchedulesWithMaterializedFixture()
    const planned = filterProgramSchedulesForPlannedEducationDisplay(schedules)
    expect(planned).toHaveLength(4)
    expect(planned.some(s => s.scheduleOrigin === PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED)).toBe(
      false
    )
  })

  it('prefers education-slots cache over schedules when both present', () => {
    const fromSlots = resolvePlannedEducationSlotsFromCaches({
      educationSlots: buildPlannedEducationSlotsFixture(),
      programSchedules: buildPhysicalSchedulesWithMaterializedFixture(),
    })
    expect(fromSlots).toHaveLength(4)
  })

  it('planned count stays 4 when physical schedules include materialized row', () => {
    const fromSchedulesOnly = resolvePlannedEducationSlotsFromCaches({
      educationSlots: [],
      programSchedules: buildPhysicalSchedulesWithMaterializedFixture(),
    })
    expect(fromSchedulesOnly).toHaveLength(4)
  })
})
