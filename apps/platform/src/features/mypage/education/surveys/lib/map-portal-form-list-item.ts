import type { PortalFormListItem } from '../../applications/api/activity-client'
import type { EducationSurveyListEntry } from './mock-survey-list'

/** Portal program-applications `forms` item.status (BE SSOT) */
export type PortalFormResponseStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'DONE'

const SUBMITTED_STATUSES: ReadonlySet<string> = new Set(['SUBMITTED', 'COMPLETED', 'DONE'])

/** ISO 또는 YYYY-MM-DD — 목록 표시용 날짜 부분만 (null-safe) */
export function slicePortalFormDate(iso: string | null | undefined): string | undefined {
  const trimmed = iso?.trim()
  if (!trimmed) return undefined
  return trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed
}

/**
 * Portal `forms` items[] → 설문·만족도 목록 entry.
 * bindingId 없으면 null (render/submit 호출 금지).
 */
export function mapPortalFormListItem(item: PortalFormListItem): EducationSurveyListEntry | null {
  const bindingId = item.bindingId ?? item.formBindingId ?? item.id
  if (bindingId == null) return null

  const status = (item.status ?? 'NOT_SUBMITTED').trim().toUpperCase()
  const submitted = SUBMITTED_STATUSES.has(status)

  return {
    id: String(bindingId),
    title: item.title?.trim() || '설문',
    status: submitted ? 'submitted' : 'in_progress',
    startAt: slicePortalFormDate(item.submissionStartAt),
    endAt: slicePortalFormDate(item.submissionEndAt),
    createdAt: item.submissionStartAt?.trim() ? item.submissionStartAt : undefined,
    templateVersionId: item.templateVersionId,
    form: item.form,
    formResponseId: item.formResponseId,
    answers: item.answers,
    draftAnswers: item.draftAnswers,
  }
}
