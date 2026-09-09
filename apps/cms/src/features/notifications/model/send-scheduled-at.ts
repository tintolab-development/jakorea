import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { formatAppDatepickerDisplay } from '@/shared/ui/app-datepicker'

/** BE: scheduledAt must be in the future — 클라이언트 안내 문구 */
export const SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE = '예약 시간은 현재 이후여야 합니다.'

/** DatePicker·검증 공통 여유(초). 제출 직전 경계 오차 완화 */
export const SCHEDULED_AT_MIN_BUFFER_SECONDS = 60

/** 문자·메일·알림톡 발송 예약: 분 단위 스텝 (초 미사용) */
export const NOTIFICATION_SEND_SCHEDULE_MINUTE_STEP = 30

/** Ant Design `showTime` — 발송 화면 전용 (공유 CmsDatePicker 기본값과 분리) */
export const NOTIFICATION_SEND_SCHEDULE_SHOW_TIME = {
  format: 'HH:mm',
  minuteStep: NOTIFICATION_SEND_SCHEDULE_MINUTE_STEP,
} as const

export type NotificationSendTiming = 'immediate' | 'scheduled'

/** 입력 표시: YYYY. MM. DD(요일) HH:mm */
export function formatNotificationSendScheduleDisplay(
  value: Dayjs | null | undefined
): string {
  if (value == null) return ''
  return `${formatAppDatepickerDisplay(value)} ${value.format('HH:mm')}`
}

/** 분 스텝·초 절삭 (DatePicker onChange용) */
export function snapNotificationSendSchedule(
  value: Dayjs | null,
  minuteStep: number = NOTIFICATION_SEND_SCHEDULE_MINUTE_STEP
): Dayjs | null {
  if (!value) return null
  const step = minuteStep > 0 ? minuteStep : 1
  const rawMinute = value.minute()
  let snappedMinute = Math.round(rawMinute / step) * step
  let next = value.second(0).millisecond(0)
  if (snappedMinute >= 60) {
    next = next.add(1, 'hour')
    snappedMinute = 0
  }
  return next.minute(snappedMinute)
}

/** 예약 발송 기본값 — 현재(+buffer) 이후 가장 가까운 30분 슬롯 */
export function nextNotificationSendSchedule(
  now: Dayjs = dayjs(),
  minuteStep: number = NOTIFICATION_SEND_SCHEDULE_MINUTE_STEP,
  bufferSeconds: number = SCHEDULED_AT_MIN_BUFFER_SECONDS
): Dayjs {
  const min = now.add(bufferSeconds, 'second')
  let candidate =
    snapNotificationSendSchedule(min, minuteStep) ?? min.second(0).millisecond(0)
  while (!candidate.isAfter(min)) {
    candidate = candidate.add(minuteStep > 0 ? minuteStep : 1, 'minute')
  }
  return candidate
}

/** 예약 발송용 Instant ISO — 즉시면 undefined (body에서 키 생략) */
export function resolveScheduledAtForCreateRequest(input: {
  sendTiming: NotificationSendTiming
  scheduledAt: string | null | undefined
}): string | undefined {
  if (input.sendTiming !== 'scheduled') return undefined
  const trimmed = input.scheduledAt?.trim()
  return trimmed || undefined
}

export function isScheduledAtInFuture(
  scheduledAtIso: string,
  nowMs: number = Date.now(),
  bufferSeconds: number = SCHEDULED_AT_MIN_BUFFER_SECONDS
): boolean {
  const ms = Date.parse(scheduledAtIso)
  if (!Number.isFinite(ms)) return false
  return ms > nowMs + bufferSeconds * 1000
}

/** sendTiming/scheduledAt 클라이언트 검증. 통과 시 null */
export function validateNotificationScheduledAt(input: {
  sendTiming: NotificationSendTiming
  scheduledAt: string | null | undefined
  nowMs?: number
}): string | null {
  if (input.sendTiming !== 'scheduled') return null
  const trimmed = input.scheduledAt?.trim()
  if (!trimmed) return '예약 일시를 선택하세요.'
  if (!isScheduledAtInFuture(trimmed, input.nowMs)) {
    return SCHEDULED_AT_MUST_BE_FUTURE_MESSAGE
  }
  return null
}

/** Ant Design DatePicker: 오늘 이전 날짜 비활성 */
export function disablePastScheduleDates(current: Dayjs | null): boolean {
  if (!current) return false
  return current.endOf('day').isBefore(dayjs())
}

type DisabledTimeParts = {
  disabledHours?: () => number[]
  disabledMinutes?: (selectedHour: number) => number[]
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[]
}

function range(start: number, end: number): number[] {
  const list: number[] = []
  for (let i = start; i < end; i += 1) list.push(i)
  return list
}

/** 오늘 선택 시 현재(+buffer) 이전 시·분·초 비활성 */
export function disablePastScheduleTimes(
  current: Dayjs | null,
  bufferSeconds: number = SCHEDULED_AT_MIN_BUFFER_SECONDS
): DisabledTimeParts {
  const min = dayjs().add(bufferSeconds, 'second')
  if (!current || !current.isSame(min, 'day')) return {}

  return {
    disabledHours: () => range(0, min.hour()),
    disabledMinutes: (selectedHour: number) =>
      selectedHour === min.hour() ? range(0, min.minute()) : [],
    disabledSeconds: (selectedHour: number, selectedMinute: number) =>
      selectedHour === min.hour() && selectedMinute === min.minute()
        ? range(0, min.second())
        : [],
  }
}
