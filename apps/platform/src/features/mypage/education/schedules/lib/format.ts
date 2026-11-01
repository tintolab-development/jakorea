import { formatEducationSessionDate } from '../../shared'
import type { EducationScheduleItem } from '../model/types'
import { joinEducationScheduleDateAndTime } from './held-label'

/** @deprecated Use formatEducationSessionDate */
export const formatEducationScheduleHeldAt = formatEducationSessionDate

export function resolveEducationScheduleDateLabel(
  item: Pick<
    EducationScheduleItem,
    'heldAt' | 'progressTimeLabel' | 'sessionLabel' | 'scheduleLabel' | 'scheduleId'
  >,
): string {
  if (item.scheduleId === null) {
    const heldAt = item.heldAt?.trim()
    if (heldAt && !Number.isNaN(new Date(heldAt).getTime())) {
      return formatEducationSessionDate(heldAt)
    }
    const timeOrLabel =
      item.progressTimeLabel?.trim() ||
      item.sessionLabel?.trim() ||
      item.scheduleLabel?.trim()
    if (timeOrLabel) return timeOrLabel
    return '일정 미등록'
  }
  const heldAt = item.heldAt?.trim()
  if (heldAt && !Number.isNaN(new Date(heldAt).getTime())) {
    return joinEducationScheduleDateAndTime(
      formatEducationSessionDate(heldAt),
      item.progressTimeLabel,
    )
  }
  return (
    item.progressTimeLabel?.trim() ||
    item.sessionLabel?.trim() ||
    item.scheduleLabel?.trim() ||
    '-'
  )
}

/**
 * 교육일정 카드 행 날짜 라벨 — 날짜만 노출(진행 시간 제외).
 * 일시가 없으면 기존 라벨 규칙(`resolveEducationScheduleDateLabel`)을 따른다.
 */
export function resolveEducationScheduleRowDateLabel(
  item: Parameters<typeof resolveEducationScheduleDateLabel>[0],
): string {
  const heldAt = item.heldAt?.trim()
  if (heldAt && !Number.isNaN(new Date(heldAt).getTime())) {
    return formatEducationSessionDate(heldAt)
  }
  return resolveEducationScheduleDateLabel(item)
}
