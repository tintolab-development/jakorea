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

  it('기간형 희망 일정은 preferenceRank만 preferredScheduleRank로 보낸다', () => {
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'IMMEDIATE',
        preferredScheduleRank: 1,
        selectedScheduleId: 187157,
        selectedScheduleIds: [187157],
      })
    ).toEqual({ timing: 'IMMEDIATE', preferredScheduleRank: 1 })
  })

  it('유효하지 않은 희망 순위는 전송하지 않는다', () => {
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'IMMEDIATE',
        preferredScheduleRank: 0,
      })
    ).toBeUndefined()
    expect(
      buildTrainedTeacherApproveRequest({
        timing: 'IMMEDIATE',
        preferredScheduleRank: 1.5,
        selectedScheduleId: 187157,
      })
    ).toEqual({ timing: 'IMMEDIATE' })
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
