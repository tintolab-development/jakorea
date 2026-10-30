import { describe, expect, it } from 'vitest'
import {
  buildParticipantCancelApprovalMessage,
  resolveParticipantCancelApprovalReasonLabel,
} from '@/features/program/general/lib/participant-cancel-approval'

describe('participant-cancel-approval', () => {
  it('pendingNotification 메시지는 공통 프로그램 승인 취소 안내(발송 예정) 문구를 쓴다', () => {
    expect(buildParticipantCancelApprovalMessage('김제이', 'pendingNotification')).toBe(
      '**[김제이]** 님의 프로그램 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.'
    )
  })

  it('alreadySent 메시지는 공통 프로그램 승인 취소 안내(반려 처리) 문구를 쓴다', () => {
    expect(buildParticipantCancelApprovalMessage('김제이', 'alreadySent')).toBe(
      '**[김제이]** 님의 프로그램 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 **반려 처리**됩니다.'
    )
  })

  it('사유 라벨은 분기와 관계없이 취소 사유다', () => {
    expect(resolveParticipantCancelApprovalReasonLabel('pendingNotification')).toBe('취소 사유')
    expect(resolveParticipantCancelApprovalReasonLabel('alreadySent')).toBe('취소 사유')
  })
})
