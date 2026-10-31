import { toSeoulDateOnly } from '../../../../../shared/lib/format-display-date.ts'
import type {
  PortalAvailableProgramForm,
  PortalFormListItem,
} from '../api/activity-client'
import type { EducationSurveyListEntry } from '../../surveys/lib/survey-list-types'

export const PORTAL_SURVEY_FORM_TYPE_QUERIES = ['SURVEY', 'QUESTIONNAIRE'] as const

export const PORTAL_SATISFACTION_FORM_TYPE_QUERIES = [
  'SATISFACTION',
  'SATISFACTION_SURVEY',
  'PROGRAM_SATISFACTION',
] as const

/** 교육 일정의 과제 양식 — BE는 ASSIGNMENT와 HOMEWORK을 모두 허용한다. */
export const PORTAL_ASSIGNMENT_FORM_TYPE_QUERIES = ['ASSIGNMENT', 'HOMEWORK'] as const

function normalizePortalFormType(formType: string | undefined): string {
  return (formType ?? '').trim().toUpperCase()
}

/**
 * 프로그램 runtime은 활성 binding이 고정한 과거 발행본(ARCHIVED)을 정상 사용한다.
 * 상태가 없으면 서버의 목록/render 성공을 신뢰하고, DRAFT만 fail-closed 한다.
 */
export function isPortalBoundFormVersionUsable(
  versionStatus: string | null | undefined
): boolean {
  return (versionStatus ?? '').trim().toUpperCase() !== 'DRAFT'
}

export function mapAvailableProgramFormToListItem(
  item: PortalAvailableProgramForm
): PortalFormListItem {
  return {
    bindingId: item.bindingId,
    templateVersionId: item.templateVersionId,
    formType: item.formType,
    title: item.templateName,
    targetScope: item.targetScope,
    targetScopeId: item.targetScopeId,
    required: item.required,
    submissionStartAt: item.submissionStartAt,
    submissionEndAt: item.submissionEndAt,
    status: item.alreadySubmitted ? 'SUBMITTED' : 'NOT_SUBMITTED',
    canSubmit: item.alreadySubmitted !== true,
  }
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

export function isPortalAssignmentFormType(formType: string | undefined): boolean {
  const normalized = normalizePortalFormType(formType)
  return normalized === 'ASSIGNMENT' || normalized === 'HOMEWORK'
}

export function isPortalScheduleTargetScope(targetScope: string | undefined): boolean {
  return (targetScope ?? '').trim().toUpperCase() === 'SCHEDULE'
}

function toPositiveInt(value: unknown): number | null {
  if (value == null) return null
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return Math.trunc(numeric)
}

/** Assignment match/submit: canonical `bindingId` only. Aliases are ignored. */
export function resolveCanonicalPortalFormBindingId(item: PortalFormListItem): number | null {
  return toPositiveInt(item.bindingId)
}

export function resolvePortalFormBindingId(item: PortalFormListItem): number | null {
  const candidates = [item.bindingId, item.programFormBindingId, item.formBindingId, item.id]
  for (const candidate of candidates) {
    const numeric = toPositiveInt(candidate)
    if (numeric != null) return numeric
  }
  return null
}

/**
 * SCHEDULE assignment row key: `scheduleId` first, then `targetScopeId`.
 * PROGRAM-scoped items are never used, even if scheduleId/targetScopeId is present.
 */
export function resolvePortalAssignmentScheduleId(item: PortalFormListItem): number | null {
  if (!isPortalScheduleTargetScope(item.targetScope)) return null
  return toPositiveInt(item.scheduleId) ?? toPositiveInt(item.targetScopeId)
}

/**
 * First ASSIGNMENT/HOMEWORK form bound to this schedule. No PROGRAM fallback.
 */
export function indexScheduleAssignmentFormsByScheduleId(
  items: readonly PortalFormListItem[],
): Map<number, PortalFormListItem> {
  const forms = new Map<number, PortalFormListItem>()
  for (const item of items) {
    if (!isPortalAssignmentFormType(item.formType)) continue
    const scheduleId = resolvePortalAssignmentScheduleId(item)
    if (scheduleId == null) continue
    if (resolveCanonicalPortalFormBindingId(item) == null) continue
    if (!forms.has(scheduleId)) forms.set(scheduleId, item)
  }
  return forms
}

export function mapPortalFormListItemToSurveyEntry(
  item: PortalFormListItem
): EducationSurveyListEntry | null {
  const bindingId = resolvePortalFormBindingId(item)
  if (bindingId == null) return null

  const status = (item.status ?? '').toUpperCase()
  const formResponseId = item.formResponseId ?? item.latestFormResponseId ?? undefined
  const submitted = ['SUBMITTED', 'COMPLETED', 'DONE'].includes(status)
  const targetScope = item.targetScope?.trim() || undefined
  const targetScopeId =
    typeof item.targetScopeId === 'number' && Number.isFinite(item.targetScopeId)
      ? Math.trunc(item.targetScopeId)
      : undefined
  const scheduleId =
    typeof item.scheduleId === 'number' && Number.isFinite(item.scheduleId)
      ? Math.trunc(item.scheduleId)
      : undefined

  return {
    id: String(bindingId),
    title: item.title?.trim() || '설문',
    status: submitted ? 'submitted' : 'in_progress',
    startAt: toSeoulDateOnly(item.submissionStartAt),
    endAt: toSeoulDateOnly(item.submissionEndAt),
    submissionStartAt: item.submissionStartAt ?? undefined,
    submissionEndAt: item.submissionEndAt ?? undefined,
    createdAt: item.submissionStartAt ?? undefined,
    templateVersionId: item.templateVersionId,
    formType: item.formType,
    targetScope,
    targetScopeId,
    scheduleId,
    required: item.required,
    form: item.form,
    formResponseId,
    answers: item.answers,
    draftAnswers: item.draftAnswers,
    bindingId: resolveCanonicalPortalFormBindingId(item) ?? undefined,
    canSubmit: item.canSubmit === true,
    canResubmit: item.canResubmit === true,
    revisionNo: item.revisionNo,
    retentionExpiresAt: item.retentionExpiresAt,
  }
}

export function dedupePortalFormListItems(
  items: readonly PortalFormListItem[]
): PortalFormListItem[] {
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
