import { describe, expect, it } from 'vitest'
import { resolveInstructorAssignmentScheduleId } from './resolve-instructor-assignment-schedule-id'

const timedA = {
  id: 186896,
  startAt: '2026-10-30T04:30:00.000Z',
  endAt: '2026-10-30T06:30:00.000Z',
  allDay: false,
}
const timedB = {
  id: 186897,
  startAt: '2026-10-30T00:30:00.000Z',
  endAt: '2026-10-30T02:30:00.000Z',
  allDay: false,
}
const allDay = {
  id: 186892,
  startAt: '2026-10-30T00:00:00.000Z',
  endAt: '2026-10-30T23:59:00.000Z',
  allDay: true,
}

describe('resolveInstructorAssignmentScheduleId', () => {
  it('날짜만 같고 시간이 없으면 자동 선택하지 않는다', () => {
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [allDay, timedA, timedB],
        hopeDateOrLine: '2026. 10. 30',
      })
    ).toBeNull()
  })

  it('시간 범위가 유일하게 일치하면 해당 scheduleId를 반환한다', () => {
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [allDay, timedA, timedB],
        preferredStartAt: timedA.startAt,
        preferredEndAt: timedA.endAt,
      })
    ).toBe(186896)
  })

  it('resolvedScheduleId가 프로그램 일정과 시간이 맞으면 유지한다', () => {
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [allDay, timedA, timedB],
        resolvedScheduleId: 186897,
        preferredStartAt: timedB.startAt,
        preferredEndAt: timedB.endAt,
      })
    ).toBe(186897)
  })

  it('resolvedScheduleId 시간이 불일치하면 null', () => {
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [allDay, timedA, timedB],
        resolvedScheduleId: 186892,
        preferredStartAt: timedA.startAt,
        preferredEndAt: timedA.endAt,
      })
    ).toBeNull()
  })

  it('동일 시간대 후보가 여러 개면 null', () => {
    const duplicate = { ...timedA, id: 999 }
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [timedA, duplicate],
        preferredStartAt: timedA.startAt,
        preferredEndAt: timedA.endAt,
      })
    ).toBeNull()
  })

  it('resolvedScheduleId가 PRE_EDUCATION이면 null', () => {
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [{ id: 186892, scheduleRole: 'PRE_EDUCATION', scheduleStatus: 'ACTIVE' }],
        resolvedScheduleId: 186892,
      })
    ).toBeNull()
  })

  it('resolvedScheduleId가 목록에 없으면 null', () => {
    expect(
      resolveInstructorAssignmentScheduleId({
        schedules: [timedA],
        resolvedScheduleId: 1,
      })
    ).toBeNull()
  })
})
