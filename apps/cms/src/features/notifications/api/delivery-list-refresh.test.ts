import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getNotificationDeliveryListAwaitingUntil,
  isNotificationDeliveryListAwaitingDispatch,
  markNotificationDeliveryListAwaitingDispatch,
  resetNotificationDeliveryListRefreshForTests,
  subscribeNotificationDeliveryListRefresh,
} from './delivery-list-refresh'

describe('delivery-list-refresh', () => {
  afterEach(() => {
    resetNotificationDeliveryListRefreshForTests()
    vi.useRealTimers()
  })

  it('mark 후 awaiting 구간 동안 true', () => {
    vi.useFakeTimers()
    markNotificationDeliveryListAwaitingDispatch('alimtalk', 5_000)
    expect(isNotificationDeliveryListAwaitingDispatch('alimtalk')).toBe(true)
    expect(isNotificationDeliveryListAwaitingDispatch('mail')).toBe(false)

    vi.advanceTimersByTime(4_999)
    expect(isNotificationDeliveryListAwaitingDispatch('alimtalk')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(isNotificationDeliveryListAwaitingDispatch('alimtalk')).toBe(false)
  })

  it('subscribe에 mark를 알린다', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeNotificationDeliveryListRefresh(listener)
    markNotificationDeliveryListAwaitingDispatch('sms')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getNotificationDeliveryListAwaitingUntil('sms')).toBeGreaterThan(Date.now())
    unsubscribe()
    markNotificationDeliveryListAwaitingDispatch('sms')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
