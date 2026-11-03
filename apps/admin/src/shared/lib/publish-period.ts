/**
 * 게시 기간 (팝업·띠배너) — 시작일 00:00 ~ 종료일 23:59 포함, 다음 날 00:00부터 만료 (기획 2026-10-23 A안)
 */

import dayjs, { type Dayjs } from 'dayjs'

/** @param subjectWithTopic 조사 포함 대상명 (예: `팝업은`, `띠배너는`) */
export function buildPublishPeriodExpiredAlert(subjectWithTopic: string): {
  title: string
  content: string
} {
  return {
    title: '게시 기간 만료',
    content: `게시 종료일이 지난 ${subjectWithTopic} 사용할 수 없습니다.\n게시 기간을 다시 설정해 주세요.`,
  }
}

export function isPublishPeriodExpired(
  periodEnd: string | Dayjs | null | undefined,
  today: Dayjs = dayjs()
): boolean {
  if (!periodEnd) return false
  const end = dayjs(periodEnd)
  return end.isValid() && end.isBefore(today, 'day')
}

/**
 * 오늘 이전 날짜는 선택 불가. 저장된 시작일은 진행 중 항목의 종료일만 바꿀 수 있도록 선택 가능하게 둔다.
 */
export function createPublishPeriodDisabledDate(
  savedStart: string | null | undefined,
  today: Dayjs = dayjs()
): (current: Dayjs) => boolean {
  const saved = savedStart ? dayjs(savedStart) : null
  return current => {
    if (!current.isBefore(today, 'day')) return false
    return !(saved?.isValid() && current.isSame(saved, 'day'))
  }
}
