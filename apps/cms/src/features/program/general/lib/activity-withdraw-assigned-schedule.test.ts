import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_WITHDRAW_NO_ASSIGNED_SCHEDULE_ALERT,
  activityWithdrawAssignedScheduleBlockAlert,
  filterSessionsToAssignedSchedules,
  readAssignedScheduleIds,
  readAssignedScheduleIdsFromSessions,
  resolveActivityWithdrawAssignedScheduleStatus,
} from './activity-withdraw-assigned-schedule'

describe('activity withdraw assigned schedule guard', () => {
  it('배정 일정이 없으면 공통 안내 모달 문구를 돌려준다', () => {
    const status = resolveActivityWithdrawAssignedScheduleStatus({
      isPending: false,
      isError: false,
      data: { scheduleIds: [] },
    })
    expect(status).toBe('none')
    expect(activityWithdrawAssignedScheduleBlockAlert(status)).toEqual({
      title: '활동 포기 안내',
      content: '배정된 일정이 없는 경우 활동 포기가 불가합니다.',
    })
    expect(ACTIVITY_WITHDRAW_NO_ASSIGNED_SCHEDULE_ALERT.content).toBe(
      '배정된 일정이 없는 경우 활동 포기가 불가합니다.'
    )
  })

  it('배정 일정이 있으면 차단하지 않는다', () => {
    const status = resolveActivityWithdrawAssignedScheduleStatus({
      isPending: false,
      isError: false,
      data: { scheduleIds: [101] },
    })
    expect(status).toBe('assigned')
    expect(activityWithdrawAssignedScheduleBlockAlert(status)).toBeNull()
  })

  it('로딩 중·조회 실패는 배정 없음으로 보지 않고 진행도 막는다', () => {
    const loading = resolveActivityWithdrawAssignedScheduleStatus({
      isPending: true,
      isError: false,
      data: undefined,
    })
    const failed = resolveActivityWithdrawAssignedScheduleStatus({
      isPending: false,
      isError: true,
      data: undefined,
    })
    expect(loading).toBe('loading')
    expect(failed).toBe('error')
    expect(activityWithdrawAssignedScheduleBlockAlert(loading)?.content).not.toBe(
      ACTIVITY_WITHDRAW_NO_ASSIGNED_SCHEDULE_ALERT.content
    )
    expect(activityWithdrawAssignedScheduleBlockAlert(failed)?.content).not.toBe(
      ACTIVITY_WITHDRAW_NO_ASSIGNED_SCHEDULE_ALERT.content
    )
  })

  it('목록 sessions에서 미확정 희망 일정·id 없는 일정은 배정으로 세지 않는다', () => {
    expect(
      readAssignedScheduleIdsFromSessions([
        { resolvedScheduleId: 11 },
        { resolvedScheduleId: 12, scheduleUnresolved: true },
        { resolvedScheduleId: null },
      ])
    ).toEqual(new Set([11]))
    expect(readAssignedScheduleIdsFromSessions([])).toEqual(new Set())
  })

  it('중단 일정 후보는 배정 범위 밖 일정을 제외한다', () => {
    const assigned = readAssignedScheduleIds({ scheduleIds: [2] })
    const sessions = [
      { round: 1, resolvedScheduleId: 1 },
      { round: 2, resolvedScheduleId: 2 },
      { round: 3, resolvedScheduleId: null },
    ]
    expect(filterSessionsToAssignedSchedules(sessions, assigned).map(s => s.round)).toEqual([2, 3])
  })
})
