import { describe, expect, it } from 'vitest'
import { buildTrainedTeacherOrganizationCancelApprovalRequest } from './trained-teacher-organization-cancel-approval-payload'

describe('buildTrainedTeacherOrganizationCancelApprovalRequest', () => {
  it('즉시 발송은 reason과 IMMEDIATE만 남긴다', () => {
    expect(
      buildTrainedTeacherOrganizationCancelApprovalRequest({
        reason: '123',
        notification: { timing: 'IMMEDIATE' },
      })
    ).toEqual({
      reason: '123',
      notification: { timing: 'IMMEDIATE' },
    })
  })

  it('notification을 생략하면 reason만 보낸다', () => {
    expect(
      buildTrainedTeacherOrganizationCancelApprovalRequest({
        reason: '신청 정보 재검토 필요',
      })
    ).toEqual({ reason: '신청 정보 재검토 필요' })
  })

  it('예약 발송은 Asia/Seoul scheduledAt만 붙인다', () => {
    expect(
      buildTrainedTeacherOrganizationCancelApprovalRequest({
        reason: '일정 재검토 필요',
        notification: {
          timing: 'SCHEDULED',
          scheduledAt: '2026-11-07T10:00:00+09:00',
        },
      })
    ).toEqual({
      reason: '일정 재검토 필요',
      notification: {
        timing: 'SCHEDULED',
        scheduledAt: '2026-11-07T10:00:00+09:00',
      },
    })
  })

  it('일정 선택 필드를 cancel body에 넣지 않는다', () => {
    const payload = buildTrainedTeacherOrganizationCancelApprovalRequest({
      reason: '승인 취소',
      notification: { timing: 'IMMEDIATE' },
      selectedScheduleId: 187702,
      slots: [{ scheduleId: 187702 }],
      preferredScheduleRank: 1,
      requestedScheduleId: 99,
    } as { reason: string; notification: { timing: 'IMMEDIATE' } })

    expect(payload).toEqual({
      reason: '승인 취소',
      notification: { timing: 'IMMEDIATE' },
    })
    expect(payload).not.toHaveProperty('selectedScheduleId')
    expect(payload).not.toHaveProperty('slots')
    expect(payload).not.toHaveProperty('preferredScheduleRank')
    expect(payload).not.toHaveProperty('requestedScheduleId')
  })
})
