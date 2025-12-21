/**
 * 날짜 유틸리티 함수
 */

import { format as formatFns } from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatFns(dateObj, formatStr, { locale: ko })
}





