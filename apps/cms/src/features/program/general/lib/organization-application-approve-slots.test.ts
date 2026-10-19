import { describe, expect, it } from 'vitest'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import { organizationApprovalRefreshTargets } from './organization-application-approve-slots'
import {
  ABSENT_PREFERRED_SCHEDULE_MESSAGE,
  allowsMultipleOrganizationEducationScheduleAssignment,
  buildOrganizationApplicationApproveSchedulePayload,
  organizationApproveUnconfirmableScheduleNotice,
  listOrganizationApproveScheduleOptions,
  ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT,
  ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT,
  organizationEducationScheduleAssignmentHint,
  PERIOD_ORGANIZATION_APPROVE_DEFERRED_ASSIGNMENT_MESSAGE,
  resolveOrganizationApproveScheduleIdsFromSelection,
  resolveOrganizationApproveScheduleOptionsFromPreferred,
  resolveOrganizationScheduleMultiAutoAssign,
  resolveOrganizationApproveSelectedScheduleId,
  selectOrganizationApprovePreferredSchedules,
  getUnresolvedPreferredScheduleMessage,
  validateOrganizationApproveScheduleOptions,
} from './organization-application-approve-slots'
import {
  formatCmsScheduleDisplayLabel,
  formatOrganizationApproveScheduleCard,
  formatOrganizationPreferredScheduleLabel,
  formatOrganizationScheduleRangeLabel,
} from './organization-preferred-schedule-label'

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
    expect(options[1]?.label).toBe('2026. 10. 30(금) 09:30 ~ 11:30')
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
    expect(result.options[0]?.label).toBe('2026. 10. 30(금)')
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
        label: '2026. 10. 30(금) 13:30 ~ 15:30',
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
      expect(option.label).toMatch(/2026\. 11\./)
    }
    expect(formatOrganizationPreferredScheduleLabel({
      label: '26년 11월 2일(월) 00:00 ~ 00:00',
      startAt: '2026-11-02T00:00:00+09:00',
      endAt: '2026-11-02T00:00:00+09:00',
    })).toBe('2026. 11. 02(월)')
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
    expect(result.options[0]?.label).toBe('2026. 12. 01(화)')
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
    expect(result.options.map(option => option.label)).toEqual(['2026. 11. 02(월)', '2026. 11. 02(월)'])
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

describe('period organization approval does not use date-slot mapping', () => {
  const templateSlot = educationSlot(701, {
    sessionNo: 1,
    startAt: '2026-11-05T09:00:00+09:00',
    endAt: '2026-11-05T11:00:00+09:00',
  })
  const periodPreferred = [
    {
      scheduleId: null,
      label: '2026-11-09',
      startAt: '2026-11-09',
      endAt: '2026-11-09',
      unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
    },
    {
      scheduleId: null,
      label: '2026-11-11',
      startAt: '2026-11-11',
      endAt: '2026-11-11',
      unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
    },
  ]

  it('일정형·단일·기간 — 희망일을 공통 슬롯 누락으로 보지 않고 배정 id를 만들지 않는다', () => {
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      periodPreferred,
      [templateSlot],
      'period'
    )
    expect(result.invalidReason).toBeNull()
    expect(result.assignmentPolicy).toBe('approve_then_osa')
    expect(result.options.map(option => option.label)).toEqual([
      '2026. 11. 09(월)',
      '2026. 11. 11(수)',
    ])
    expect(result.assignableOptions).toEqual([])
    expect(result.options.every(option => option.assignmentNote == null)).toBe(true)
    expect(result.options.every(option => option.confirmableScheduleId == null)).toBe(true)
    expect(result.unresolvedReason).toBeNull()
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: periodPreferred,
        educationSlots: [templateSlot],
        selectedSlotId: 701,
        educationScheduleMode: 'period',
      })
    ).toEqual({})
    expect(PERIOD_ORGANIZATION_APPROVE_DEFERRED_ASSIGNMENT_MESSAGE).toContain(
      '프로그램 공통 예정 슬롯과 매칭하지 않습니다'
    )
  })

  it('일정형·단일·날짜 — 명시 scheduleId만 공통 슬롯으로 확정한다', () => {
    const preferred = [
      { scheduleId: 701, label: '2026-11-05 오전' },
      {
        scheduleId: null,
        label: '연결 없음',
        unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' as const,
      },
    ]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      preferred,
      [templateSlot],
      'date'
    )
    expect(result.assignmentPolicy).toBe('program_defined_slot')
    expect(result.assignableOptions.map(option => option.confirmableScheduleId)).toEqual([701])
    expect(result.options[1]?.assignmentNote).toContain('연결된 공통 교육 슬롯이 없습니다')
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: [templateSlot],
        selectedSlotId: 701,
        educationScheduleMode: 'date',
      })
    ).toEqual({ selectedScheduleId: 701 })
  })

  it.each([
    ['커리큘럼·단일·기간', 'period'],
    ['복수 회차·기간', 'period'],
  ] as const)('%s — 희망 0건은 오류, 1건·복수는 슬롯 비교 없이 승인만', (_label, mode) => {
    expect(
      resolveOrganizationApproveScheduleOptionsFromPreferred([], [templateSlot], mode).invalidReason
    ).toContain('희망 교육 일정')
    const one = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [{ label: '2026-11-09', startAt: '2026-11-09', endAt: '2026-11-09' }],
      [templateSlot],
      mode
    )
    const many = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [
        { label: '1지망', round: 1, startAt: '2026-11-09', endAt: '2026-11-09' },
        { label: '2지망', round: 2, startAt: '2026-11-11', endAt: '2026-11-11' },
      ],
      [templateSlot, educationSlot(702, { sessionNo: 2 })],
      mode
    )
    expect(one.assignableOptions).toEqual([])
    expect(one.options[0]?.label).toBe('2026. 11. 09(월)')
    expect(many.options).toHaveLength(2)
    expect(many.assignableOptions).toEqual([])
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: many.options.map(option => ({ label: option.label })),
        educationSlots: [templateSlot],
        selectedSlotId: null,
        educationScheduleMode: mode,
      })
    ).toEqual({})
  })

  it('커리큘럼·단일·날짜와 복수 회차·날짜는 회차 슬롯 매핑을 유지한다', () => {
    const slots = [
      educationSlot(801, { sessionNo: 1 }),
      educationSlot(802, { sessionNo: 2 }),
    ]
    const preferred = [
      { scheduleId: 801, round: 1, label: '1회차' },
      { scheduleId: 802, round: 2, label: '2회차' },
    ]
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, slots, 'date')
    expect(result.assignableOptions.map(option => option.sessionNo)).toEqual([1, 2])
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: slots,
        selectedSlotId: 802,
      })
    ).toEqual({ selectedScheduleId: 802 })
  })

  it('공통 슬롯이 없어도 기간 희망일 원본은 남고, 날짜형은 배정하지 않는다', () => {
    const preferred = [{ label: '2026-11-09', startAt: '2026-11-09', endAt: '2026-11-09' }]
    const period = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [], 'period')
    const date = resolveOrganizationApproveScheduleOptionsFromPreferred(preferred, [], 'date')
    expect(period.options).toHaveLength(1)
    expect(period.assignableOptions).toEqual([])
    expect(period.assignmentPolicy).toBe('approve_then_osa')
    expect(date.options).toHaveLength(1)
    expect(date.assignableOptions).toEqual([])
    expect(date.options[0]?.assignmentNote).toContain('연결되지 않은')
  })

  it('복수 회차와 기간 지정 최대 일정 2개 이상은 여러 일정 배정 문구를 쓴다', () => {
    expect(
      organizationEducationScheduleAssignmentHint({
        sessionRound: 'multi',
        educationScheduleMode: 'date',
      })
    ).toBe(ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT)
    expect(
      allowsMultipleOrganizationEducationScheduleAssignment({
        sessionRound: 'single',
        educationScheduleMode: 'period',
        maxScheduleCount: 2,
      })
    ).toBe(true)
  })

  it('단일 회차 날짜 지정과 최대 일정 1개는 한 일정 배정 문구를 쓴다', () => {
    expect(
      organizationEducationScheduleAssignmentHint({
        sessionRound: 'single',
        educationScheduleMode: 'date',
        maxScheduleCount: 4,
      })
    ).toBe(ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT)
    expect(
      organizationEducationScheduleAssignmentHint({
        sessionRound: 'single',
        educationScheduleMode: 'period',
        maxScheduleCount: 1,
      })
    ).toBe(ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT)
  })

  it('여러 공통 슬롯을 고르면 slots만 보내고 selectedScheduleId는 보내지 않는다', () => {
    const slots = [educationSlot(501), educationSlot(502, { sessionNo: 2 })]
    const preferred = [
      { scheduleId: 501, label: '1회차' },
      { scheduleId: 502, label: '2회차' },
    ]
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: slots,
        selectedSlotIds: [501, 502],
      })
    ).toEqual({ slots: [{ scheduleId: 501 }, { scheduleId: 502 }] })
  })

  it('희망 일정 카드는 시각과 지망·차시를 나눈다', () => {
    expect(
      formatOrganizationApproveScheduleCard({
        label: '2지망 | 2차시',
        startAt: '2026-04-27T13:00:00+09:00',
        endAt: '2026-04-27T15:50:00+09:00',
      })
    ).toEqual({
      title: '2026. 04. 27(월) 13:00 ~ 15:50',
      detail: '2지망 | 2차시',
    })
    expect(
      formatOrganizationApproveScheduleCard({
        label: '2차시',
        startAt: '2026-04-20T09:30:00+09:00',
        endAt: '2026-04-20T12:20:00+09:00',
      }).detail
    ).toBe('2차시')
  })

  it('기간 지정은 희망 차시 칸이 있을 때만 sessionCount를 둘째 줄에 둔다', () => {
    expect(
      formatOrganizationApproveScheduleCard({
        label: '2026-04-20',
        startAt: '2026-04-20T09:30:00+09:00',
        endAt: '2026-04-20T12:20:00+09:00',
        educationScheduleMode: 'period',
        educationStructure: 'schedule',
        sessionRound: 'single',
        preferenceOrder: 1,
        sessionCount: 1,
      })
    ).toEqual({
      title: '2026. 04. 20(월) 09:30 ~ 12:20',
        detail: '1지망',
    })
    expect(
      formatOrganizationApproveScheduleCard({
        label: '1지망 | 1차시',
        startAt: '2026-11-09',
        endAt: '2026-11-09',
        educationScheduleMode: 'period',
        educationStructure: 'schedule',
        sessionRound: 'single',
        sessionCount: 1,
      }).detail
    ).toBe('1지망')
    expect(
      formatOrganizationApproveScheduleCard({
        label: '2026-04-20',
        startAt: '2026-04-20T09:30:00+09:00',
        endAt: '2026-04-20T12:20:00+09:00',
        educationScheduleMode: 'period',
        educationStructure: 'curriculum',
        sessionRound: 'single',
        preferenceOrder: 2,
        sessionCount: 2,
      })
    ).toEqual({
      title: '2026. 04. 20(월) 09:30 ~ 12:20',
      detail: '2지망 | 2차시',
    })
    expect(
      formatOrganizationApproveScheduleCard({
        label: '3차시',
        startAt: '2026-04-20T09:30:00+09:00',
        endAt: '2026-04-20T12:20:00+09:00',
        educationScheduleMode: 'period',
        educationStructure: 'curriculum',
        sessionRound: 'single',
        preferenceOrder: 1,
        sessionCount: 2,
      }).detail
    ).toBe('1지망 | 3차시')
  })

  it('커리큘럼 단일 날짜는 프로그램 일일 차시를 붙인다', () => {
    expect(
      formatOrganizationApproveScheduleCard({
        label: '26년 4월 20일(월) 09:30 ~ 12:20',
        startAt: '2026-04-20T09:30:00+09:00',
        endAt: '2026-04-20T12:20:00+09:00',
        educationScheduleMode: 'date',
        educationStructure: 'curriculum',
        sessionRound: 'single',
        curriculumChartSessionCount: 2,
      })
    ).toEqual({
      title: '2026. 04. 20(월) 09:30 ~ 12:20',
      detail: '2차시',
    })
    expect(
      formatOrganizationApproveScheduleCard({
        label: '3차시',
        startAt: '2026-04-20T09:30:00+09:00',
        endAt: '2026-04-20T12:20:00+09:00',
        educationScheduleMode: 'date',
        educationStructure: 'curriculum',
        sessionRound: 'single',
        curriculumChartSessionCount: 2,
      }).detail
    ).toBe('3차시')
  })

  it('일정형 단일 기간은 차시가 없으면 둘째 줄을 비운다', () => {
    expect(
      formatOrganizationApproveScheduleCard({
        label: '2026-11-02',
        startAt: '2026-11-02',
        endAt: '2026-11-02',
        educationScheduleMode: 'period',
        educationStructure: 'schedule',
        sessionRound: 'single',
        curriculumChartSessionCount: 2,
      })
    ).toEqual({
      title: '2026. 11. 02(월)',
      detail: '',
    })
  })
})

describe('schedule multi auto-assigns every education slot', () => {
  it('시작 시각 순으로 여러 건은 slots, 한 건은 selectedScheduleId', () => {
    const reversed = [
      educationSlot(187135, {
        sessionNo: 2,
        startAt: '2026-11-09T04:30:00Z',
        endAt: '2026-11-09T07:00:00Z',
      }),
      educationSlot(187134, {
        sessionNo: undefined,
        startAt: '2026-11-02T01:00:00Z',
        endAt: '2026-11-02T03:00:00Z',
      }),
    ]
    const many = resolveOrganizationScheduleMultiAutoAssign(reversed)
    expect(many.items.map(item => item.scheduleId)).toEqual([187134, 187135])
    expect(many.payload).toEqual({
      slots: [{ scheduleId: 187134 }, { scheduleId: 187135 }],
    })
    expect(many.payload).not.toHaveProperty('selectedScheduleId')
    expect(many.items.map(item => item.label).join(' ')).not.toContain('00:00')
    expect(many.items.map(item => item.label).join(' ')).not.toContain('회차')
    expect(many.items[1]?.label).toBe('2026. 11. 09(월) 13:30 ~ 16:00')

    const one = resolveOrganizationScheduleMultiAutoAssign([reversed[1]!])
    expect(one.payload).toEqual({ selectedScheduleId: 187134 })
    expect(one.payload).not.toHaveProperty('slots')

    expect(resolveOrganizationScheduleMultiAutoAssign([])).toEqual({ items: [], payload: {} })
    expect(resolveOrganizationScheduleMultiAutoAssign(undefined)).toEqual({
      items: [],
      payload: {},
    })
  })
})

describe('general organization approval keeps three schedule sources apart', () => {
  const commonSlots = [
    educationSlot(187134, {
      sessionNo: undefined,
      startAt: '2026-11-02T01:00:00Z',
      endAt: '2026-11-02T03:00:00Z',
    }),
    educationSlot(187135, {
      sessionNo: 2,
      startAt: '2026-11-09T04:30:00Z',
      endAt: '2026-11-09T07:00:00Z',
    }),
  ]

  it('186266 — 희망 일정이 비어 있으면 공통 슬롯을 희망·배정으로 만들지 않는다', () => {
    const preferred: [] = []
    const before = JSON.stringify(preferred)
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      preferred,
      commonSlots,
      'date',
      []
    )
    expect(JSON.stringify(preferred)).toBe(before)
    expect(result.options).toEqual([])
    expect(result.assignableOptions).toEqual([])
    expect(result.commonSlotOptions.map(option => option.scheduleId)).toEqual([187134, 187135])
    expect(result.commonSlotOptions.every(option => option.confirmableScheduleId == null)).toBe(true)
    expect(result.commonSlotOptions.map(option => option.label).join(' ')).not.toContain('00:00')
    expect(result.invalidReason).toBe(ABSENT_PREFERRED_SCHEDULE_MESSAGE)
    expect(result.invalidReason).not.toContain('표시할 수 없습니다')
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: commonSlots,
        selectedSlotId: 187134,
        educationScheduleMode: 'date',
      })
    ).toEqual({ selectedScheduleId: 187134 })
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: commonSlots,
        selectedSlotIds: [187134, 187135],
        educationScheduleMode: 'date',
      })
    ).toEqual({ slots: [{ scheduleId: 187134 }, { scheduleId: 187135 }] })
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred,
        educationSlots: commonSlots,
        selectedSlotId: 999,
        educationScheduleMode: 'date',
      })
    ).toEqual({})
  })

  it('requested-schedules는 상세 희망이 없을 때만 쓰고 행 id를 scheduleId로 쓰지 않는다', () => {
    const fromRequested = selectOrganizationApprovePreferredSchedules([], [
      {
        id: 999001,
        preferenceOrder: 1,
        requestedDate: '2026-11-09',
        resolvedScheduleId: undefined,
        sessionTimes: [{ startTime: '00:00', endTime: '00:00' }],
      },
    ])
    expect(fromRequested[0]?.scheduleId).toBeNull()
    expect(fromRequested[0]?.label).not.toContain('00:00')
    expect(fromRequested[0]?.label).toContain('2026-11-09')

    const matched = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [],
      commonSlots,
      'date',
      [
        {
          id: 42,
          preferenceOrder: 2,
          requestedDate: '2026-11-09',
          resolvedScheduleId: 187135,
          sessionCount: 2,
        },
      ]
    )
    expect(matched.options[0]?.confirmableScheduleId).toBe(187135)
    expect(matched.options[0]?.label).toBe('2026. 11. 09(월)')
    expect(matched.options[0]?.label).not.toContain('차시')
    const requestedPreferred = selectOrganizationApprovePreferredSchedules([], [
      {
        id: 42,
        preferenceOrder: 2,
        requestedDate: '2026-11-09',
        resolvedScheduleId: 187135,
        sessionCount: 2,
      },
    ])
    expect(requestedPreferred[0]?.label).toContain('2지망')
    expect(
      formatOrganizationApproveScheduleCard({
        label: requestedPreferred[0]?.label,
        startAt: requestedPreferred[0]?.startAt,
        endAt: requestedPreferred[0]?.endAt,
      }).detail
    ).toContain('2지망')
    expect(matched.assignableOptions.map(option => option.scheduleId)).toEqual([187135])
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: selectOrganizationApprovePreferredSchedules([], [
          { id: 42, resolvedScheduleId: 187135, requestedDate: '2026-11-09' },
        ]),
        educationSlots: commonSlots,
        selectedSlotId: 42,
      })
    ).toEqual({})
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: selectOrganizationApprovePreferredSchedules([], [
          { id: 42, resolvedScheduleId: 187135, requestedDate: '2026-11-09' },
        ]),
        educationSlots: commonSlots,
        selectedSlotId: 187135,
      })
    ).toEqual({ selectedScheduleId: 187135 })
  })

  it('상세 희망 일정이 있으면 requested-schedules로 덮지 않는다', () => {
    const detail = [{ scheduleId: null, label: '신청 원문 11월 2일' }]
    const selected = selectOrganizationApprovePreferredSchedules(detail, [
      { id: 1, requestedDate: '2026-12-01', resolvedScheduleId: 187134 },
    ])
    expect(selected).toEqual(detail)
  })

  it.each([
    ['기관/일정형/단일/날짜', 'date', [{ scheduleId: 187134, label: '11월 2일 10:00 ~ 12:00' }]],
    [
      '기관/일정형/단일/기간',
      'period',
      [{ label: '2026-11-09', startAt: '2026-11-09', endAt: '2026-11-09' }],
    ],
    ['기관/일정형/복수/날짜', 'date', []],
    ['기관/일정형/복수/기간', 'period', []],
    [
      '기관/커리큘럼형/단일/날짜',
      'date',
      [{ scheduleId: 187135, round: 1, label: '1회차 11월 9일' }],
    ],
    [
      '기관/커리큘럼형/단일/기간',
      'period',
      [{ label: '1지망', round: 1, startAt: '2026-11-09', endAt: '2026-11-09' }],
    ],
    [
      '기관/커리큘럼형/복수/날짜',
      'date',
      [
        { scheduleId: 187134, round: 1, label: '1회차' },
        { scheduleId: 187135, round: 2, label: '2회차' },
      ],
    ],
    [
      '기관/커리큘럼형/복수/기간',
      'period',
      [
        { label: '1지망 2차시', round: 1, startAt: '2026-11-02', endAt: '2026-11-02' },
        { label: '2지망 2차시', round: 2, startAt: '2026-11-09', endAt: '2026-11-09' },
      ],
    ],
  ] as const)('%s — 희망·공통 예정·배정 후보를 섞지 않는다', (_name, mode, preferred) => {
    const before = JSON.stringify(preferred)
    const result = resolveOrganizationApproveScheduleOptionsFromPreferred(
      [...preferred],
      commonSlots,
      mode
    )
    expect(JSON.stringify(preferred)).toBe(before)
    expect(result.commonSlotOptions.map(option => option.scheduleId)).toEqual([187134, 187135])
    expect(result.commonSlotOptions.every(option => option.preferredRecord === false)).toBe(true)
    if (preferred.length === 0) {
      expect(result.options).toEqual([])
      expect(result.assignableOptions).toEqual([])
      expect(result.invalidReason).toBe(ABSENT_PREFERRED_SCHEDULE_MESSAGE)
    } else {
      expect(result.options.map(option => option.label)).toEqual(
        preferred.map(item => formatOrganizationPreferredScheduleLabel(item))
      )
      expect(result.invalidReason).toBeNull()
    }
    if (mode === 'period') {
      expect(result.assignmentPolicy).toBe('approve_then_osa')
      expect(result.assignableOptions).toEqual([])
      expect(
        buildOrganizationApplicationApproveSchedulePayload({
          preferred: [...preferred],
          educationSlots: commonSlots,
          selectedSlotIds: [187134, 187135],
          educationScheduleMode: 'period',
        })
      ).toEqual({})
      return
    }
    const confirmable: number[] = []
    for (const item of preferred) {
      if ('scheduleId' in item && typeof item.scheduleId === 'number') {
        confirmable.push(item.scheduleId)
      }
    }
    expect(result.assignableOptions.map(option => option.confirmableScheduleId)).toEqual(confirmable)
    if (confirmable.length === 1) {
      expect(
        buildOrganizationApplicationApproveSchedulePayload({
          preferred: [...preferred],
          educationSlots: commonSlots,
          selectedSlotId: confirmable[0],
          educationScheduleMode: 'date',
        })
      ).toEqual({ selectedScheduleId: confirmable[0] })
    }
    expect(
      buildOrganizationApplicationApproveSchedulePayload({
        preferred: [...preferred],
        educationSlots: commonSlots,
        selectedSlotId: null,
        educationScheduleMode: 'date',
      })
    ).toEqual({})
  })
})

describe('cms schedule display format', () => {
  it('날짜만, 같은 날, 다른 날을 2026. 01. 09(금) 계열로 만든다', () => {
    expect(formatOrganizationScheduleRangeLabel('2026-01-09', '2026-01-09')).toBe('2026. 01. 09(금)')
    expect(
      formatOrganizationScheduleRangeLabel('2026-01-09T09:20:00+09:00', '2026-01-09T11:20:00+09:00')
    ).toBe('2026. 01. 09(금) 09:20 ~ 11:20')
    expect(
      formatOrganizationScheduleRangeLabel('2026-01-09T09:20:00+09:00', '2026-01-10T11:20:00+09:00')
    ).toBe('2026. 01. 09(금) 09:20 ~ 2026. 01. 10(토) 11:20')
  })

  it('시각 없는 기간은 양쪽 날짜만 보여 준다', () => {
    expect(formatOrganizationScheduleRangeLabel('2026-10-28', '2026-11-12')).toBe(
      '2026. 10. 28(수) ~ 2026. 11. 12(목)'
    )
  })

  it('ISO 날짜와 두 자리 점 표기도 같은 형식으로 바꾼다', () => {
    expect(formatCmsScheduleDisplayLabel('2026-11-05')).toBe('2026. 11. 05(목)')
    expect(formatCmsScheduleDisplayLabel('2026-11-05 ~ 2026-11-13')).toBe(
      '2026. 11. 05(목) ~ 2026. 11. 13(금)'
    )
    expect(formatCmsScheduleDisplayLabel('26.11.05(목)')).toBe('2026. 11. 05(목)')
  })

  it('한글 표기와 공백 없는 점 표기는 표시할 때만 바꾸고 차시 접미사는 남긴다', () => {
    expect(formatCmsScheduleDisplayLabel('26년 4월 20일(월) 9:30 ~ 12:20')).toBe(
      '2026. 04. 20(월) 09:30 ~ 12:20'
    )
    expect(formatCmsScheduleDisplayLabel('2026.04.20(월) 09:30 ~ 12:20 | 1차시')).toBe(
      '2026. 04. 20(월) 09:30 ~ 12:20 | 1차시'
    )
    expect(formatOrganizationPreferredScheduleLabel({ label: '오전' })).toBe('오전')
  })
})
