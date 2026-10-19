import { describe, expect, it } from 'vitest'
import {
  buildInstitutionCancelApprovalMessage,
  resolveInstitutionCancelApprovalNotificationResult,
  resolveInstitutionCancelApprovalNotifyVariant,
  resolveInstitutionCancelApprovalReasonLabel,
} from '@/features/program/general/lib/institution-cancel-approval'
import type { ApplicationDecisionResponse } from '@/shared/api/generated/dashboard/schemas'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { buildInstitutionCancelApprovalCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/institution-cancel-approval-complete-modal'

const baseRow = {
  id: 'test',
  schoolName: '진월초등학교',
  approvalStatus: 'approved',
} as ApplicantSchoolRow

describe('institution-cancel-approval', () => {
  it('즉시 승인 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstitutionCancelApprovalNotifyVariant({
        ...baseRow,
        approvalNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('승인 알림 발송 일시가 있으면 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstitutionCancelApprovalNotifyVariant({
        ...baseRow,
        approvalNotificationSentAt: '2026.04.01 10:00:00',
      })
    ).toBe('alreadySent')
  })

  it('예약 승인 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveInstitutionCancelApprovalNotifyVariant({
        ...baseRow,
        approvalNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('pendingNotification 메시지에 승인 알림 발송 취소 문구를 포함한다', () => {
    expect(buildInstitutionCancelApprovalMessage('진월초등학교', 'pendingNotification')).toContain(
      '기존 승인 알림은 자동으로 **발송 취소**됩니다.'
    )
  })

  it('승인 취소 안내 알림을 완료로 오해하게 하는 문구를 포함하지 않는다', () => {
    const message = buildInstitutionCancelApprovalMessage('진월초등학교', 'alreadySent')
    expect(message).toContain('취소 안내 알림은 정책에 따라 발송·예약되지 않을 수 있습니다.')
    expect(message).not.toContain('알림이 발송됩니다.')
  })

  it('notificationEventId null·존재·필드 부재를 구분한다', () => {
    expect(
      resolveInstitutionCancelApprovalNotificationResult({
        notificationEventId: null,
      } as unknown as ApplicationDecisionResponse)
    ).toBe('not-created')
    expect(resolveInstitutionCancelApprovalNotificationResult({ notificationEventId: 123 })).toBe(
      'created'
    )
    expect(resolveInstitutionCancelApprovalNotificationResult({})).toBe('unknown')
  })

  it('notificationEventId null 완료 문구는 알림 발송 완료로 표시하지 않는다', () => {
    const description = buildInstitutionCancelApprovalCompleteDescription(
      '진월초등학교',
      '일정 변경',
      'not-created'
    )
    expect(description).toContain('승인 취소')
    expect(description).toContain('취소 안내 알림은 발송·예약되지 않았습니다.')
    expect(description).not.toContain('알림톡 발송 완료')
  })

  it('pendingNotification 사유 라벨에 반려 사유를 포함한다', () => {
    expect(resolveInstitutionCancelApprovalReasonLabel('pendingNotification')).toBe(
      '취소 사유(반려 사유)'
    )
  })
})
