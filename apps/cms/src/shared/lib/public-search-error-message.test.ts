import { describe, expect, it } from 'vitest'
import { NETWORK_ERROR_ALERT_CONTENT } from '@/shared/lib/extract-api-error-message'
import { toPublicSearchErrorMessage } from '@/shared/lib/public-search-error-message'

describe('toPublicSearchErrorMessage', () => {
  it('replaces browser and HTTP developer messages with the network error copy', () => {
    expect(toPublicSearchErrorMessage(new TypeError('Failed to fetch'))).toBe(
      NETWORK_ERROR_ALERT_CONTENT
    )
    expect(toPublicSearchErrorMessage(new Error('HTTP 500'))).toBe(NETWORK_ERROR_ALERT_CONTENT)
    expect(toPublicSearchErrorMessage(new Error('API 오류'))).toBe(NETWORK_ERROR_ALERT_CONTENT)
    expect(toPublicSearchErrorMessage(new Error('  '))).toBe(NETWORK_ERROR_ALERT_CONTENT)
  })

  it('keeps Korean guidance from the API or the key check', () => {
    expect(toPublicSearchErrorMessage(new Error('커리어넷 API 키가 설정되지 않았습니다.'))).toBe(
      '커리어넷 API 키가 설정되지 않았습니다.'
    )
  })
})
