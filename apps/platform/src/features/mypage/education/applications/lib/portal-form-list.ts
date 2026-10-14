import type { PortalFormListItem } from '../api/activity-client'
import type { EducationSurveyListEntry } from '../../surveys/lib/survey-list-types'

export const PORTAL_SURVEY_FORM_TYPE_QUERIES = ['SURVEY', 'QUESTIONNAIRE'] as const

export const PORTAL_SATISFACTION_FORM_TYPE_QUERIES = [
  'SATISFACTION',
  'SATISFACTION_SURVEY',
  'PROGRAM_SATISFACTION',
] as const

function normalizePortalFormType(formType: string | undefined): string {
  return (formType ?? '').trim().toUpperCase()
}

export function isPortalSurveyFormType(formType: string | undefined): boolean {
  const normalized = normalizePortalFormType(formType)
  return normalized === 'SURVEY' || normalized === 'QUESTIONNAIRE'
}

export function isPortalSatisfactionFormType(formType: string | undefined): boolean {
  const normalized = normalizePortalFormType(formType)
  return (
    normalized === 'SATISFACTION' ||
    normalized === 'SATISFACTION_SURVEY' ||
    normalized === 'PROGRAM_SATISFACTION'
  )
}

export function resolvePortalFormBindingId(item: PortalFormListItem): number | null {
  const candidates = [
    item.bindingId,
    item.programFormBindingId,
    item.formBindingId,
    item.id,
  ]
  for (const candidate of candidates) {
    if (candidate == null) continue
    const numeric = typeof candidate === 'number' ? candidate : Number(candidate)
    if (Number.isFinite(numeric) && numeric > 0) return Math.trunc(numeric)
  }
  return null
}

export function mapPortalFormListItemToSurveyEntry(
  item: PortalFormListItem,
): EducationSurveyListEntry | null {
  const bindingId = resolvePortalFormBindingId(item)
  if (bindingId == null) return null

  const status = (item.status ?? '').toUpperCase()
  const formResponseId = item.formResponseId ?? item.latestFormResponseId ?? undefined
  const submitted = ['SUBMITTED', 'COMPLETED', 'DONE'].includes(status)

  return {
    id: String(bindingId),
    title: item.title?.trim() || '설문',
    status: submitted ? 'submitted' : 'in_progress',
    startAt: item.submissionStartAt?.slice(0, 10),
    endAt: item.submissionEndAt?.slice(0, 10),
    createdAt: item.submissionStartAt,
    templateVersionId: item.templateVersionId,
    form: item.form,
    formResponseId,
    answers: item.answers,
    draftAnswers: item.draftAnswers,
  }
}

export function dedupePortalFormListItems(items: readonly PortalFormListItem[]): PortalFormListItem[] {
  const seen = new Set<number>()
  const out: PortalFormListItem[] = []
  for (const item of items) {
    const bindingId = resolvePortalFormBindingId(item)
    if (bindingId == null || seen.has(bindingId)) continue
    seen.add(bindingId)
    out.push(item)
  }
  return out
}
