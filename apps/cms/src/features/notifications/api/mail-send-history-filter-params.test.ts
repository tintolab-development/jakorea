import { afterEach, describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'
import { mailSendHistoryParamsFromFilters } from '@/features/notifications/api/mail-send-history-filter-params'
import {
  defaultMailSendHistoryDateRange,
  readMailSendHistoryFiltersFromParams,
} from '@/features/notifications/model/mail-send-history/filter-url'

describe('mail send-history 4-1 filters', () => {
  it('기본 URL에서는 requestedFrom/To만 API에 넣고 sent/delivered/scheduled는 생략', () => {
    const filters = readMailSendHistoryFiltersFromParams(new URLSearchParams())
    expect(filters.requestDateRange?.[0]).toBeTruthy()
    expect(filters.sendDateRange).toBeNull()
    expect(filters.receiveDateRange).toBeNull()
    expect(filters.reserveDateRange).toBeNull()

    const params = mailSendHistoryParamsFromFilters(filters)
    expect(params.channelType).toBe('EMAIL')
    expect(params.requestedFrom).toBeTruthy()
    expect(params.requestedTo).toBeTruthy()
    expect(params.sentFrom).toBeUndefined()
    expect(params.sentTo).toBeUndefined()
    expect(params.deliveredFrom).toBeUndefined()
    expect(params.scheduledFrom).toBeUndefined()
  })

  it('사용자가 발송일을 켠 경우에만 sentFrom/To 전송', () => {
    const filters = readMailSendHistoryFiltersFromParams(new URLSearchParams())
    filters.sendDateRange = [dayjs('2026-09-01'), dayjs('2026-09-07')]
    const params = mailSendHistoryParamsFromFilters(filters)
    expect(params.sentFrom).toBe('2026-09-01')
    expect(params.sentTo).toBe('2026-09-07')
  })

  it('sendStatus/receiptStatus를 SSOT enum으로 매핑', () => {
    const filters = readMailSendHistoryFiltersFromParams(new URLSearchParams())
    filters.sendStatus = '예약'
    filters.receiveStatus = '확인 대기중'
    const params = mailSendHistoryParamsFromFilters(filters)
    expect(params.sendStatus).toBe('SCHEDULED')
    expect(params.receiptStatus).toBe('CONFIRM_WAITED')

    filters.sendStatus = '발송 중'
    filters.receiveStatus = '수신 실패'
    const params2 = mailSendHistoryParamsFromFilters(filters)
    expect(params2.sendStatus).toBe('IN_PROGRESS')
    expect(params2.receiptStatus).toBe('DELIVERY_FAILED')
  })

  it('이전 라벨로 저장된 URL의 발송 현황도 같은 enum으로 매핑', () => {
    const params = mailSendHistoryParamsFromFilters(
      readMailSendHistoryFiltersFromParams(new URLSearchParams('mail_send_status=발송중'))
    )
    expect(params.sendStatus).toBe('IN_PROGRESS')
  })

  it('메일 제목 검색은 title|subject|renderedTitle (templateName 위장 금지)', () => {
    const filters = readMailSendHistoryFiltersFromParams(new URLSearchParams())
    filters.subject = '워크숍 안내'
    const params = mailSendHistoryParamsFromFilters(filters)
    expect(params.title).toBe('워크숍 안내')
    expect(params.subject).toBe('워크숍 안내')
    expect(params.renderedTitle).toBe('워크숍 안내')
    expect(params.templateName).toBeUndefined()
    expect(params.templateCode).toBeUndefined()
  })

  describe('QA-0342 기본 조회 기간', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('기본 기간은 최근 7일 ~ 오늘이다', () => {
      const [from, to] = defaultMailSendHistoryDateRange(dayjs('2026-11-12T15:30:00'))
      expect(from.format('YYYY-MM-DD')).toBe('2026-11-05')
      expect(to.format('YYYY-MM-DD')).toBe('2026-11-12')
    })

    it('기본 URL 조회는 지난 7일 요청분을 API에 보낸다', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-12T09:00:00'))
      const params = mailSendHistoryParamsFromFilters(
        readMailSendHistoryFiltersFromParams(new URLSearchParams())
      )
      expect(params.requestedFrom).toBe('2026-11-05')
      expect(params.requestedTo).toBe('2026-11-12')
    })

    it('요청일을 비우면 API 기본값도 같은 기간을 쓴다', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-12T09:00:00'))
      const filters = readMailSendHistoryFiltersFromParams(new URLSearchParams())
      filters.requestDateRange = null
      const params = mailSendHistoryParamsFromFilters(filters)
      expect(params.requestedFrom).toBe('2026-11-05')
      expect(params.requestedTo).toBe('2026-11-12')
    })

    it('예약일 필터는 사용자가 켠 값을 그대로 보낸다', () => {
      const filters = readMailSendHistoryFiltersFromParams(new URLSearchParams())
      filters.reserveDateRange = [dayjs('2026-11-20'), dayjs('2026-11-30')]
      const params = mailSendHistoryParamsFromFilters(filters)
      expect(params.scheduledFrom).toBe('2026-11-20')
      expect(params.scheduledTo).toBe('2026-11-30')
    })
  })
})
