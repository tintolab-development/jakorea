/**
 * 발송(POST send-batches) 성공 직후 delivery INSERT는 outbox dispatch(~5s) 이후.
 * 목록 캐시 무효화 + 1회성 short poll로 soft nav에서도 새 행을 흡수한다.
 */

export type NotificationDeliveryListChannel = 'alimtalk' | 'mail' | 'sms'

/** outbox 지연 흡수 — 무한 폴링 금지 */
export const DELIVERY_LIST_POST_SEND_POLL_MS = 8_000
export const DELIVERY_LIST_POST_SEND_POLL_INTERVAL_MS = 2_000

const awaitingUntilByChannel = new Map<NotificationDeliveryListChannel, number>()
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(listener => listener())
}

export function markNotificationDeliveryListAwaitingDispatch(
  channel: NotificationDeliveryListChannel,
  windowMs = DELIVERY_LIST_POST_SEND_POLL_MS
): void {
  awaitingUntilByChannel.set(channel, Date.now() + windowMs)
  notify()
}

export function getNotificationDeliveryListAwaitingUntil(
  channel: NotificationDeliveryListChannel
): number {
  return awaitingUntilByChannel.get(channel) ?? 0
}

export function isNotificationDeliveryListAwaitingDispatch(
  channel: NotificationDeliveryListChannel
): boolean {
  return Date.now() < getNotificationDeliveryListAwaitingUntil(channel)
}

export function subscribeNotificationDeliveryListRefresh(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** @internal tests */
export function resetNotificationDeliveryListRefreshForTests(): void {
  awaitingUntilByChannel.clear()
  notify()
}
