import dayjs, { type Dayjs } from 'dayjs'

/** 알림 예약은 현재 시각보다 이후여야 하므로 제출 여유를 둔 미래 시각으로 초기화한다. */
export function getDefaultManualNotifyAt(): Dayjs {
  return dayjs().add(2, 'minute').startOf('minute')
}

export function isFutureNotificationTime(value?: Dayjs | null): boolean {
  return value != null && value.isValid() && value.isAfter(dayjs())
}
