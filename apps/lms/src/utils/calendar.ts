/**
 * 캘린더 유틸리티 함수
 * Phase 3.1: 날짜 계산 및 캘린더 뷰 생성
 */

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, addWeeks, subWeeks } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 월간 캘린더 날짜 배열 생성
 * @param date 기준 날짜
 * @returns 달력에 표시될 날짜 배열 (이전 달/다음 달 날짜 포함)
 */
export function getMonthCalendarDates(date: Date): Date[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 일요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

/**
 * 주간 캘린더 날짜 배열 생성
 * @param date 기준 날짜 (해당 주의 날짜)
 * @returns 주간 날짜 배열
 */
export function getWeekCalendarDates(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }) // 일요일 시작
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export function formatDateString(date: Date | string): string {
  if (typeof date === 'string') {
    return date
  }
  return format(date, 'yyyy-MM-dd')
}

/**
 * 날짜가 오늘인지 확인
 */
export function isDateToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isToday(dateObj)
}

/**
 * 두 날짜가 같은 날인지 확인
 */
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const date1Obj = typeof date1 === 'string' ? new Date(date1) : date1
  const date2Obj = typeof date2 === 'string' ? new Date(date2) : date2
  return isSameDay(date1Obj, date2Obj)
}

/**
 * 날짜가 해당 월에 속하는지 확인
 */
export function isDateInMonth(date: Date | string, month: Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isSameMonth(dateObj, month)
}

/**
 * 다음 달로 이동
 */
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1)
}

/**
 * 이전 달로 이동
 */
export function getPrevMonth(date: Date): Date {
  return subMonths(date, 1)
}

/**
 * 다음 주로 이동
 */
export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1)
}

/**
 * 이전 주로 이동
 */
export function getPrevWeek(date: Date): Date {
  return subWeeks(date, 1)
}

/**
 * 날짜를 한글 형식으로 포맷 (예: "2024년 1월")
 */
export function formatMonth(date: Date): string {
  return format(date, 'yyyy년 M월', { locale: ko })
}

/**
 * 날짜를 한글 형식으로 포맷 (예: "1월 15일")
 */
export function formatDay(date: Date): string {
  return format(date, 'M월 d일', { locale: ko })
}

/**
 * 요일 한글 이름 반환 (예: "월", "화")
 */
export function getDayName(date: Date): string {
  return format(date, 'EEE', { locale: ko })
}

/**
 * 시간을 HH:mm 형식으로 포맷
 */
export function formatTime(time: string): string {
  return time
}

