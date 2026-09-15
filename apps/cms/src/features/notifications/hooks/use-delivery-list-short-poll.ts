import { useEffect, useState } from 'react'
import {
  getNotificationDeliveryListAwaitingUntil,
  subscribeNotificationDeliveryListRefresh,
  type NotificationDeliveryListChannel,
} from '@/features/notifications/api/delivery-list-refresh'

/**
 * 발송 직후 목록이 이미 마운트됐거나 soft nav로 들어온 경우
 * `refetchInterval`을 유한 시간만 켠다.
 */
export function useDeliveryListShortPoll(channel: NotificationDeliveryListChannel): boolean {
  const [, setTick] = useState(0)
  const awaitingUntil = getNotificationDeliveryListAwaitingUntil(channel)
  const enabled = Date.now() < awaitingUntil

  useEffect(() => subscribeNotificationDeliveryListRefresh(() => setTick(n => n + 1)), [])

  useEffect(() => {
    if (!enabled) return
    const remaining = awaitingUntil - Date.now()
    if (remaining <= 0) {
      setTick(n => n + 1)
      return
    }
    const id = window.setTimeout(() => setTick(n => n + 1), remaining)
    return () => window.clearTimeout(id)
  }, [channel, enabled, awaitingUntil])

  return enabled
}
