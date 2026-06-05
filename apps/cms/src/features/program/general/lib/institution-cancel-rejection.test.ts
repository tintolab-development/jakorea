import { describe, expect, it } from 'vitest'
import {
  buildInstitutionCancelRejectionMessage,
  resolveInstitutionCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/institution-cancel-rejection'
import { buildInstitutionCancelRejectCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/institution-cancel-reject-complete-modal'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'

const baseRow = {
  id: 'test',
  schoolName: '진월초등학교',
  approvalStatus: 'rejected',
} as ApplicantSchoolRow

describe('institution-cancel-rejection', () => {
  it('즉시 반려 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstitutionCancelRejectionNotifyVariant({
        ...baseRow,
        rejectionNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('반려 알림 발송 일시가 있으면 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstitutionCancelRejectionNotifyVariant({
        ...baseRow,
        approvalNotificationSentAt: '2026.04.01 10:00:00',
      })
    ).toBe('alreadySent')
  })

  it('예약 반려 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveInstitutionCancelRejectionNotifyVariant({
        ...baseRow,
        rejectionNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('pendingNotification 메시지에 반려 알림 발송 취소 문구를 포함한다', () => {
    expect(
      buildInstitutionCancelRejectionMessage('진월초등학교', 'pendingNotification')
    ).toContain('기존의 반려 알림은 자동으로 **발송 취소**되며,')
  })

  it('alreadySent 메시지에 반려 취소 알림 문구를 포함한다', () => {
    expect(buildInstitutionCancelRejectionMessage('진월초등학교', 'alreadySent')).toContain(
      '반려 취소 알림이 새롭게 발송됩니다.'
    )
  })
})

describe('institution-cancel-reject-complete-modal', () => {
  it('완료 메시지에 후속 안내를 포함한다', () => {
    expect(buildInstitutionCancelRejectCompleteDescription('진월초등학교')).toBe(
      '[**진월초등학교**]의 프로그램 참여 **반려 취소** 되었습니다.\n해당 기관은 신청 목록 또는 상세에서 **승인 및 반려**가 가능합니다.'
    )
  })
})
