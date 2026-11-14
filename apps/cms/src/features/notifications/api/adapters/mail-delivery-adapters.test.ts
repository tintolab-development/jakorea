import { describe, expect, it } from 'vitest'
import {
  mapMailDeliveryDetailResponse,
  mapMailDeliveryToSendHistoryRow,
  resolveMailDeliverySender,
} from './mail-delivery-adapters'

describe('resolveMailDeliverySender', () => {
  it('「이름 <메일>」을 이름·메일로 나눈다', () => {
    expect(resolveMailDeliverySender('', 'JA코리아 <jakorea@jakorea.org>', undefined)).toEqual({
      senderName: 'JA코리아',
      senderEmail: 'jakorea@jakorea.org',
    })
  })

  it('형식에 맞지 않으면 값 전체를 메일로 보고 이름은 비운다', () => {
    expect(resolveMailDeliverySender('', 'jakorea@jakorea.org', undefined)).toEqual({
      senderName: '',
      senderEmail: 'jakorea@jakorea.org',
    })
  })

  it('이름 자리에 메일이 와도 메일을 겹쳐 쓰지 않는다', () => {
    expect(
      resolveMailDeliverySender('', 'jakorea@jakorea.org <jakorea@jakorea.org>', undefined)
    ).toEqual({ senderName: '', senderEmail: 'jakorea@jakorea.org' })
  })

  it('상세 preview 표시 문자열을 먼저 쓴다', () => {
    expect(
      resolveMailDeliverySender(
        'JA코리아 <jakorea@jakorea.org>',
        'jakorea@jakorea.org',
        'jakorea@jakorea.org'
      )
    ).toEqual({ senderName: 'JA코리아', senderEmail: 'jakorea@jakorea.org' })
  })
})

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
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERED',
      sendTiming: 'IMMEDIATE',
    })

    expect(row?.id).toBe('42')
    expect(row?.subject).toBe('-')
    expect(row?.templateName).toBe('워크숍 안내')
    expect(row?.senderInfo).toBe('홍길동 <gildong@jakorea.org>')
    expect(row?.broadcastTiming).toBe('즉시')
    expect(row?.sendStatus).toBe('발송 성공')
    expect(row?.receiveStatus).toBe('수신 성공')
    expect(row?.readStatus).toBe('읽음')
  })

  it('「이름 <메일>」 발송자를 메일 중복 없이 목록 표시로 만든다', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 2191,
      senderDisplayName: 'JA코리아 <jakorea@jakorea.org>',
      senderKey: 'jakorea@jakorea.org',
      sendStatus: 'SENT',
    })
    expect(row?.senderName).toBe('JA코리아')
    expect(row?.senderEmail).toBe('jakorea@jakorea.org')
    expect(row?.senderInfo).toBe('JA코리아 <jakorea@jakorea.org>')
  })

  it('does not fake list subject from templateDisplayName', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 1,
      templateDisplayName: '템플릿코드명',
      sendStatus: 'SENT',
      receiptStatus: 'SUCCESS',
    })
    expect(row?.subject).toBe('-')
    expect(row?.templateName).toBe('템플릿코드명')
  })

  it('uses list renderedTitle||titleTemplate without preview (N+1 금지)', () => {
    const withRendered = mapMailDeliveryToSendHistoryRow({
      deliveryId: 2,
      templateDisplayName: '템플릿명',
      renderedTitle: '치환된 제목',
      titleTemplate: '원문 제목 #{회원명}',
      sendStatus: 'SENT',
    })
    expect(withRendered?.subject).toBe('치환된 제목')
    expect(withRendered?.templateName).toBe('템플릿명')

    const withTemplateOnly = mapMailDeliveryToSendHistoryRow({
      deliveryId: 3,
      titleTemplate: '원문 제목만',
      sendStatus: 'SEND_FAILED',
    })
    expect(withTemplateOnly?.subject).toBe('원문 제목만')
  })

  it('maps preview title/attachments/senderDisplay', () => {
    const row = mapMailDeliveryToSendHistoryRow(
      {
        deliveryId: 7,
        templateDisplayName: 'fallback',
        sendStatus: 'SENT',
        receiptStatus: 'SUCCESS',
      },
      {
        titleTemplate: '미리보기 제목',
        senderDisplay: '관리자 <admin@jakorea.org>',
        attachments: [
          {
            fileName: 'guide.pdf',
            fileObjectId: 101,
            downloadHint: '/api/admin/files/101/download',
          },
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

  it('maps sendStatus/receiptStatus to the Figma mail send labels', () => {
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 1, sendStatus: 'SCHEDULED' })?.sendStatus
    ).toBe('발송 예약')
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 2, sendStatus: 'WAITED' })?.sendStatus
    ).toBe('발송 대기')
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 3, sendStatus: 'IN_PROGRESS' })?.sendStatus
    ).toBe('발송 중')
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 4, sendStatus: 'CANCELED' })?.sendStatus
    ).toBe('발송 취소')
    expect(
      mapMailDeliveryToSendHistoryRow({ deliveryId: 5, sendStatus: 'WEIRD' })?.sendStatus
    ).toBe('확인불가')
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

  it('QA-0176 발송 성공·수신 실패면 응답에 있는 수신 실패 사유를 따로 둔다', () => {
    const fromProvider = mapMailDeliveryToSendHistoryRow({
      deliveryId: 12,
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERY_FAILED',
      providerResultMessage: 'Mailbox not found',
    })
    expect(fromProvider?.sendStatus).toBe('발송 성공')
    expect(fromProvider?.receiveStatus).toBe('수신 실패')
    expect(fromProvider?.failedReason).toBeUndefined()
    expect(fromProvider?.receiveFailedReason).toBe('Mailbox not found')

    const fromFailedReason = mapMailDeliveryToSendHistoryRow({
      deliveryId: 13,
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERY_FAILED',
      failedReason: 'Bounced',
      providerResultMessage: 'ignored when failedReason exists',
    })
    expect(fromFailedReason?.receiveFailedReason).toBe('Bounced')
  })

  it('QA-0178 발송·수신 실패 사유는 서버 displayReason을 먼저 쓴다', () => {
    const sendFailed = mapMailDeliveryToSendHistoryRow({
      deliveryId: 17,
      sendStatus: 'SEND_FAILED',
      failedReason: 'SMTP timeout',
      providerResultCode: '550',
      displayReason: '발송 실패(코드: 550)',
    })
    expect(sendFailed?.failedReason).toBe('발송 실패(코드: 550)')
    expect(sendFailed?.receiveFailedReason).toBeUndefined()

    const receiveFailed = mapMailDeliveryToSendHistoryRow({
      deliveryId: 18,
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERY_FAILED',
      failedReason: 'Bounced',
      providerResultMessage: 'Mailbox not found',
      displayReason: '발송 실패(코드: 551)',
    })
    expect(receiveFailed?.failedReason).toBeUndefined()
    expect(receiveFailed?.receiveFailedReason).toBe('발송 실패(코드: 551)')

    const blankDisplay = mapMailDeliveryToSendHistoryRow({
      deliveryId: 19,
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERY_FAILED',
      providerResultMessage: 'Mailbox not found',
      displayReason: '  ',
    })
    expect(blankDisplay?.receiveFailedReason).toBe('Mailbox not found')
  })

  it('QA-0176 수신 실패라도 응답에 사유가 없으면 문구를 만들지 않는다', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 14,
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERY_FAILED',
    })
    expect(row?.receiveFailedReason).toBeUndefined()

    const delivered = mapMailDeliveryToSendHistoryRow({
      deliveryId: 15,
      sendStatus: 'SENT',
      receiptStatus: 'DELIVERED',
      providerResultMessage: 'OK',
    })
    expect(delivered?.receiveFailedReason).toBeUndefined()

    const sendFailed = mapMailDeliveryToSendHistoryRow({
      deliveryId: 16,
      sendStatus: 'SEND_FAILED',
      receiptStatus: 'SEND_FAILED',
      failedReason: 'SMTP timeout',
    })
    expect(sendFailed?.failedReason).toBe('SMTP timeout')
    expect(sendFailed?.receiveFailedReason).toBeUndefined()
  })

  it('uses sentAt/deliveredAt only for send/receive timestamps', () => {
    const row = mapMailDeliveryToSendHistoryRow({
      deliveryId: 9,
      requestedAt: '2026-09-07T09:00:00+09:00',
      sentAt: '2026-09-07T10:00:00+09:00',
      deliveredAt: '2026-09-07T10:01:00+09:00',
      openedAt: '2026-09-07T10:05:00+09:00',
      sendStatus: 'SENT',
      receiptStatus: 'SUCCESS',
    })

    expect(row?.sentAt).toBe('2026-09-07T10:00:00+09:00')
    expect(row?.receivedAt).toBe('2026-09-07T10:01:00+09:00')
  })

  it('formats NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING for delivery detail', () => {
    const failed = mapMailDeliveryToSendHistoryRow(
      {
        deliveryId: 12,
        sendStatus: 'SEND_FAILED',
        failedReason: 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:동의 항목,만료일시',
        recipientName: '이건희',
        recipientContactMasked: '2***@tinto.co.kr',
      },
      {
        renderedTitle: '필수 동의 만료 안내',
        renderedContent: '<p>#{회원명} #{동의 항목} #{만료일시}</p>',
      }
    )
    expect(failed?.sendStatus).toBe('발송 실패')
    expect(failed?.failedReason).toBe(
      '자동입력 변수값이 없어 발송되지 않았습니다: 동의 항목, 만료일시'
    )
    // preview에 #{…} 잔존 = 치환 전 실패(정상)
    expect(failed?.bodyHtml).toContain('#{동의 항목}')
  })

  it('detail body prefers renderedContent as-is (no double escape) over contentTemplate', () => {
    const row = mapMailDeliveryToSendHistoryRow(
      { deliveryId: 20, sendStatus: 'SENT' },
      {
        renderedTitle: '렌더 제목',
        renderedContent: '안녕하세요 홍길동님<br>&lt;b&gt;&amp;',
        contentTemplate: '안녕하세요 #{회원명}님\n#{값}',
      }
    )
    expect(row?.bodyHtml).toBe('안녕하세요 홍길동님<br>&lt;b&gt;&amp;')
    expect(row?.subject).toBe('렌더 제목')
  })

  it('falls back to plain contentTemplate with line breaks, HTML contentTemplate unchanged', () => {
    const plain = mapMailDeliveryToSendHistoryRow(
      { deliveryId: 21, sendStatus: 'FAILED' },
      { titleTemplate: '원문 제목\n그대로', contentTemplate: '안녕 #{회원명}\n<b>' }
    )
    expect(plain?.bodyHtml).toBe('안녕 #{회원명}<br>&lt;b&gt;')
    expect(plain?.subject).toBe('원문 제목\n그대로')

    const html = mapMailDeliveryToSendHistoryRow(
      { deliveryId: 22, sendStatus: 'FAILED' },
      { contentTemplate: '<p>#{회원명}님</p>' }
    )
    expect(html?.bodyHtml).toBe('<p>#{회원명}님</p>')
  })

  it('keeps detail recipientContactMasked plaintext without remasking', () => {
    const row = mapMailDeliveryDetailResponse({
      delivery: {
        deliveryId: 90,
        recipientName: '김원문',
        recipientContactMasked: 'kim.wonmun@jakorea.org',
        sendStatus: 'SENT',
      },
    })
    expect(row?.receiverName).toBe('김원문')
    expect(row?.receiverEmail).toBe('kim.wonmun@jakorea.org')
    expect(row?.receiverInfo).toContain('kim.wonmun@jakorea.org')
  })
})
