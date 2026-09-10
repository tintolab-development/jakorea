import { describe, expect, it } from 'vitest'
import { smsSendHistoryParamsFromFilters } from '@/features/notifications/api/sms-send-history-filter-params'
import { readSmsSendHistoryFiltersFromParams } from '@/features/notifications/model/sms-send-history/filter-url'

describe('sms send-history content filter', () => {
  it('문자 내용 검색은 content|renderedContentPreview (templateName 위장 금지)', () => {
    const filters = readSmsSendHistoryFiltersFromParams(new URLSearchParams())
    filters.content = '안내드립니다'
    const params = smsSendHistoryParamsFromFilters(filters)
    expect(params.content).toBe('안내드립니다')
    expect(params.renderedContentPreview).toBe('안내드립니다')
    expect(params.templateName).toBeUndefined()
    expect(params.templateCode).toBeUndefined()
  })
})
