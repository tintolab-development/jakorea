import { describe, expect, it } from 'vitest'
import {
  buildVolunteerDocumentCancelRejectionMessage,
  resolveVolunteerDocumentCancelRejectionNotifyVariant,
  toVolunteerDocumentCancelRejectionNotifyOptions,
} from '@/features/program/general/lib/volunteer-document-cancel-rejection'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'

const baseRow = {
  id: 'v1',
  name: '김범수',
  documentScreeningStatus: 'fail',
} as GeneralVolunteerApplicantRow

describe('volunteer-document-cancel-rejection', () => {
  it('즉시 반려 알림은 alreadySent 분기를 사용한다', () => {
    expect(
      resolveVolunteerDocumentCancelRejectionNotifyVariant({
        ...baseRow,
        documentRejectionNotifyTiming: 'immediate',
      })
    ).toBe('alreadySent')
  })

  it('예약 반려 알림은 pendingNotification 분기를 사용한다', () => {
    expect(
      resolveVolunteerDocumentCancelRejectionNotifyVariant({
        ...baseRow,
        documentRejectionNotifyTiming: 'on_announcement',
      })
    ).toBe('pendingNotification')
  })

  it('alreadySent 메시지·타이틀용 카피를 스크린샷형으로 만든다', () => {
    expect(buildVolunteerDocumentCancelRejectionMessage('김범수', 'alreadySent')).toBe(
      '[**김범수**]의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 봉사자에게 반려 취소 알림이 새롭게 발송됩니다.\n또한, 해당 봉사자는 자동으로 **승인 대기 처리**됩니다.'
    )
  })

  it('pendingNotification 메시지에 발송 취소·승인 대기 문구를 포함한다', () => {
    expect(buildVolunteerDocumentCancelRejectionMessage('김범수', 'pendingNotification')).toBe(
      '[**김범수**]의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 기존의 반려 알림은 자동으로 **발송 취소**되며,\n해당 봉사자는 자동으로 **승인 대기 처리**됩니다.'
    )
  })

  it('alreadySent payload를 notify options로 변환한다', () => {
    expect(
      toVolunteerDocumentCancelRejectionNotifyOptions({
        variant: 'alreadySent',
        reason: ' 사유 ',
        notifyTiming: 'immediate',
      })
    ).toEqual({
      notifyTiming: 'immediate',
      manualNotifyAt: undefined,
      rejectionReason: '사유',
    })
  })
})
