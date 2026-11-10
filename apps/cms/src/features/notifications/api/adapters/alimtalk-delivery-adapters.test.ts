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

  it('keeps detail recipient name and contact plaintext without remasking', () => {
    const row = mapDeliveryDetailResponse({
      delivery: {
        deliveryId: 303,
        recipientName: '홍길동',
        recipientContactMasked: '010-2222-3333',
        sendStatus: 'SENT',
      },
    })
    expect(row?.receiverName).toBe('홍길동')
    expect(row?.receiverPhone).toBe('010-2222-3333')
    expect(row?.receiverInfo).toBe('홍길동 | 010-2222-3333')
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
    expect(row?.failedReason).toBe('자동입력 변수값이 없어 발송되지 않았습니다: 사용자 아이디(이메일)')
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
    // 세 채널 공통 라벨(메일 발송 형태 시안)
    expect(mapDeliveryToSendHistoryRow({ deliveryId: 3, sendStatus: 'WAITED' })?.sendStatus).toBe(
      '발송 대기'
    )
    expect(mapDeliveryToSendHistoryRow({ deliveryId: 4, sendStatus: 'CANCELED' })?.sendStatus).toBe(
      '발송 취소'
    )
    expect(
      mapDeliveryToSendHistoryRow({
        deliveryId: 5,
        sendStatus: 'CANCELED',
        scheduledAt: '2026-11-10T09:00:00+09:00',
      })?.sendStatus
    ).toBe('예약 취소')
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

describe('alimtalk delivery detail — plain JSON preview/alimtalkMetadata (BE JSONB 수정 후)', () => {
  const delivery = {
    deliveryId: 1576,
    templateDisplayName: '신청 접수',
    senderDisplayName: '@jakorea',
    sendStatus: 'SENT',
  }

  it.each([
    ['ORGANIZATION', 'https://www.jakorea.org/mypage/education/ORGANIZATION/123'],
    ['INDIVIDUAL', 'https://www.jakorea.org/mypage/education/INDIVIDUAL/123'],
    ['VOLUNTEER', 'https://www.jakorea.org/mypage/volunteer/VOLUNTEER/123'],
    ['INSTRUCTOR', 'https://www.jakorea.org/mypage/lectures/INSTRUCTOR/123'],
  ])('%s: preview 객체 본문 + preview.alimtalkMetadata.buttons 링크를 서버 값 그대로 사용', (_type, url) => {
    const row = mapDeliveryDetailResponse({
      delivery,
      preview: {
        renderedContent: '신청이 접수되었습니다.',
        alimtalkMetadata: {
          buttons: [{ name: '신청 확인', type: 'WL', linkMo: url, linkPc: url, ordering: 1 }],
        },
      },
    })
    expect(row?.phoneTemplate.content).toBe('신청이 접수되었습니다.')
    expect(row?.phoneTemplate.buttons).toHaveLength(1)
    expect(row?.phoneTemplate.buttons[0]?.name).toBe('신청 확인')
    expect(row?.phoneTemplate.buttons[0]?.destinations).toMatchObject({ mobile: url, pc: url })
  })

  it('신청 취소 알림: 서버 링크(미치환 포함)를 보정·재생성하지 않는다', () => {
    const raw = 'https://www.jakorea.org#{알림 링크 경로}'
    const row = mapDeliveryDetailResponse({
      delivery,
      preview: {
        renderedContent: '신청이 취소되었습니다.',
        alimtalkMetadata: { buttons: [{ name: '확인', type: 'WL', linkMo: raw, linkPc: raw }] },
      },
    })
    expect(row?.phoneTemplate.buttons[0]?.destinations).toMatchObject({ mobile: raw, pc: raw })
  })

  it('응답 최상위 alimtalkMetadata가 함께 와도 오류 없이 preview 객체 기준으로 렌더', () => {
    const row = mapDeliveryDetailResponse({
      delivery,
      preview: {
        renderedContent: '본문',
        alimtalkMetadata: { buttons: [{ name: '자세히', type: 'WL', linkMo: 'https://a', linkPc: 'https://a' }] },
      },
      alimtalkMetadata: { buttons: [{ name: '자세히', type: 'WL', linkMo: 'https://a', linkPc: 'https://a' }] },
    } as Parameters<typeof mapDeliveryDetailResponse>[0])
    expect(row?.phoneTemplate.buttons.map(button => button.name)).toEqual(['자세히'])
  })

  it('JSONB wrapper 없는 응답(alimtalkMetadata/preview 누락)에서도 오류 없이 빈 값', () => {
    expect(() => mapDeliveryDetailResponse({ delivery, preview: { renderedContent: '본문' } })).not.toThrow()
    const noMeta = mapDeliveryDetailResponse({ delivery, preview: { renderedContent: '본문' } })
    expect(noMeta?.phoneTemplate.buttons).toEqual([])
    const noPreview = mapDeliveryDetailResponse({ delivery })
    expect(noPreview?.phoneTemplate.content).toBe('')
    expect(noPreview?.phoneTemplate.buttons).toEqual([])
  })

  it('기존 실패 delivery: failedReason(알림 링크 경로 누락)을 그대로 실패로 표시', () => {
    const row = mapDeliveryDetailResponse({
      delivery: {
        ...delivery,
        sendStatus: 'FAILED',
        failedReason: 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:알림 링크 경로',
      },
      preview: { renderedContent: '본문' },
    })
    expect(row?.sendStatus).toBe('발송 실패')
    expect(row?.failedReason).toBe('자동입력 변수값이 없어 발송되지 않았습니다: 알림 링크 경로')
  })
})
