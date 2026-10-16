import { describe, expect, it } from 'vitest'
import {
  buildOrganizationApproveSlotsForSelection,
  listOrganizationApproveScheduleOptions,
  validateOrganizationApproveScheduleOptions,
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

  it('only exposes a positive numeric id whose program schedule has the same time range', () => {
    const result = validateOrganizationApproveScheduleOptions(
      [
        {
          scheduleId: 88,
          startAt: '2026-10-30T04:30:00Z',
          endAt: '2026-10-30T06:30:00Z',
          label: '26년 10월 30일(금) 13:30 ~ 15:30',
        },
      ],
      [
        {
          id: 88,
          startAt: '2026-10-30T04:30:00Z',
          endAt: '2026-10-30T06:30:00Z',
        },
      ]
    )

    expect(result.invalidReason).toBeNull()
    expect(result.options).toEqual([{ scheduleId: 88, label: '26년 10월 30일(금) 13:30 ~ 15:30' }])
  })

  it.each([null, 'line:0', 0, -1])('rejects an unresolved schedule id: %s', scheduleId => {
    const result = validateOrganizationApproveScheduleOptions(
      [
        {
          scheduleId,
          startAt: '2026-10-30T04:30:00Z',
          endAt: '2026-10-30T06:30:00Z',
        },
      ] as never,
      []
    )

    expect(result.options).toEqual([])
    expect(result.invalidReason).toContain('승인 가능한 실제 교육 일정')
  })

  it('rejects a schedule id reused for different time ranges', () => {
    const result = validateOrganizationApproveScheduleOptions(
      [
        { scheduleId: 88, startAt: '2026-10-30T00:30:00Z', endAt: '2026-10-30T02:30:00Z' },
        { scheduleId: 88, startAt: '2026-10-30T04:30:00Z', endAt: '2026-10-30T06:30:00Z' },
      ],
      [{ id: 88, startAt: '2026-10-30T00:30:00Z', endAt: '2026-10-30T02:30:00Z' }]
    )

    expect(result.options).toEqual([])
    expect(result.duplicateScheduleIds).toEqual([88])
  })

  it('blocks duplicate grade and class names before an approval request', () => {
    expect(
      validateOrganizationApproveSlotsClient({
        sessionRound: 'single',
        slots: [
          { scheduleId: 88, grade: '1학년', className: '1반' },
          { scheduleId: 88, grade: '1학년', className: '1반' },
        ],
        allowedScheduleIds: [88],
      })
    ).toContain('중복')
  })
})
