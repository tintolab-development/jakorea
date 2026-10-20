import { describe, expect, it } from 'vitest'
import { buildTrainedTeacherApproveRequest } from './trained-teacher-organization-approve-payload'

describe('buildTrainedTeacherApproveRequest', () => {
  it('일정 없는 즉시 승인은 기존 무본문 요청을 유지한다', () => {
    expect(buildTrainedTeacherApproveRequest({ timing: 'IMMEDIATE' })).toBeUndefined()
  })

  it('단일 일정은 selectedScheduleId만 보낸다', () => {
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'IMMEDIATE',
        selectedScheduleIds: [187134, 187134],
      })
    ).toEqual({ timing: 'IMMEDIATE', selectedScheduleId: 187134 })
  })

  it('복수 일정은 slots만 보낸다', () => {
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'IMMEDIATE',
        selectedScheduleIds: [187134, 187135, 187134],
      })
    ).toEqual({
      timing: 'IMMEDIATE',
      slots: [{ scheduleId: 187134 }, { scheduleId: 187135 }],
    })
  })

  it('SCHEDULED는 scheduledAt을 포함하고 다른 timing에는 포함하지 않는다', () => {
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-21T09:00:00+09:00',
        selectedScheduleId: 187134,
      })
    ).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-21T09:00:00+09:00',
      selectedScheduleId: 187134,
    })
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'ON_ANNOUNCEMENT',
        scheduledAt: '2026-10-21T09:00:00+09:00',
      })
    ).toEqual({ timing: 'ON_ANNOUNCEMENT' })
  })
})
