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

  it('pendingNotification 메시지는 공통 프로그램 승인 취소 안내(발송 예정) 문구를 쓴다', () => {
    expect(buildInstitutionCancelApprovalMessage('JA초등학교', 'pendingNotification')).toBe(
      '**[JA초등학교]**의 프로그램 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 담당 교사에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.'
    )
  })

  it('alreadySent 메시지는 공통 프로그램 승인 취소 안내(반려 처리) 문구를 쓴다', () => {
    expect(buildInstitutionCancelApprovalMessage('JA초등학교', 'alreadySent')).toBe(
      '**[JA초등학교]**의 프로그램 참여 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 담당 교사에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 기관은 자동으로 **반려 처리**됩니다.'
    )
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

  it('완료 메시지는 Figma 공통 완료 문구다', () => {
    expect(
      buildInstitutionCancelApprovalCompleteDescription('진월초등학교', '일정 변경', 'not-created')
    ).toBe('취소되었습니다.')
  })

  it('사유 라벨은 분기와 관계없이 취소 사유다', () => {
    expect(resolveInstitutionCancelApprovalReasonLabel('pendingNotification')).toBe('취소 사유')
    expect(resolveInstitutionCancelApprovalReasonLabel('alreadySent')).toBe('취소 사유')
  })
})
