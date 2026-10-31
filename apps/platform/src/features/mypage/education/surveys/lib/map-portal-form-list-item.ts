import { toSeoulDateOnly } from '../../../../../shared/lib/format-display-date.ts'
import { mapPortalFormListItemToSurveyEntry } from '../../applications/lib/portal-form-list'
import type { PortalFormListItem } from '../../applications/api/activity-client'
import type { EducationSurveyListEntry } from './survey-list-types'

/** Portal program-applications `forms` item.status (BE SSOT) */
export type PortalFormResponseStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'DONE'

/** ISO 또는 YYYY-MM-DD — 목록 표시용 서울 달력 날짜 (null-safe) */
export function slicePortalFormDate(iso: string | null | undefined): string | undefined {
  return toSeoulDateOnly(iso)
}

/**
 * Portal `forms` items[] → 설문·만족도 목록 entry.
 * bindingId 없으면 null (render/submit 호출 금지).
 */
export function mapPortalFormListItem(item: PortalFormListItem): EducationSurveyListEntry | null {
  const entry = mapPortalFormListItemToSurveyEntry(item)
  if (!entry) return null

  return {
    ...entry,
    startAt: slicePortalFormDate(item.submissionStartAt) ?? entry.startAt,
    endAt: slicePortalFormDate(item.submissionEndAt) ?? entry.endAt,
    createdAt: item.submissionStartAt?.trim() ? item.submissionStartAt : entry.createdAt,
  }
}
