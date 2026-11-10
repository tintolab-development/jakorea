import { describe, expect, it } from 'vitest'
import {
  buildInstitutionCancelRejectionMessage,
  patchInstitutionForCancelRejection,
  resolveInstitutionCancelRejectionModalTitle,
  resolveInstitutionCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/institution-cancel-rejection'
import {
  buildInstitutionCancelRejectCompleteDescription,
  resolveInstitutionCancelRejectCompleteCopy,
} from '@/features/program/shared/ui/detail-modal/components/institution-cancel-reject-complete-modal'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

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

  it('반려 취소 패치는 REJECTION_CANCELLED로 복원한다', () => {
    const restored = patchInstitutionForCancelRejection({
      ...baseRow,
      applicationStatus: 'APPROVAL_CANCELLED',
    })
    expect(restored.approvalStatus).toBe('pending')
    expect(restored.applicationStatus).toBe('REJECTION_CANCELLED')
  })
})

describe('institution-cancel-reject-complete-modal', () => {
  it('완료 메시지에 후속 안내를 포함한다', () => {
    expect(buildInstitutionCancelRejectCompleteDescription('진월초등학교')).toBe(
      '**[진월초등학교]**의 프로그램 참여 **반려 취소** 되었습니다.\n해당 기관은 신청 목록 또는 상세에서 **승인 및 반려**가 가능합니다.'
    )
  })
})

describe('institution-cancel-rejection general-organization copy', () => {
  it('제목은 일반(기관형)만 「프로그램 반려 취소 안내」, 기본은 기존 유지', () => {
    expect(resolveInstitutionCancelRejectionModalTitle('general-organization')).toBe(
      '프로그램 반려 취소 안내'
    )
    expect(resolveInstitutionCancelRejectionModalTitle()).toBe('기관 반려 취소 안내')
  })

  it('알림 발송 전 본문은 시안 04-1 문구', () => {
    expect(
      buildInstitutionCancelRejectionMessage('JA초등학교', 'pendingNotification', 'general-organization')
    ).toBe(
      '**[JA초등학교]**의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 발송 예정인 반려 알림은 자동으로 취소되며, **승인 대기 처리**됩니다.'
    )
  })

  it('알림 발송 후 본문은 시안 04-2 문구', () => {
    expect(
      buildInstitutionCancelRejectionMessage('JA초등학교', 'alreadySent', 'general-organization')
    ).toBe(
      '**[JA초등학교]**의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 입력하신 사유가 담당 교사에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 기관은 자동으로 **승인 대기 처리**됩니다.'
    )
  })

  it('완료 팝업은 일반(기관형)만 「취소 완료 / 취소되었습니다.」', () => {
    expect(resolveInstitutionCancelRejectCompleteCopy('JA초등학교', 'general-organization')).toEqual(
      { title: '취소 완료', description: '취소되었습니다.' }
    )
    expect(resolveInstitutionCancelRejectCompleteCopy('JA초등학교').title).toBe(
      '기관 반려 취소 완료'
    )
  })
})
