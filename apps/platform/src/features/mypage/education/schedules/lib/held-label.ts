import { isScheduleDateLikeText } from '../../../../../shared/lib/format-display-date.ts'

/**
 * 교육일정 카드 날짜 + 진행 시간 라벨.
 * 진행 시간 라벨이 이미 날짜로 시작하면(서버 progressTimeLabel 또는 startAt~endAt 폴백
 * `2026년 10월 31일(토) 21:20 ~ 21:22`) 날짜를 한 번 더 붙이지 않는다.
 */
export function joinEducationScheduleDateAndTime(date: string, time: string | null | undefined): string {
  const trimmedTime = time?.trim()
  if (!trimmedTime || date.includes(trimmedTime)) return date
  if (isScheduleDateLikeText(trimmedTime)) return trimmedTime
  return `${date} ${trimmedTime}`
}
