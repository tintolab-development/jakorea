import { describe, expect, it } from 'vitest'
import { mapMailDeliveryToSendHistoryRow } from './mail-delivery-adapters'

describe('mapMailDeliveryToSendHistoryRow', () => {
  it('maps delivery fields into mail history row', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 42,
      requestedAt: '2026-09-07T10:00:00+09:00',
      sentAt: '2026-09-07T10:01:00+09:00',
      deliveredAt: '2026-09-07T10:02:00+09:00',
      openedAt: '2026-09-07T10:05:00+09:00',
      senderDisplayName: '홍길동',
      senderKey: 'gildong@jakorea.org',
      recipientName: '이가원',
      recipientContactMasked: 'iga@***.com',
      templateDisplayName: '워크숍 안내',
      sendStatus: 'SUCCESS',
      receiptStatus: 'SUCCESS',
      sendTiming: 'IMMEDIATE',
    })

    expect(row?.id).toBe('42')
    expect(row?.subject).toBe('워크숍 안내')
    expect(row?.senderInfo).toBe('홍길동 <gildong@jakorea.org>')
    expect(row?.broadcastTiming).toBe('즉시')
    expect(row?.sendStatus).toBe('발송 성공')
    expect(row?.receiveStatus).toBe('수신 성공')
    expect(row?.readStatus).toBe('읽음')
  })

  it('maps preview title/attachments/senderDisplay', () => {
    const row = mapMailDeliveryToSendHistoryRow(
      {
        deliveryId: 7,
        templateDisplayName: 'fallback',
        sendStatus: 'SUCCESS',
        receiptStatus: 'SUCCESS',
      },
      {
        titleTemplate: '미리보기 제목',
        senderDisplay: '관리자 <admin@jakorea.org>',
        attachments: [{ fileName: 'guide.pdf' }, { fileName: 'agenda.docx' }],
      }
    )

    expect(row?.subject).toBe('미리보기 제목')
    expect(row?.senderInfo).toBe('관리자 <admin@jakorea.org>')
    expect(row?.attachmentFileNames).toEqual(['guide.pdf', 'agenda.docx'])
  })
})
