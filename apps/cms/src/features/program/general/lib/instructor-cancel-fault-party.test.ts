import { describe, expect, it } from 'vitest'
import { toInstructorAssignmentCancelRequest } from './instructor-cancel-fault-party'

describe('toInstructorAssignmentCancelRequest', () => {
  it('즉시 발송이면 IMMEDIATE와 faultParty를 보낸다', () => {
    expect(
      toInstructorAssignmentCancelRequest({
        reason: '강사 개인 사정으로 배정 취소',
        notifyTiming: 'immediate',
        faultParty: 'USER',
      })
    ).toEqual({
      reason: '강사 개인 사정으로 배정 취소',
      timing: 'IMMEDIATE',
      scheduledAt: null,
      faultParty: 'USER',
    })
  })

  it('운영 사유 취소는 ADMIN을 보낸다', () => {
    expect(
      toInstructorAssignmentCancelRequest({
        reason: '일정 조정',
        notifyTiming: 'immediate',
        faultParty: 'ADMIN',
      }).faultParty
    ).toBe('ADMIN')
  })
})
