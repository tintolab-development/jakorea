import { describe, expect, it } from 'vitest'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import { organizationApprovalRefreshTargets } from './organization-application-approve-slots'
import {
  buildOrganizationApplicationApproveSchedulePayload,
  organizationApproveUnconfirmableScheduleNotice,
  listOrganizationApproveScheduleOptions,
  resolveOrganizationApproveScheduleIdsFromSelection,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  resolveOrganizationApproveSelectedScheduleId,
  getUnresolvedPreferredScheduleMessage,
  validateOrganizationApproveScheduleOptions,
} from './organization-application-approve-slots'
import { formatOrganizationPreferredScheduleLabel } from './organization-preferred-schedule-label'

function educationSlot(
  id: number,
  overrides: Partial<ProgramScheduleResponse> = {}
): ProgramScheduleResponse {
  return {
    id,
    sessionNo: 1,
    startAt: '2026-10-30T09:00:00+09:00',
    endAt: '2026-10-30T11:00:00+09:00',
    scheduleOrigin: 'PROGRAM_DEFINED',
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    allDay: false,
    ...overrides,
  }
}

describe('organization-application-approve-slots', () => {
  it('lists preferred schedules without program schedule cross-check', () => {
    const options = listOrganizationApproveScheduleOptions([
      { scheduleId: 10, startAt: '2026-01-09T01:00:00Z', endAt: '2026-01-09T02:00:00Z' },
      { label: '26년 10월 30일(금) 9:30 ~ 11:30' },
    ])
    expect(options).toHaveLength(2)
    expect(options[0]?.scheduleId).toBe(10)
    expect(options[0]?.confirmableScheduleId).toBeNull()
    expect(options[1]?.scheduleId).toBe(-2)
    expect(options[1]?.confirmableScheduleId).toBeNull()
    expect(options[1]?.label).toContain('10월 30일')
  })

  it('resolves selectedScheduleId from an explicit education slot id', () => {
    const preferred = [{ label: 'A', scheduleId: 88 }]
    const slots = [educationSlot(88)]
    expect(resolveOrganizationApproveSelectedScheduleId(preferred, 88, slots)).toBe(88)
    expect(resolveOrganizationApproveSelectedScheduleId(preferred, null, slots)).toBeUndefined()
    expect(resolveOrganizationApproveSelectedScheduleId(preferred, 88)).toBeUndefined()
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

  it('keeps an explicit education-slot id confirmable when preferred clocks differ', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [
        {
          scheduleId: 88,
          startAt: '2026-10-30T00:00:00+09:00',
          endAt: '2026-10-30T00:00:00+09:00',
          label: '희망 원문',
        },
      ],
      [educationSlot(88, { startAt: '2026-10-30T09:00:00+09:00', endAt: '2026-10-30T11:00:00+09:00' })]
    )
    expect(result.options[0]?.label).toBe('희망 원문')
    expect(result.options[0]?.confirmableScheduleId).toBe(88)
    expect(result.assignableOptions[0]?.confirmableScheduleId).toBe(88)
    expect(result.options[0]?.label).not.toContain('00:00')
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

describe('organization approval schedule mapping regression', () => {
  const slotA = educationSlot(501, {
    sessionNo: 1,
    startAt: '2026-11-02T09:00:00+09:00',
    endAt: '2026-11-02T11:00:00+09:00',
  })
  const slotB = educationSlot(502, {
    sessionNo: 2,
    startAt: '2026-11-02T13:00:00+09:00',
    endAt: '2026-11-02T15:00:00+09:00',
  })

  it('1. 희망 일정 2건에 scheduleId가 없어도 오류로 보지 않고 배정하지 않는다', () => {
    const preferred = [{ label: '1지망 10월 30일' }, { label: '2지망 11월 2일' }]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA, slotB])
    expect(result.invalidReason).toBeNull()
    expect(result.options).toHaveLength(2)
    expect(result.assignableOptions).toEqual([])
    expect(result.options.every(option => option.confirmableScheduleId == null)).toBe(true)
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [slotA, slotB],
        selectedSlotId: null,
      })
    ).toEqual({})
  })

  it('2. 날짜만 있는 희망 일정 3건은 00:00을 붙이지 않는다', () => {
    const preferred = ['2026-11-02', '2026-11-03', '2026-11-04'].map(date => ({
      startAt: date,
      endAt: date,
    }))
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA])
    expect(result.options).toHaveLength(3)
    for (const option of result.options) {
      expect(option.label).not.toContain('00:00')
      expect(option.label).toMatch(/26년 11월/)
    }
    expect(formatOrganizationPreferredScheduleLabel({
      label: '26년 11월 2일(월) 00:00 ~ 00:00',
      startAt: '2026-11-02T00:00:00+09:00',
      endAt: '2026-11-02T00:00:00+09:00',
    })).toBe('26년 11월 2일(월)')
  })

  it('3. 공통 교육 예정 슬롯 2건만 배정 후보가 된다', () => {
    const preferred = [
      { scheduleId: 501, label: '오전' },
      { scheduleId: 502, label: '오후' },
      { scheduleId: 999, label: '프로그램 밖' },
    ]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA, slotB])
    expect(result.assignableOptions.map(option => option.confirmableScheduleId)).toEqual([501, 502])
  })

  it('4. 희망 일정과 공통 슬롯이 정확히 일치하면 그 슬롯만 승인 payload에 넣는다', () => {
    const preferred = [
      {
        scheduleId: 501,
        label: '오전 희망',
        startAt: slotA.startAt,
        endAt: slotA.endAt,
      },
    ]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA, slotB])
    expect(result.options[0]?.confirmableScheduleId).toBe(501)
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [slotA, slotB],
        selectedSlotId: 501,
      })
    ).toEqual({ selectedScheduleId: 501 })
  })

  it('5. 희망 일정과 공통 슬롯이 불일치하면 신청 기록으로 남기고 OSA를 만들지 않는다', () => {
    const preferred = [{ scheduleId: 777, label: '다른 일정', startAt: '2026-12-01', endAt: '2026-12-01' }]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA, slotB])
    expect(result.invalidReason).toBeNull()
    expect(result.options[0]?.label).toBe('다른 일정')
    expect(result.options[0]?.confirmableScheduleId).toBeNull()
    expect(result.assignableOptions).toEqual([])
    expect(result.options[0]?.assignmentNote).toContain('프로그램 공통 교육 슬롯에 없는')
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [slotA, slotB],
        selectedSlotId: 777,
      })
    ).toEqual({})
  })

  it('6. 같은 날짜의 복수 시간 슬롯은 날짜만으로 첫 슬롯을 고르지 않는다', () => {
    const preferred = [{ label: '11월 2일', startAt: '2026-11-02', endAt: '2026-11-02' }]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA, slotB])
    expect(result.assignableOptions).toEqual([])
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [slotA, slotB],
        selectedSlotId: 501,
      })
    ).toEqual({})
  })

  it('7. 커리큘럼 복수 회차 날짜 지정은 회차별로 따로 매핑한다', () => {
    const preferred = [
      { scheduleId: 501, round: 1, label: '1회차 희망', startAt: '2026-11-02T00:00:00+09:00', endAt: '2026-11-02T00:00:00+09:00' },
      { scheduleId: 502, round: 2, label: '2회차 희망', startAt: '2026-11-02T00:00:00+09:00', endAt: '2026-11-02T00:00:00+09:00' },
    ]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [slotA, slotB])
    expect(result.options.map(option => option.label)).toEqual(['1회차 희망', '2회차 희망'])
    expect(result.assignableOptions.map(option => option.sessionNo)).toEqual([1, 2])
    expect(result.assignableOptions[0]?.label).toContain('1회차')
    expect(result.assignableOptions[1]?.label).toContain('2회차')
    expect(result.assignableOptions[0]?.label).not.toBe(result.assignableOptions[1]?.label)
    const morning = buildOrganizationApplicationApproveSchedulePayload({
      preferred,
      educationSlots: [slotA, slotB],
      selectedSlotId: 501,
    })
    expect(morning).toEqual({ selectedScheduleId: 501 })
    expect(morning).not.toHaveProperty('slots')
  })

  it('8. 선택 없이 승인하면 일정 필드를 보내지 않는다', () => {
    const preferred = [{ scheduleId: 501, label: '오전' }]
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [slotA, slotB],
        selectedSlotId: null,
      })
    ).toEqual({})
  })

  it('9. 유효한 슬롯을 선택한 승인 payload는 selectedScheduleId만 가진다', () => {
    const preferred = [{ scheduleId: 502, label: '오후' }]
    const payload = buildOrganizationApplicationApproveSchedulePayload({
      preferred,
      educationSlots: [slotA, slotB],
      selectedSlotId: 502,
    })
    expect(payload).toEqual({ selectedScheduleId: 502 })
    expect(payload).not.toHaveProperty('slots')
  })

  it('10. 다른 기관의 희망 일정으로 이 기관 슬롯을 배정하지 않는다', () => {
    const orgA = [{ scheduleId: 501, label: 'A 오전' }]
    const orgB = [{ scheduleId: 502, label: 'B 오후' }]
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: orgA,
        educationSlots: [slotA, slotB],
        selectedSlotId: 502,
      })
    ).toEqual({})
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: orgB,
        educationSlots: [slotA, slotB],
        selectedSlotId: 502,
      })
    ).toEqual({ selectedScheduleId: 502 })
    const refreshA = organizationApprovalRefreshTargets('186234', ['1001'])
    const refreshB = organizationApprovalRefreshTargets('186234', ['1002'])
    expect(refreshA.organizationScheduleAssignments).not.toEqual(
      refreshB.organizationScheduleAssignments
    )
    expect(JSON.stringify(refreshA)).not.toContain('1002')
    expect(JSON.stringify(refreshB)).not.toContain('1001')
  })

  it('11. 레거시 UNKNOWN 일정은 배정 후보가 아니다', () => {
    const unknown = educationSlot(880, { scheduleOrigin: 'UNKNOWN' })
    const preferred = [{ scheduleId: 880, label: '레거시 희망' }]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [unknown, slotA])
    expect(result.options[0]?.label).toBe('레거시 희망')
    expect(result.options[0]?.confirmableScheduleId).toBeNull()
    expect(result.assignableOptions).toEqual([])
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [unknown, slotA],
        selectedSlotId: 880,
      })
    ).toEqual({})
  })

  it('12. 승인 후 캐시 갱신 키는 해당 프로그램 슬롯과 해당 기관 OSA만 가리킨다', () => {
    const targets = organizationApprovalRefreshTargets('186234', ['1001'])
    expect(targets.educationSlots).toEqual(['general-programs', 'education-slots', '186234'])
    expect(targets.schedules).toContain('186234')
    expect(targets.organizationScheduleAssignments[0]).toEqual(
      expect.arrayContaining(['organization-schedule-assignments', '186234', '1001'])
    )
    expect(targets.organizationDetails[0]).toEqual(
      expect.arrayContaining(['organization-detail', '1001'])
    )
    expect(JSON.stringify(targets)).not.toContain('1002')
  })
})
