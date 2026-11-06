import {
  composeSatisfactionSurveyDisplayTitle,
  formatSatisfactionPerScheduleDisplayName,
  hasSatisfactionScheduleDisplayParts,
} from '../../../../../shared/lib/education-schedule-name.ts'
import { toSeoulDateOnly } from '../../../../../shared/lib/format-display-date.ts'
import type {
  PortalAvailableProgramForm,
  PortalFormListItem,
} from '../api/activity-client'
import { resolveEducationSurveyListStatus } from '../../surveys/lib/portal-form-submission-period.ts'
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

function resolveSatisfactionListTitle(item: {
  formType?: string
  title?: string | null
  templateName?: string | null
  targetScope?: string | null
  targetScopeLabel?: string | null
  sessionNo?: number | null
  scheduleStartAt?: string | null
  startAt?: string | null
}): string {
  const formName = item.templateName?.trim() || item.title?.trim() || '만족도조사'
  if (!isPortalSatisfactionFormType(item.formType)) {
    return item.title?.trim() || item.templateName?.trim() || '설문'
  }
  if (!isPortalScheduleTargetScope(item.targetScope ?? undefined)) return formName
  const scheduleInput = {
    scheduleName: item.targetScopeLabel,
    sessionNo: item.sessionNo,
    startAt: item.scheduleStartAt ?? item.startAt,
  }
  if (!hasSatisfactionScheduleDisplayParts(scheduleInput)) return formName
  return composeSatisfactionSurveyDisplayTitle({
    formName,
    perSchedule: true,
    scheduleDisplayName: formatSatisfactionPerScheduleDisplayName(scheduleInput),
  })
}

export function mapAvailableProgramFormToListItem(
  item: PortalAvailableProgramForm
): PortalFormListItem {
  return {
    bindingId: item.bindingId,
    templateVersionId: item.templateVersionId,
    formType: item.formType,
    title: resolveSatisfactionListTitle(item),
    targetScope: item.targetScope,
    targetScopeId: item.targetScopeId,
    targetScopeLabel: item.targetScopeLabel,
    required: item.required,
    submissionStartAt: item.submissionStartAt,
    submissionEndAt: item.submissionEndAt,
    status: item.alreadySubmitted ? 'SUBMITTED' : 'NOT_SUBMITTED',
    canSubmit: item.alreadySubmitted !== true,
    targetRole: item.targetRole ?? undefined,
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

/** 교사 마이페이지 만족도 — 봉사자 대상 카드를 그리지 않는다. OpenAPI 필드 추가 없음. */
export function isVolunteerFacingSatisfactionForm(item: {
  title?: string | null
  formType?: string
}): boolean {
  if (!isPortalSatisfactionFormType(item.formType) && item.formType != null) return false
  const title = (item.title ?? '').trim()
  if (!title) return false
  return /봉사/.test(title) || /VOLUNTEER/i.test(title)
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
  const responseStatus = (item.responseStatus ?? '').trim().toUpperCase()
  const formResponseId = item.formResponseId ?? item.latestFormResponseId ?? undefined
  const submittedByStatus = ['SUBMITTED', 'COMPLETED', 'DONE'].includes(status)
  const submittedByResponse = ['SUBMITTED', 'COMPLETED', 'DONE', 'APPROVED'].includes(
    responseStatus,
  )
  const submittedByEvidence =
    formResponseId != null &&
    item.canSubmit !== true &&
    item.canResubmit !== true &&
    responseStatus !== 'REJECTED'
  const submitted = submittedByStatus || submittedByResponse || submittedByEvidence
  const targetScope = item.targetScope?.trim() || undefined
  const targetScopeId = toPositiveInt(item.targetScopeId) ?? undefined
  const scheduleId =
    resolvePortalAssignmentScheduleId(item) ?? toPositiveInt(item.scheduleId) ?? undefined

  const submissionStartAt = item.submissionStartAt ?? undefined
  const submissionEndAt = item.submissionEndAt ?? undefined

  return {
    id: String(bindingId),
    title: resolveSatisfactionListTitle(item),
    status: resolveEducationSurveyListStatus(submitted, {
      submissionStartAt,
      submissionEndAt,
      startAt: toSeoulDateOnly(item.submissionStartAt),
      endAt: toSeoulDateOnly(item.submissionEndAt),
    }),
    startAt: toSeoulDateOnly(item.submissionStartAt),
    endAt: toSeoulDateOnly(item.submissionEndAt),
    submissionStartAt,
    submissionEndAt,
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
    targetRole: item.targetRole ?? undefined,
    ...(responseStatus ? { responseStatus } : {}),
    revisionNo: item.revisionNo,
    retentionExpiresAt: item.retentionExpiresAt,
  }
}

/** 목록 제목에 날짜가 없으면 교육 진행 예정일 줄로 `회차 · 날짜`를 맞춘다. */
export function applySatisfactionScheduleLineDate(
  entry: EducationSurveyListEntry,
  scheduleLine: string | null | undefined
): EducationSurveyListEntry {
  if (!isPortalSatisfactionFormType(entry.formType)) return entry
  if (!isPortalScheduleTargetScope(entry.targetScope)) return entry
  if (entry.title.includes(' · ') || !scheduleLine?.trim()) return entry
  const roundMatch = /^(\d+)회차$/u.exec(entry.title.trim())
  return {
    ...entry,
    title: composeSatisfactionSurveyDisplayTitle({
      formName: roundMatch ? undefined : entry.title,
      perSchedule: true,
      scheduleDisplayName: formatSatisfactionPerScheduleDisplayName({
        sessionNo: roundMatch ? Number(roundMatch[1]) : null,
        scheduleLine,
      }),
    }),
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
