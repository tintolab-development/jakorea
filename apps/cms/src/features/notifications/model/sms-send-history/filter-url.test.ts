import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { smsSendHistoryFilterFields } from './filter-fields'
import {
  applySmsSendHistoryFiltersToSearchParams,
  readSmsSendHistoryFiltersFromParams,
  SMS_SEND_HISTORY_FILTER_URL,
} from './filter-url'

const reserveRange = (): [dayjs.Dayjs, dayjs.Dayjs] => [dayjs('2026-11-10'), dayjs('2026-11-17')]

describe('SMS 발송 조회 예약일 필터', () => {
  it('발송 시점이 예약일 때만 예약일 필드가 활성', () => {
    const reserve = (timing: '전체' | '즉시' | '예약') =>
      smsSendHistoryFilterFields(timing).find(field => field.key === 'reserveDateRange')
    expect(reserve('전체')?.disabled).toBe(true)
    expect(reserve('즉시')?.disabled).toBe(true)
    expect(reserve('예약')?.disabled).toBe(false)
  })

  it('예약이 아니면 예약일 값을 URL에 쓰지 않는다', () => {
    const base = readSmsSendHistoryFiltersFromParams(new URLSearchParams())
    const next = applySmsSendHistoryFiltersToSearchParams(new URLSearchParams(), {
      ...base,
      broadcastTiming: '즉시',
      reserveDateRange: reserveRange(),
    })
    expect(next.has(SMS_SEND_HISTORY_FILTER_URL.reserveFrom)).toBe(false)
    expect(next.has(SMS_SEND_HISTORY_FILTER_URL.reserveTo)).toBe(false)
  })

  it('예약이면 예약일 값을 URL에 쓰고 다시 읽는다', () => {
    const base = readSmsSendHistoryFiltersFromParams(new URLSearchParams())
    const next = applySmsSendHistoryFiltersToSearchParams(new URLSearchParams(), {
      ...base,
      broadcastTiming: '예약',
      reserveDateRange: reserveRange(),
    })
    expect(next.get(SMS_SEND_HISTORY_FILTER_URL.reserveFrom)).toBe('2026-11-10')
    const read = readSmsSendHistoryFiltersFromParams(next)
    expect(read.reserveDateRange?.[1]?.format('YYYY-MM-DD')).toBe('2026-11-17')
  })

  it('URL에 예약일이 남아 있어도 발송 시점이 예약이 아니면 무시한다', () => {
    const params = new URLSearchParams({
      [SMS_SEND_HISTORY_FILTER_URL.reserveFrom]: '2026-11-10',
      [SMS_SEND_HISTORY_FILTER_URL.reserveTo]: '2026-11-17',
    })
    expect(readSmsSendHistoryFiltersFromParams(params).reserveDateRange).toBeNull()
  })
})
