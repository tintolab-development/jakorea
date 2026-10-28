import { describe, expect, it } from 'vitest'
import {
  buildInstructorRoleApproveBody,
  buildInstructorRoleCancelApprovalBody,
  buildInstructorRoleRejectBody,
} from './use-instructor-role-request-mutations'

describe('buildInstructorRoleApproveBody', () => {
  it('즉시 발송은 scheduledAt을 넣지 않는다', () => {
    expect(
      buildInstructorRoleApproveBody({
        feeGrade: '1급 강사비',
        notifyTiming: 'immediate',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      })
    ).toMatchObject({
      feeGrade: 'GRADE_1',
      activityType: 'GENERAL',
    })
    expect(
      buildInstructorRoleApproveBody({
        feeGrade: '1급 강사비',
        notifyTiming: 'immediate',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      })
    ).not.toHaveProperty('scheduledAt')
  })

  it('직접 설정은 scheduledAt을 포함한다', () => {
    expect(
      buildInstructorRoleApproveBody({
        feeGrade: '2급 강사비',
        notifyTiming: 'manual',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      })
    ).toMatchObject({
      feeGrade: 'GRADE_2',
      scheduledAt: '2026-11-01T01:00:00.000Z',
    })
  })
})

describe('buildInstructorRoleRejectBody', () => {
  it('즉시 발송은 reason·rejectReason만 넣는다', () => {
    expect(
      buildInstructorRoleRejectBody({
        rejectionReason: '서류 미비',
        notifyTiming: 'immediate',
      })
    ).toEqual({
      reason: '서류 미비',
      rejectReason: '서류 미비',
    })
  })

  it('직접 설정은 scheduledAt을 포함한다', () => {
    expect(
      buildInstructorRoleRejectBody({
        rejectionReason: '서류 미비',
        notifyTiming: 'manual',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      })
    ).toEqual({
      reason: '서류 미비',
      rejectReason: '서류 미비',
      scheduledAt: '2026-11-01T01:00:00.000Z',
    })
  })
})

describe('buildInstructorRoleCancelApprovalBody', () => {
  it('즉시 발송은 scheduledAt을 넣지 않는다', () => {
    expect(
      buildInstructorRoleCancelApprovalBody({
        cancellationReason: ' 일정 변경 ',
        notifyTiming: 'immediate',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      })
    ).toEqual({
      reason: '일정 변경',
    })
  })

  it('직접 설정은 scheduledAt ISO를 포함한다', () => {
    expect(
      buildInstructorRoleCancelApprovalBody({
        cancellationReason: '일정 변경',
        notifyTiming: 'manual',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      })
    ).toEqual({
      reason: '일정 변경',
      scheduledAt: '2026-11-01T01:00:00.000Z',
    })
  })

  it('공백 사유는 제출하지 않는다', () => {
    expect(() =>
      buildInstructorRoleCancelApprovalBody({
        cancellationReason: '   ',
        notifyTiming: 'immediate',
      })
    ).toThrow('취소 사유를 입력해 주세요')
  })
})
