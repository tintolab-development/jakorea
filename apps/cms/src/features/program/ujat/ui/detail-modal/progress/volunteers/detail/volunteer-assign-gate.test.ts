import { describe, expect, it } from 'vitest'
import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'
import {
  PARTNER_ONLY_ASSIGNMENT_NO_EDUCATION_SLOT_ALERT,
  isVolunteerScheduleFullyAssigned,
  resolveVolunteerAssignGate,
} from './volunteer-assign-gate'

function row(
  overrides: Partial<UjatVolunteerAssignmentProgressRow> = {}
): UjatVolunteerAssignmentProgressRow {
  return {
    id: 'row-1',
    scheduleLabel: '2026.05.08(금)',
    role: 'none',
    assignedInstitution: { kind: 'dash' },
    partner: { kind: 'dash' },
    classDisplay: { kind: 'dash' },
    attendance: { kind: 'dash' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'dash',
    isWithdrawn: false,
    scheduleId: 10,
    participantId: 7,
    ...overrides,
  }
}

describe('resolveVolunteerAssignGate', () => {
  it('선택이 1건이 아니면 배정 불가 안내를 반환한다', () => {
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: ['a', 'b'],
        rows: [row({ id: 'a' }), row({ id: 'b' })],
      })
    ).toEqual({
      ok: false,
      title: '배정 불가 안내',
      content:
        '파트너 및 교육 배정은 한 건씩 가능합니다.\n배정할 일정을 하나만 선택해 주세요',
    })
  })

  it('학급·파트너가 모두 확정된 일정은 배정 불가다', () => {
    const assigned = row({
      classDisplay: { kind: 'class', label: '1-1' },
      partner: { kind: 'name', value: '박파트너' },
      assignedInstitution: { kind: 'name', value: '제이초' },
    })
    expect(isVolunteerScheduleFullyAssigned(assigned)).toBe(true)
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: [assigned.id],
        rows: [assigned],
      })
    ).toEqual({
      ok: false,
      title: '배정 불가 안내',
      content:
        '이미 배정 완료된 일정입니다.\n배정을 변경하려면 배정 취소 후 다시 배정해 주세요.',
    })
  })

  it('학급만 있고 파트너 미정이면 모달을 연다', () => {
    const partial = row({
      classDisplay: { kind: 'class', label: '1-1' },
      partner: { kind: 'undecided' },
      assignedInstitution: { kind: 'name', value: '제이초' },
    })
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: [partial.id],
        rows: [partial],
      })
    ).toEqual({ ok: true, row: partial })
  })

  it('활동 포기 일정은 배정할 수 없다', () => {
    const withdrawn = row({
      classDisplay: { kind: 'withdrawn' },
      isWithdrawn: true,
    })
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: [withdrawn.id],
        rows: [withdrawn],
      })
    ).toMatchObject({
      ok: false,
      title: '안내',
      content: '활동 포기된 일정에는 배정할 수 없습니다.',
    })
  })

  it('학급 슬롯 없는 파트너 전용 배정은 교육 배정 불가이다', () => {
    const partnerOnly = row({
      partner: { kind: 'name', value: '백소리' },
      classDisplay: { kind: 'dash' },
      educationSlotId: null,
    })
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: [partnerOnly.id],
        rows: [partnerOnly],
      })
    ).toEqual({
      ok: false,
      title: PARTNER_ONLY_ASSIGNMENT_NO_EDUCATION_SLOT_ALERT.title,
      content: PARTNER_ONLY_ASSIGNMENT_NO_EDUCATION_SLOT_ALERT.content,
    })
  })

  it('scheduleId가 없으면 배정할 수 없다', () => {
    const missing = row({ scheduleId: undefined })
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: [missing.id],
        rows: [missing],
      })
    ).toMatchObject({
      ok: false,
      content: '일정 정보를 확인할 수 없어 배정할 수 없습니다.',
    })
  })

  it('교육 배정인데 미배정 학급이 없으면 배정 불가다', () => {
    const empty = row()
    expect(
      resolveVolunteerAssignGate({
        selectedRowKeys: [empty.id],
        rows: [empty],
        vacantClassOptionCount: 0,
      })
    ).toMatchObject({
      ok: false,
      title: '배정 불가 안내',
      content: expect.stringContaining('미배정 학급'),
    })
  })
})
