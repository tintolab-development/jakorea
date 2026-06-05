import { describe, expect, it } from 'vitest'
import {
  buildInstructorCancelRejectionMessage,
  resolveInstructorCancelRejectionNotifyVariant,
} from '@/features/program/general/lib/instructor-cancel-rejection'
import { buildInstructorCancelRejectCompleteDescription } from '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-complete-modal'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'

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

  it('예약 반려 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveInstructorCancelRejectionNotifyVariant({
        ...baseRow,
        rejectionNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('pendingNotification 메시지에 반려 알림 발송 취소 문구를 포함한다', () => {
    expect(
      buildInstructorCancelRejectionMessage('박틴토', 'pendingNotification')
    ).toContain('기존의 반려 알림은 자동으로 **발송 취소**되며,')
  })

  it('alreadySent 메시지에 반려 취소 알림 문구를 포함한다', () => {
    expect(buildInstructorCancelRejectionMessage('박틴토', 'alreadySent')).toContain(
      '반려 취소 알림이 새롭게 발송됩니다.'
    )
  })
})

describe('instructor-cancel-reject-complete-modal', () => {
  it('완료 메시지에 후속 안내를 포함한다', () => {
    expect(buildInstructorCancelRejectCompleteDescription('박틴토')).toBe(
      '[**박틴토**] 강사님의 프로그램 참여 **반려 취소** 되었습니다.\n해당 강사님은 신청 목록 또는 상세에서 **승인 및 반려**가 가능합니다.'
    )
  })
})
