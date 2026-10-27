/** PermissionModal 알림 라디오와 동일한 UI 값 */
export type NotifyTimingUiValue = 'immediate' | 'on_announcement' | 'manual'

/** API가 받는 알림 시점. `immediate`는 항상 허용한다. */
export type NotifyTimingCapability = {
  scheduled: boolean
  onAnnouncement: boolean
}

export const NOTIFY_TIMING_CAPABILITY = {
  /** TimedBulk·기관 반려·개인 일정 승인·최종 반려 — IMMEDIATE | SCHEDULED | ON_ANNOUNCEMENT */
  timedBulk: { scheduled: true, onAnnouncement: true } satisfies NotifyTimingCapability,
  /** 권한 재발송·강사 배정 create — IMMEDIATE | SCHEDULED */
  scheduledOnly: { scheduled: true, onAnnouncement: false } satisfies NotifyTimingCapability,
  /** 시점 필드 없는 API — 즉시 발송만 */
  immediateOnly: { scheduled: false, onAnnouncement: false } satisfies NotifyTimingCapability,
  /** 단건 기관 승인·강사 중첩 Notification·서류 결과 등 */
  full: { scheduled: true, onAnnouncement: true } satisfies NotifyTimingCapability,
} as const

export const UNSUPPORTED_NOTIFY_TIMING_ALERT_TITLE = '알림 발송 시점 확인'

export const UNSUPPORTED_ANNOUNCEMENT_NOTIFY_MESSAGE =
  '현재 이 기능은 발표일 발송을 지원하지 않습니다. 즉시 발송 또는 직접 설정을 선택해 주세요.'

export const UNSUPPORTED_ANNOUNCEMENT_IMMEDIATE_ONLY_MESSAGE =
  '현재 이 기능은 발표일 발송을 지원하지 않습니다. 즉시 발송을 선택해 주세요.'

export const UNSUPPORTED_MANUAL_NOTIFY_MESSAGE =
  '현재 이 기능은 예약 발송을 지원하지 않습니다. 즉시 발송을 선택해 주세요.'

export class UnsupportedNotifyTimingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedNotifyTimingError'
  }
}

export function getUnsupportedNotifyTimingMessage(
  notifyTiming: NotifyTimingUiValue | string | null | undefined,
  capability: NotifyTimingCapability
): string | null {
  if (notifyTiming === 'on_announcement' && !capability.onAnnouncement) {
    return capability.scheduled
      ? UNSUPPORTED_ANNOUNCEMENT_NOTIFY_MESSAGE
      : UNSUPPORTED_ANNOUNCEMENT_IMMEDIATE_ONLY_MESSAGE
  }
  if (notifyTiming === 'manual' && !capability.scheduled) {
    return UNSUPPORTED_MANUAL_NOTIFY_MESSAGE
  }
  return null
}

export function isNotifyTimingSupported(
  notifyTiming: NotifyTimingUiValue | string | null | undefined,
  capability: NotifyTimingCapability
): boolean {
  return getUnsupportedNotifyTimingMessage(notifyTiming, capability) == null
}

export function assertNotifyTimingSupported(
  notifyTiming: NotifyTimingUiValue | string | null | undefined,
  capability: NotifyTimingCapability
): void {
  const message = getUnsupportedNotifyTimingMessage(notifyTiming, capability)
  if (message) {
    throw new UnsupportedNotifyTimingError(message)
  }
}
