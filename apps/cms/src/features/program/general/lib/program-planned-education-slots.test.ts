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

  it('keeps education-slots whose origin is omitted', () => {
    const planned = mapEducationSlotsToPlannedAdminSchedules([
      {
        scheduleId: 186910,
        sessionNo: 1,
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        startAt: '2026-04-03T09:30:00+09:00',
        endAt: '2026-04-03T12:20:00+09:00',
      },
    ])
    expect(planned).toHaveLength(1)
    expect(planned[0]?.id).toBe(186910)
  })

  it('keeps education-slots whose origin is UNKNOWN', () => {
    const planned = mapEducationSlotsToPlannedAdminSchedules([
      {
        scheduleId: 186912,
        sessionNo: 1,
        scheduleOrigin: 'UNKNOWN',
        scheduleRole: 'EDUCATION',
        scheduleStatus: 'ACTIVE',
        startAt: '2026-04-03T09:30:00+09:00',
        endAt: '2026-04-03T12:20:00+09:00',
      },
    ])
    expect(planned).toHaveLength(1)
    expect(planned[0]?.id).toBe(186912)
  })

  it('reads physical id from education-slot id when scheduleId is omitted', () => {
    const mapped = mapEducationSlotToAdminScheduleShape({
      id: 186911,
      sessionNo: 2,
      scheduleOrigin: 'PROGRAM_DEFINED',
    } as never)
    expect(mapped.id).toBe(186911)
  })

  it('prefers scheduleId over loose id and maps scheduleName', () => {
    const mapped = mapEducationSlotToAdminScheduleShape({
      scheduleId: 186913,
      id: 999999,
      sessionNo: 1,
      scheduleOrigin: 'PROGRAM_DEFINED',
      scheduleName: '오리엔테이션',
    } as never)
    expect(mapped.id).toBe(186913)
    expect(mapped.scheduleName).toBe('오리엔테이션')
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
