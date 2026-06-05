import { describe, expect, it } from 'vitest'
import {
  buildInstitutionCancelApprovalMessage,
  resolveInstitutionCancelApprovalNotifyVariant,
  resolveInstitutionCancelApprovalReasonLabel,
} from '@/features/program/general/lib/institution-cancel-approval'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'

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
    expect(
      buildInstitutionCancelApprovalMessage('진월초등학교', 'pendingNotification')
    ).toContain('기존의 승인 알림은 자동으로 **발송 취소**됩니다.')
  })

  it('alreadySent 메시지에 반려 처리 문구를 포함한다', () => {
    expect(buildInstitutionCancelApprovalMessage('진월초등학교', 'alreadySent')).toContain(
      '자동으로 **반려 처리**됩니다.'
    )
  })

  it('pendingNotification 사유 라벨에 반려 사유를 포함한다', () => {
    expect(resolveInstitutionCancelApprovalReasonLabel('pendingNotification')).toBe(
      '취소 사유(반려 사유)'
    )
  })
})
