import { describe, expect, it } from 'vitest'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import {
  scheduleIdsFromOrganizationAssignmentSlots,
  slotsFromScheduleIds,
  validateOrganizationScheduleAssignmentReplace,
} from './organization-schedule-assignment-save'

describe('organization-schedule-assignment-save', () => {
  it('maps display slots to schedule id list', () => {
    const slots: SlotResponse[] = [
      {
        scheduleId: 186905,
        organizationApplicationId: 100,
        programId: 186234,
        assignmentStatus: 'TEMP_ASSIGNED',
        active: true,
      },
      {
        scheduleId: 186906,
        organizationApplicationId: 100,
        programId: 186234,
        assignmentStatus: 'CANCELLED',
        active: true,
      },
    ]
    expect(
      scheduleIdsFromOrganizationAssignmentSlots(slots, {
        programId: '186234',
        organizationApplicationId: '100',
      })
    ).toEqual([186905])
  })

  it('builds PUT slots from schedule ids only', () => {
    expect(slotsFromScheduleIds([186905, 186907])).toEqual([
      { scheduleId: 186905 },
      { scheduleId: 186907 },
    ])
  })

  it('rejects invalid and duplicate schedule ids', () => {
    const allowed = [186905, 186907]
    expect(
      validateOrganizationScheduleAssignmentReplace({
        selectedScheduleIds: [0],
        allowedScheduleIds: allowed,
      }).ok
    ).toBe(false)
    expect(
      validateOrganizationScheduleAssignmentReplace({
        selectedScheduleIds: [186905, 186905],
        allowedScheduleIds: allowed,
      }).ok
    ).toBe(false)
    expect(
      validateOrganizationScheduleAssignmentReplace({
        selectedScheduleIds: [999],
        allowedScheduleIds: allowed,
      }).ok
    ).toBe(false)
    const ok = validateOrganizationScheduleAssignmentReplace({
      selectedScheduleIds: [186907, 186905],
      allowedScheduleIds: allowed,
    })
    expect(ok).toEqual({ ok: true, scheduleIds: [186907, 186905] })
  })
})
