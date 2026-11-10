import { describe, expect, it } from 'vitest'
import {
  buildInstructorCancelRejectionMessage,
  patchInstructorForCancelRejection,
  resolveInstructorCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/instructor-cancel-rejection'
import { buildInstructorCancelRejectCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-complete-modal'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

const baseRow = {
  id: 'test',
  instructorName: '박틴토',
  approvalStatus: 'rejected',
} as ApplicantInstructorRow

describe('instructor-cancel-rejection', () => {
  it('즉시 반려 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstructorCancelRejectionNotifyVariant({
        ...baseRow,
        rejectionNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('반려 알림 발송 일시가 있으면 alreadySent 분기를 사용한다', () => {
    expect(
      resolveInstructorCancelRejectionNotifyVariant({
        ...baseRow,
        approvalNotificationSentAt: '2026.04.01 10:00:00',
      })
    ).toBe('alreadySent')
  })

  it('예약 반려 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveInstructorCancelRejectionNotifyVariant({
        ...baseRow,
        rejectionNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('pendingNotification 메시지에 반려 알림 발송 취소 문구를 포함한다', () => {
    const message = buildInstructorCancelRejectionMessage('박틴토', 'pendingNotification')
    expect(message).toBe(
      '**[박틴토]** 님의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 발송 예정인 반려 알림은 자동으로 취소되며, **승인 대기 처리**됩니다.'
    )
  })

  it('alreadySent 메시지에 반려 취소 알림 문구를 포함한다', () => {
    expect(buildInstructorCancelRejectionMessage('박틴토', 'alreadySent')).toBe(
      '**[박틴토]** 님의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 강사님은 자동으로 **승인 대기 처리**됩니다.'
    )
  })

  it('반려 취소 패치는 REJECTION_CANCELLED로 복원한다', () => {
    const restored = patchInstructorForCancelRejection({
      ...baseRow,
      applicationStatus: 'APPROVAL_CANCELLED',
    })
    expect(restored.approvalStatus).toBe('pending')
    expect(restored.applicationStatus).toBe('REJECTION_CANCELLED')
  })
})

describe('instructor-cancel-reject-complete-modal', () => {
  it('완료 메시지에 후속 안내를 포함한다', () => {
    expect(buildInstructorCancelRejectCompleteDescription('박틴토')).toBe(
      '**[박틴토]** 강사님의 프로그램 참여 **반려 취소** 되었습니다.\n해당 강사님은 신청 목록 또는 상세에서 **승인 및 반려**가 가능합니다.'
    )
  })
})

describe('buildInstructorCancelRejectionMessage — 일반(기관형) 시안 04-2', () => {
  it('알림 발송 후 본문은 「해당 회원은」', () => {
    expect(
      buildInstructorCancelRejectionMessage('김제이', 'alreadySent', 'general-organization')
    ).toBe(
      '**[김제이]** 님의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 **승인 대기 처리**됩니다.'
    )
  })
})
