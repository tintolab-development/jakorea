import { describe, expect, it } from 'vitest'
import {
  buildVolunteerDocumentCancelApprovalMessage,
  resolveVolunteerDocumentCancelApprovalReasonLabel,
} from '@/features/program/general/lib/volunteer-document-cancel-approval'

describe('volunteer-document-cancel-approval', () => {
  it('알림 발송 전 문구는 Figma 서류 승인 취소(off)와 같다', () => {
    expect(buildVolunteerDocumentCancelApprovalMessage('김제이', 'pendingNotification')).toBe(
      '**[김제이]** 님의 1차 서류 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.'
    )
  })

  it('알림 발송 후 문구는 Figma 서류 승인 취소(on)와 같다', () => {
    expect(buildVolunteerDocumentCancelApprovalMessage('김제이', 'alreadySent')).toBe(
      '**[김제이]** 님의 1차 서류 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 **반려 처리**됩니다.'
    )
  })

  it('사유 라벨은 분기와 관계없이 취소 사유다', () => {
    expect(resolveVolunteerDocumentCancelApprovalReasonLabel('pendingNotification')).toBe('취소 사유')
    expect(resolveVolunteerDocumentCancelApprovalReasonLabel('alreadySent')).toBe('취소 사유')
  })
})
