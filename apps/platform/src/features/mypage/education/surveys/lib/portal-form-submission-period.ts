import type { EducationSurveyListEntry } from './survey-list-types'

function startOfLocalDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(part => Number(part))
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function endOfLocalDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(part => Number(part))
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

type PeriodFields = Pick<EducationSurveyListEntry, 'startAt' | 'endAt'>

/**
 * BE가 반환한 submissionStartAt/EndAt(목록의 startAt/endAt) 기준 작성 가능 여부.
 * FE는 목록에서 항목을 제거하지 않고, 기간 밖이면 read-only로만 처리한다.
 */
export function isPortalFormSubmissionPeriodOpen(
  entry: PeriodFields,
  at: Date = new Date(),
): boolean {
  const startAt = entry.startAt?.trim()
  if (startAt) {
    const start = startOfLocalDay(startAt)
    if (!Number.isNaN(start.getTime()) && at < start) return false
  }

  const endAt = entry.endAt?.trim()
  if (endAt) {
    const end = endOfLocalDay(endAt)
    if (!Number.isNaN(end.getTime()) && at > end) return false
  }

  return true
}
