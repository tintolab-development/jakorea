import type { Dayjs } from 'dayjs'

export const DEFAULT_ADMIN_DATE_PLACEHOLDER = '날짜를 선택해 주세요'
export const DEFAULT_ADMIN_TIME_PLACEHOLDER = '시간을 선택해 주세요'
export const ADMIN_TIME_FORMAT = 'HH:mm'

export function formatAdminDatePlain(value: Dayjs | null | undefined): string {
  if (value == null) return ''
  return value.format('YYYY.MM.DD')
}

export function formatAdminDateTimePlain(value: Dayjs | null | undefined): string {
  if (value == null) return ''
  return value.format('YYYY.MM.DD HH:mm')
}
