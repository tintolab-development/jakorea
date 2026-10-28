import dayjs, { type Dayjs } from 'dayjs'
import { extractApiErrorCode, extractApiErrorDetails } from '@/shared/lib/extract-api-error-message'
import { formatDateTimeDot } from '@/shared/utils/date'

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

export const APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED =
  'APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED'
export const INSTRUCTOR_ROLE_REQUEST_NOTIFICATION_RESEND_REQUIRES_DECIDED =
  'INSTRUCTOR_ROLE_REQUEST_NOTIFICATION_RESEND_REQUIRES_DECIDED'
export const ADMIN_NOTIFICATION_RESEND_REQUIRES_DECIDED =
  'ADMIN_NOTIFICATION_RESEND_REQUIRES_DECIDED'

const NOTIFICATION_TIMING_ERROR_MESSAGES: Record<string, string> = {
  INVALID_NOTIFICATION_SCHEDULE:
    '알림 예약 일시가 올바르지 않습니다. 현재 시각보다 최소 1분 이후의 시간을 선택해 주세요.',
  [APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED]:
    '프로그램 발표일이 설정되지 않아 발표일 발송을 예약할 수 없습니다. 발표일을 설정하거나 다른 발송 시점을 선택해 주세요.',
  [INSTRUCTOR_ROLE_REQUEST_NOTIFICATION_RESEND_REQUIRES_DECIDED]:
    '승인 또는 반려가 완료된 강사 권한 신청만 알림을 재발송할 수 있습니다.',
  [ADMIN_NOTIFICATION_RESEND_REQUIRES_DECIDED]:
    '승인 또는 반려가 완료된 관리자 신청만 알림을 재발송할 수 있습니다.',
}

export function getNotificationTimingApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  const code = extractApiErrorCode(data)
  if (!code) return null
  if (code === 'INVALID_NOTIFICATION_SCHEDULE') {
    return getNotificationScheduleError(error)?.message ?? NOTIFICATION_TIMING_ERROR_MESSAGES[code]
  }
  return NOTIFICATION_TIMING_ERROR_MESSAGES[code] ?? null
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
      ? `현재 시각보다 최소 1분 이후의 시간을 선택해 주세요. 허용 가능한 최소 시각: ${formatDateTimeDot(minimum)}`
      : '현재 시각보다 최소 1분 이후의 시간을 선택해 주세요.',
  }
}
