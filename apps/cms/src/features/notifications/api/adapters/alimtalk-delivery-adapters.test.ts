import { describe, expect, it } from 'vitest'
import {
  mapDeliveryDetailResponse,
  mapDeliveryToSendHistoryRow,
} from './alimtalk-delivery-adapters'
import { alimtalkSendHistoryParamsFromFilters } from '@/features/notifications/api/alimtalk-send-history-filter-params'
import { readSendHistoryFiltersFromParams } from '@/features/notifications/model/alimtalk-send-history/filter-url'
import { formatDeliveryDateTimeSeoul } from '@/features/notifications/model/alimtalk-send-history/format-datetime'
import dayjs from 'dayjs'

describe('alimtalk-delivery-adapters (4-2)', () => {
  it('Hub 접수 건: sentAt 유지, preview 본문·버튼·헤더 매핑', () => {
    const row = mapDeliveryDetailResponse({
      delivery: {
        deliveryId: 101,
        templateId: 55,
        templateDisplayName: '비밀번호 안내',
        senderDisplayName: '@jakorea',
        senderKey: 'profile-1',
        recipientName: '홍*동',
        recipientContactMasked: '***-****-5678',
        sendStatus: 'SENT',
        receiptStatus: 'SUCCESS',
        requestedAt: '2026-09-08T01:00:00Z',
        sentAt: '2026-09-08T01:00:05Z',
        deliveredAt: '2026-09-08T01:00:10Z',
        providerMessageId: 'hub-msg-1',
        sendTiming: 'IMMEDIATE',
      },
      preview: {
        contentTemplate: '템플릿 원문 #{name}',
        renderedContent: '치환된 본문 홍길동님',
        senderDisplay: '@jakorea채널',
        alimtalkMessageType: 'BASIC',
        alimtalkEmphasisType: 'NONE',
        alimtalkMetadata: {
          buttons: [{ type: 'WL', name: '자세히 보기' }],
        },
      },
    })

    expect(row?.sentAt).toBe('2026-09-08T01:00:05Z')
    expect(row?.receivedAt).toBe('2026-09-08T01:00:10Z')
    expect(row?.sendStatus).toBe('발송 성공')
    expect(row?.senderInfo).toBe('@jakorea')
    expect(row?.receiverInfo).toBe('홍*동 | ***-****-5678')
    expect(row?.phoneTemplate.content).toBe('치환된 본문 홍길동님')
    expect(row?.phoneTemplate.senderProfile).toBe('@jakorea채널')
    expect(row?.phoneTemplate.buttons.some(button => button.name === '자세히 보기')).toBe(true)
  })

  it('변수 누락 실패: SEND_FAILED + failedReason, 발송/수신일시 빈 값', () => {
    const row = mapDeliveryToSendHistoryRow({
      deliveryId: 202,
      templateDisplayName: '필수변수 템플릿',
      senderDisplayName: 'JA',
      recipientName: null as unknown as string,
      recipientContactMasked: '***-****-0001',
      sendStatus: 'SEND_FAILED',
      failedReason: 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:사용자 아이디(이메일)',
      requestedAt: '2026-09-08T02:00:00Z',
      sentAt: undefined,
      deliveredAt: undefined,
    })

    expect(row?.sendStatus).toBe('발송 실패')
    expect(row?.failedReason).toBe('템플릿 필수 변수가 없습니다: 사용자 아이디(이메일)')
    expect(row?.sentAt).toBe('')
    expect(row?.receivedAt).toBe('')
    expect(row?.receiverName).toBe('-')
    expect(formatDeliveryDateTimeSeoul(row?.sentAt)).toBe('-')
    expect(formatDeliveryDateTimeSeoul(row?.receivedAt)).toBe('-')
  })

  it('UNKNOWN/미지 코드는 REQUESTED로 떨어지지 않는다', () => {
    expect(mapDeliveryToSendHistoryRow({ deliveryId: 1, sendStatus: 'FAILED' })?.sendStatus).toBe(
      '발송 실패'
    )
    expect(mapDeliveryToSendHistoryRow({ deliveryId: 2, sendStatus: 'WEIRD' })?.sendStatus).toBe(
      '확인불가'
    )
    expect(mapDeliveryToSendHistoryRow({ deliveryId: 3, sendStatus: 'WAITED' })?.sendStatus).toBe(
      '대기'
    )
    expect(mapDeliveryToSendHistoryRow({ deliveryId: 4, sendStatus: 'CANCELED' })?.sendStatus).toBe(
      '취소'
    )
  })

  it('sentAt이 없을 때 deliveredAt/requestedAt으로 대체하지 않는다', () => {
    const row = mapDeliveryToSendHistoryRow({
      deliveryId: 9,
      sendStatus: 'REQUESTED',
      requestedAt: '2026-09-08T03:00:00Z',
      deliveredAt: '2026-09-08T03:05:00Z',
    })
    expect(row?.sentAt).toBe('')
    expect(row?.receivedAt).toBe('2026-09-08T03:05:00Z')
  })
})

describe('alimtalk send-history 4-1 filters', () => {
  it('기본 URL에서는 requestedFrom/To만 API에 넣고 sent/delivered/scheduled는 생략', () => {
    const filters = readSendHistoryFiltersFromParams(new URLSearchParams())
    expect(filters.requestDateRange?.[0]).toBeTruthy()
    expect(filters.sendDateRange).toBeNull()
    expect(filters.receiveDateRange).toBeNull()
    expect(filters.reserveDateRange).toBeNull()

    const params = alimtalkSendHistoryParamsFromFilters(filters)
    expect(params.channelType).toBe('ALIMTALK')
    expect(params.requestedFrom).toBeTruthy()
    expect(params.requestedTo).toBeTruthy()
    expect(params.sentFrom).toBeUndefined()
    expect(params.sentTo).toBeUndefined()
    expect(params.deliveredFrom).toBeUndefined()
    expect(params.scheduledFrom).toBeUndefined()
  })

  it('사용자가 발송일을 켠 경우에만 sentFrom/To 전송', () => {
    const filters = readSendHistoryFiltersFromParams(new URLSearchParams())
    filters.sendDateRange = [dayjs('2026-09-01'), dayjs('2026-09-07')]
    const params = alimtalkSendHistoryParamsFromFilters(filters)
    expect(params.sentFrom).toBe('2026-09-01')
    expect(params.sentTo).toBe('2026-09-07')
    expect(params.requestedFrom).toBeTruthy()
  })
})
