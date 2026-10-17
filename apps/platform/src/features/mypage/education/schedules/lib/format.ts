import { formatEducationSessionDate } from '../../shared'
import type { EducationScheduleItem } from '../model/types'

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
    return formatEducationSessionDate(heldAt)
  }
  return (
    item.progressTimeLabel?.trim() ||
    item.sessionLabel?.trim() ||
    item.scheduleLabel?.trim() ||
    '-'
  )
}
