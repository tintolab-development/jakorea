import { describe, expect, it } from 'vitest'
import {
  organizationApproveUnconfirmableScheduleNotice,
  listOrganizationApproveScheduleOptions,
  resolveOrganizationApproveScheduleIdsFromSelection,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  resolveOrganizationApproveSelectedScheduleId,
  getUnresolvedPreferredScheduleMessage,
  validateOrganizationApproveScheduleOptions,
} from './organization-application-approve-slots'

describe('organization-application-approve-slots', () => {
  it('lists preferred schedules without program schedule cross-check', () => {
    const options = listOrganizationApproveScheduleOptions([
      { scheduleId: 10, startAt: '2026-01-09T01:00:00Z', endAt: '2026-01-09T02:00:00Z' },
      { label: '26년 10월 30일(금) 9:30 ~ 11:30' },
    ])
    expect(options).toHaveLength(2)
    expect(options[0]?.scheduleId).toBe(10)
    expect(options[0]?.confirmableScheduleId).toBe(10)
    expect(options[1]?.scheduleId).toBe(-2)
    expect(options[1]?.confirmableScheduleId).toBeNull()
    expect(options[1]?.label).toContain('10월 30일')
  })

  it('resolves selectedScheduleId from materialized option id', () => {
    const preferred = [{ label: 'A', scheduleId: 88 }]
    expect(resolveOrganizationApproveSelectedScheduleId(preferred, 88)).toBe(88)
    expect(resolveOrganizationApproveSelectedScheduleId(preferred, null)).toBeUndefined()
  })

  it('does not resolve line-only placeholder to schedule id', () => {
    const preferred = [{ label: 'line only' }]
    const options = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred).options
    expect(resolveOrganizationApproveSelectedScheduleId(preferred, options[0]?.scheduleId)).toBe(
      undefined
    )
  })

  it('explains why an unresolved preferred schedule cannot be confirmed', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred([
      { label: '교육 희망일', scheduleId: null, unresolvedReason: 'AMBIGUOUS_SCHEDULE_MATCH' },
    ])
    expect(result.unresolvedReason).toBe('AMBIGUOUS_SCHEDULE_MATCH')
    expect(getUnresolvedPreferredScheduleMessage(result.unresolvedReason)).toContain('여러 개')
  })

  it('allows one preferred schedule when requestedClassCount would differ (FE does not couple)', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred([
      { scheduleId: 188901, label: 'slot A' },
    ])
    expect(result.options).toHaveLength(1)
    expect(result.invalidReason).toBeNull()
  })

  it('allows three preferred schedules independent of class count', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred([
      { scheduleId: 1, label: 'a' },
      { scheduleId: 2, label: 'b' },
      { scheduleId: 3, label: 'c' },
    ])
    expect(result.options).toHaveLength(3)
  })

  it('resolves label-only selection when preferred row has scheduleId', () => {
    const preferred = [{ label: '26년 10월 30일(금) 9:30 ~ 11:30', scheduleId: 88 }]
    const resolved = resolveOrganizationApproveScheduleIdsFromSelection(preferred, [-1])
    expect(resolved).toEqual([88])
  })

  it('exposes preferred line labels without program schedules API', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred([
      { label: '26년 10월 30일(금) 13:30 ~ 15:30' },
      { label: '26년 10월 30일(금) 9:30 ~ 11:30' },
    ])
    expect(result.invalidReason).toBeNull()
    expect(result.options).toHaveLength(2)
    expect(result.options.every(option => option.confirmableScheduleId == null)).toBe(true)
  })

  it('marks confirmable id null when program schedules mismatch preferred time', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [
        {
          scheduleId: 88,
          startAt: '2026-10-30T04:30:00Z',
          endAt: '2026-10-30T06:30:00Z',
          label: 'slot',
        },
      ],
      [
        {
          id: 88,
          startAt: '2026-10-30T00:30:00Z',
          endAt: '2026-10-30T02:30:00Z',
        },
      ]
    )
    expect(result.options[0]?.confirmableScheduleId).toBeNull()
    expect(result.options[0]?.scheduleId).toBe(88)
  })

  it('does not confirm preferred schedule when education-slots list is empty', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [{ scheduleId: 88, label: 'slot' }],
      []
    )
    expect(result.options[0]?.confirmableScheduleId).toBeNull()
  })

  it('disables unresolved preferred schedule with reason-specific notice', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [
        {
          scheduleId: null,
          label: 'slot',
          unresolvedReason: 'AMBIGUOUS_SCHEDULE_MATCH',
        },
      ],
      [{ id: 88, startAt: '2026-10-30T04:30:00Z', endAt: '2026-10-30T06:30:00Z' }]
    )
    expect(result.options[0]?.confirmableScheduleId).toBeNull()
    expect(result.options[0]?.unresolvedReason).toBe('AMBIGUOUS_SCHEDULE_MATCH')
    expect(organizationApproveUnconfirmableScheduleNotice(result.options)).toContain(
      '자동 연결할 수 없습니다'
    )
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
    expect(result.options).toEqual([
      {
        scheduleId: 88,
        label: '26년 10월 30일(금) 13:30 ~ 15:30',
        confirmableScheduleId: 88,
      },
    ])
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
    expect(result.invalidReason).toContain('희망 교육 일정')
  })
})
