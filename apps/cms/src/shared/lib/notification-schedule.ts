import dayjs, { type Dayjs } from 'dayjs'
import { extractApiErrorCode, extractApiErrorDetails } from '@/shared/lib/extract-api-error-message'

export const NOTIFICATION_MIN_LEAD_TIME_SECONDS = 60

export function getMinimumManualNotifyAt(now: Dayjs = dayjs()): Dayjs {
  return now.add(NOTIFICATION_MIN_LEAD_TIME_SECONDS, 'second')
}

/** 알림 예약은 서버 처리 여유를 위해 현재 시각보다 최소 1분 뒤로 초기화한다. */
export function getDefaultManualNotifyAt(): Dayjs {
  return dayjs().add(2, 'minute').startOf('minute')
}

export function isFutureNotificationTime(value?: Dayjs | null, now: Dayjs = dayjs()): boolean {
  return value != null && value.isValid() && !value.isBefore(getMinimumManualNotifyAt(now))
}

export type NotificationScheduleError = {
  minimumScheduledAt?: Dayjs
  message: string
}

export function getNotificationScheduleError(error: unknown): NotificationScheduleError | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data
  if (extractApiErrorCode(data) !== 'INVALID_NOTIFICATION_SCHEDULE') return null
  const details = extractApiErrorDetails(data)
  const minimum = details.minimumScheduledAt ? dayjs(details.minimumScheduledAt) : undefined
  return {
    minimumScheduledAt: minimum?.isValid() ? minimum : undefined,
    message: minimum?.isValid()
      ? `현재 시각보다 최소 1분 이후의 시간을 선택해 주세요. 허용 가능한 최소 시각: ${minimum.format('YYYY. MM. DD HH:mm')}`
      : '현재 시각보다 최소 1분 이후의 시간을 선택해 주세요.',
  }
}
