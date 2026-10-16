import { describe, expect, it } from 'vitest'
import {
  buildOrganizationApproveSlotsForSelection,
  listOrganizationApproveScheduleOptions,
  validateOrganizationApproveSlotsClient,
} from './organization-application-approve-slots'

describe('organization-application-approve-slots', () => {
  it('lists only resolvable preferred schedules', () => {
    const options = listOrganizationApproveScheduleOptions([
      { scheduleId: 10, startAt: '2026-01-09T01:00:00Z', endAt: '2026-01-09T02:00:00Z' },
      { label: 'line:1' },
    ])
    expect(options).toHaveLength(1)
    expect(options[0]?.scheduleId).toBe(10)
  })

  it('builds multi-class slots for single session round', () => {
    const slots = buildOrganizationApproveSlotsForSelection({
      sessionRound: 'single',
      selectedScheduleIds: [88],
      educationGrade: '3학년',
      classCount: 2,
    })
    expect(slots).toEqual([
      { scheduleId: 88, grade: '3학년', className: '1반' },
      { scheduleId: 88, grade: '3학년', className: '2반' },
    ])
  })

  it('builds one slot per schedule for multi session round', () => {
    const slots = buildOrganizationApproveSlotsForSelection({
      sessionRound: 'multi',
      selectedScheduleIds: [1, 2],
      educationGrade: '3학년',
      classCount: 2,
    })
    expect(slots).toEqual([
      { scheduleId: 1, grade: '3학년', className: '1반' },
      { scheduleId: 2, grade: '3학년', className: '1반' },
    ])
  })

  it('rejects two distinct schedules on single round', () => {
    const message = validateOrganizationApproveSlotsClient({
      sessionRound: 'single',
      slots: [
        { scheduleId: 1, grade: '3학년', className: '1반' },
        { scheduleId: 2, grade: '3학년', className: '1반' },
      ],
      allowedScheduleIds: [1, 2],
    })
    expect(message).toContain('단일 회차')
  })
})
