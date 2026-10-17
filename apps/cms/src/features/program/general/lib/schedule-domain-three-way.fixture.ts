import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import {
  PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED,
  PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED,
} from '@/features/program/shared/lib/program-schedule-origin'

export const THREE_WAY_PROGRAM_ID = '186234'

/** 예정 슬롯 4건 (education-slots SSOT) */
export function buildPlannedEducationSlotsFixture(): ProgramEducationSlotResponse[] {
  return [1, 2, 3, 4].map(n => ({
    scheduleId: 186880 + n,
    sessionNo: n,
    startAt: `2026-09-${10 + n}T09:00:00+09:00`,
    endAt: `2026-09-${10 + n}T11:00:00+09:00`,
    allDay: n <= 2,
    educationSlotKey: `slot-${n}`,
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    scheduleOrigin: PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED,
  }))
}

/** 물리 schedules 5+ — materialized 1건 포함 */
export function buildPhysicalSchedulesWithMaterializedFixture(): ProgramScheduleResponse[] {
  const planned = buildPlannedEducationSlotsFixture().map(slot => ({
    id: slot.scheduleId,
    sessionNo: slot.sessionNo,
    startAt: slot.startAt,
    endAt: slot.endAt,
    allDay: slot.allDay,
    educationSlotKey: slot.educationSlotKey,
    scheduleRole: slot.scheduleRole,
    scheduleStatus: slot.scheduleStatus,
    scheduleOrigin: slot.scheduleOrigin,
  }))
  return [
    ...planned,
    {
      id: 999001,
      sessionNo: 99,
      startAt: '2026-10-01T00:00:00+09:00',
      endAt: '2026-10-01T23:59:59+09:00',
      scheduleRole: 'EDUCATION',
      scheduleStatus: 'ACTIVE',
      scheduleOrigin: PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED,
    },
  ]
}

export function buildHopeSchedulesFixtureA(): PreferredEducationSchedule[] {
  return [1, 2, 3, 4].map(n => ({
    scheduleId: 186880 + n,
    label: `희망 ${n}`,
    startAt: `2026-09-${10 + n}T09:00:00+09:00`,
    endAt: `2026-09-${10 + n}T11:00:00+09:00`,
  }))
}

export function buildOsaSlotsFixtureA(): SlotResponse[] {
  return [
    {
      scheduleId: 186881,
      active: true,
      organizationApplicationId: 1001,
      programId: Number(THREE_WAY_PROGRAM_ID),
      assignmentStatus: 'CONFIRMED',
    } as SlotResponse,
  ]
}
