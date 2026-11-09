import { describe, expect, it } from 'vitest'
import {
  applyNotificationStatusFilterParams,
  mapNotificationReceiveStatus,
  mapNotificationSendStatus,
} from './delivery-status'

describe('notification delivery status (세 채널 공통)', () => {
  it.each([
    ['REQUESTED', '발송 요청'],
    ['SCHEDULED', '예약'],
    ['WAITED', '발송 대기'],
    ['IN_PROGRESS', '발송 중'],
    ['SENT', '발송 완료'],
    ['SEND_FAILED', '발송 실패'],
    ['CANCELED', '발송 취소'],
    ['UNKNOWN', '확인불가'],
    ['SKIPPED', '확인불가'],
    ['RETRY', '확인불가'],
    [undefined, '확인불가'],
  ])('sendStatus %s → %s', (code, label) => {
    expect(mapNotificationSendStatus(code, { scheduled: false })).toBe(label)
  })

  it('예약 발송의 CANCELED만 예약 취소', () => {
    expect(mapNotificationSendStatus('CANCELED', { scheduled: true })).toBe('예약 취소')
    expect(mapNotificationSendStatus('SENT', { scheduled: true })).toBe('발송 완료')
  })

  it('수신 상태 모르는 값은 확인불가', () => {
    expect(mapNotificationReceiveStatus('DELIVERY_FAILED')).toBe('수신 실패')
    expect(mapNotificationReceiveStatus('SKIPPED')).toBe('확인불가')
  })

  it('발송 취소/예약 취소 필터는 sendTiming으로 나누고, 수신 필터는 서버 허용 코드만 보낸다', () => {
    const cancelScheduled: Record<string, string> = {}
    applyNotificationStatusFilterParams(cancelScheduled, {
      sendStatus: '예약 취소',
      receiveStatus: '확인 대기중',
      broadcastTiming: '전체',
    })
    expect(cancelScheduled).toEqual({
      sendStatus: 'CANCELED',
      sendTiming: 'SCHEDULED',
      receiptStatus: 'CONFIRM_WAITED',
    })

    const cancelImmediate: Record<string, string> = {}
    applyNotificationStatusFilterParams(cancelImmediate, {
      sendStatus: '발송 취소',
      receiveStatus: '대기중',
      broadcastTiming: '예약',
    })
    expect(cancelImmediate).toEqual({
      sendStatus: 'CANCELED',
      sendTiming: 'IMMEDIATE',
      receiptStatus: 'WAITED',
    })
  })
})
