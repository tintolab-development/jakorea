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
    expect(row?.subject).toBe('')
    expect(row?.templateName).toBe('워크숍 안내')
    expect(row?.senderInfo).toBe('홍길동 <gildong@jakorea.org>')
    expect(row?.broadcastTiming).toBe('즉시')
    expect(row?.sendStatus).toBe('발송 성공')
    expect(row?.receiveStatus).toBe('수신 성공')
    expect(row?.readStatus).toBe('읽음')
  })

  it('does not fake list subject from templateDisplayName', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 1,
      templateDisplayName: '템플릿코드명',
      sendStatus: 'SUCCESS',
      receiptStatus: 'SUCCESS',
    })
    expect(row?.subject).toBe('')
    expect(row?.templateName).toBe('템플릿코드명')
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
        attachments: [
          { fileName: 'guide.pdf', fileObjectId: 101, downloadHint: '/api/admin/files/101/download' },
          { fileName: 'agenda.docx' },
        ],
      }
    )

    expect(row?.subject).toBe('미리보기 제목')
    expect(row?.senderInfo).toBe('관리자 <admin@jakorea.org>')
    expect(row?.attachmentFileNames).toEqual(['guide.pdf', 'agenda.docx'])
    expect(row?.attachments?.[0]).toMatchObject({
      fileName: 'guide.pdf',
      fileObjectId: 101,
      downloadHint: '/api/admin/files/101/download',
    })
  })

  it('uses renderedTitle||titleTemplate||- and never templateDisplayName for subject', () => {
    const withPreviewNoTitle = mapMailDeliveryToSendHistoryRow(
      {
        deliveryId: 8,
        templateDisplayName: '템플릿명',
        sendStatus: 'SENT',
      },
      { contentTemplate: '<p>본문</p>' }
    )
    expect(withPreviewNoTitle?.subject).toBe('-')

    const withRendered = mapMailDeliveryToSendHistoryRow(
      { deliveryId: 81, sendStatus: 'SENT' },
      { renderedTitle: '렌더 제목', titleTemplate: '템플릿 제목' }
    )
    expect(withRendered?.subject).toBe('렌더 제목')
  })

  it('maps sendStatus/receiptStatus to alimtalk-identical labels', () => {
    expect(mapMailDeliveryToSendHistoryRow({ deliveryId: 1, sendStatus: 'SCHEDULED' })?.sendStatus).toBe(
      '예약'
    )
    expect(mapMailDeliveryToSendHistoryRow({ deliveryId: 2, sendStatus: 'WAITED' })?.sendStatus).toBe(
      '대기'
    )
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 3, sendStatus: 'IN_PROGRESS' })?.sendStatus
    ).toBe('발송중')
    expect(mapMailDeliveryToSendHistoryRow({ deliveryId: 4, sendStatus: 'CANCELED' })?.sendStatus).toBe(
      '취소'
    )
    expect(mapMailDeliveryToSendHistoryRow({ deliveryId: 5, sendStatus: 'WEIRD' })?.sendStatus).toBe(
      '확인불가'
    )
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 6, receiptStatus: 'CONFIRM_WAITED' })
        ?.receiveStatus
    ).toBe('확인 대기중')
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 7, receiptStatus: 'DELIVERY_FAILED' })
        ?.receiveStatus
    ).toBe('수신 실패')
  })

  it('exposes failedReason only when sendStatus is SEND_FAILED', () => {
    const failed = mapMailDeliveryToSendHistoryRow({
      deliveryId: 10,
      sendStatus: 'SEND_FAILED',
      failedReason: 'SMTP timeout',
    })
    expect(failed?.sendStatus).toBe('발송 실패')
    expect(failed?.failedReason).toBe('SMTP timeout')
    expect(failed?.bodyHtml).toBe('')

    const ok = mapMailDeliveryToSendHistoryRow({
      deliveryId: 11,
      sendStatus: 'SENT',
      failedReason: 'should-ignore',
    })
    expect(ok?.failedReason).toBeUndefined()
  })

  it('uses sentAt/deliveredAt only for send/receive timestamps', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 9,
      requestedAt: '2026-09-07T09:00:00+09:00',
      sentAt: '2026-09-07T10:00:00+09:00',
      deliveredAt: '2026-09-07T10:01:00+09:00',
      openedAt: '2026-09-07T10:05:00+09:00',
      sendStatus: 'SUCCESS',
      receiptStatus: 'SUCCESS',
    })

    expect(row?.sentAt).toBe('2026-09-07T10:00:00+09:00')
    expect(row?.receivedAt).toBe('2026-09-07T10:01:00+09:00')
  })
})
