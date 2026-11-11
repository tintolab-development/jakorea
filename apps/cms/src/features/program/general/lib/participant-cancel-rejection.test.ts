import { describe, expect, it } from 'vitest'
import {
  buildParticipantCancelRejectionMessage,
  PARTICIPANT_CANCEL_REJECTION_MODAL_TITLE,
} from './participant-cancel-rejection'

describe('participant cancel rejection copy (개인 시안 04-1·04-2)', () => {
  it('제목은 「프로그램 반려 취소 안내」', () => {
    expect(PARTICIPANT_CANCEL_REJECTION_MODAL_TITLE).toBe('프로그램 반려 취소 안내')
  })

  it('알림 발송 전 — 발송 예정 반려 알림 자동 취소·승인 대기 처리', () => {
    const message = buildParticipantCancelRejectionMessage('김제이', 'pendingNotification')
    expect(message).toContain('[김제이]')
    expect(message).toContain('님의 프로그램 신청 반려를 취소하시겠습니까?')
    expect(message).toContain('취소 시 발송 예정인 반려 알림은 자동으로 취소되며,')
    expect(message).toContain('승인 대기 처리')
  })

  it('알림 발송 후 — 취소 사유 안내·승인 대기 처리', () => {
    const message = buildParticipantCancelRejectionMessage('김제이', 'alreadySent')
    expect(message).toContain('님의 프로그램 신청 반려를 취소하시겠습니까?')
    expect(message).toContain('취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.')
    expect(message).toContain('또한, 해당 회원은 자동으로')
  })
})
