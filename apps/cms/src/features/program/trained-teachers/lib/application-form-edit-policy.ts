import dayjs, { type Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'

/**
 * 교육받은 교사 — 신청 양식 수정 가능 여부.
 * 기획: 모집 시작 전까지만 수정 가능, 기간이 지난 경우 버튼 비활성화.
 */
export function isTrainedTeachersApplicationFormEditable(
  program: Program | null,
  now: Dayjs = dayjs()
): boolean {
  const start = program?.applicationStartDate
  if (start == null) return true
  const startDay = dayjs(start)
  if (!startDay.isValid()) return true
  return now.isBefore(startDay)
}
