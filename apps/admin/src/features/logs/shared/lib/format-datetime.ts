/** 로그 일시 표시: YYYY.MM.DD HH:mm */
import { formatDateTimeDot } from '@/shared/lib/format-display'

export function formatLogDateTime(iso: string | null | undefined): string {
  return formatDateTimeDot(iso)
}
