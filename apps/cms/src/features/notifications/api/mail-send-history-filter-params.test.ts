import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import { mailSendHistoryParamsFromFilters } from '@/features/notifications/api/mail-send-history-filter-params'
import { readMailSendHistoryFiltersFromParams } from '@/features/notifications/model/mail-send-history/filter-url'

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

    filters.sendStatus = '발송중'
    filters.receiveStatus = '수신 실패'
    const params2 = mailSendHistoryParamsFromFilters(filters)
    expect(params2.sendStatus).toBe('IN_PROGRESS')
    expect(params2.receiptStatus).toBe('DELIVERY_FAILED')
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
})
