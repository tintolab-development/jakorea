import { describe, expect, it } from 'vitest'
import {
  toInstitutionDetailAssignmentCancelRequest,
  toInstructorAssignmentCancelRequest,
} from './instructor-cancel-fault-party'

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

describe('toInstitutionDetailAssignmentCancelRequest', () => {
  it('알림 발송 전이면 사유·알림 시점을 보내지 않는다', () => {
    expect(
      toInstitutionDetailAssignmentCancelRequest({ reason: '', notifyTiming: 'immediate' }, false)
    ).toEqual({})
  })

  it('알림 발송 후(또는 판단 불가)면 사유와 알림 시점을 보내고 귀책은 생략한다', () => {
    expect(
      toInstitutionDetailAssignmentCancelRequest({ reason: '일정 변경', notifyTiming: 'immediate' })
    ).toEqual({ reason: '일정 변경', timing: 'IMMEDIATE', scheduledAt: null })
  })
})
