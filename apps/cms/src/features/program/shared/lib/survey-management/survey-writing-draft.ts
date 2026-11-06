/**
 * 프로그램 설문 관리 draft — form-template version API SSOT (양식 관리와 동일).
 * localStorage에 쓰지 않는다. remote 실패 시 seed만 사용.
 */
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { queryClient } from '@/shared/lib/query-client'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
  WRITING_FORM_TEMPLATE_SAVE_EVENT,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  createDefaultSurveyDraft,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  firstSurveyWritingIncompleteMessage,
  listIncompleteSurveyWritingDraftKeys,
  type SurveyWritingIncompleteDiagnosticKey,
} from '@/features/program/shared/lib/survey-management/survey-writing-draft-validation'

export type SurveyWritingDraftValidationResult =
  | { ok: true }
  | {
      ok: false
      message: string
      incompleteKeys?: readonly SurveyWritingIncompleteDiagnosticKey[]
    }

export type ResolveSurveyWritingDraftOptions = {
  templateName?: string
  /** 바인딩된 게시 version — 있으면 그 version 본문을 단건 조회 (템플릿 목록 warm 없음) */
  templateVersionId?: number
  /** true면 version 캐시를 무시하고 다시 조회 (양식 저장 직후) */
  fresh?: boolean
}

/** 게시 version은 결과 화면에서 바뀌지 않는다 — 탭 전환·재마운트마다 재조회하지 않도록 캐시 */
const SURVEY_VERSION_DRAFT_STALE_MS = 5 * 60_000

/** remote load/save 후 동기 peek용 (poll/preview hydrate) */
const draftCache = new Map<string, WritingFormDraft>()

export function peekSurveyWritingDraft(templateId: string): WritingFormDraft | null {
  return draftCache.get(templateId) ?? null
}

export function rememberSurveyWritingDraft(templateId: string, draft: WritingFormDraft): void {
  draftCache.set(templateId, normalizeWritingFormDraft(draft))
}

/** 제목 단락 `surveyTitle`이 비어 있으면 등록 설문명·템플릿명을 채운다 (미리보기·공유 헤더). */
export function applySurveyDisplayTitleToDraft(
  draft: WritingFormDraft,
  displayName: string | undefined,
  options?: { overwrite?: boolean }
): WritingFormDraft {
  const title = displayName?.trim() ?? ''
  if (!title) return draft
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.kind !== 'description' || paragraph.variant !== 'survey_title_with_period') {
      return paragraph
    }
    if (!options?.overwrite && paragraph.surveyTitle.trim() !== '') return paragraph
    if (paragraph.surveyTitle === title) return paragraph
    changed = true
    return { ...paragraph, surveyTitle: title }
  })
  return changed ? { ...draft, paragraphs } : draft
}

/** remote 없을 때·로드 실패 시 시드 */
export function buildDefaultSurveyWritingDraft(
  templateId: string,
  options?: ResolveSurveyWritingDraftOptions
): WritingFormDraft {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  const displayName = (options?.templateName ?? row?.templateName)?.trim()
  const defaultDraft = normalizeWritingFormDraft(createDefaultSurveyDraft())
  return applySurveyDisplayTitleToDraft(defaultDraft, displayName)
}

/**
 * form-template remote draft 우선. 실패·없음 → seed.
 * 성공 시 메모리 캐시에 보관 (동기 peek / poll 결과용).
 */
export async function resolveSurveyWritingDraft(
  templateId: string,
  options?: ResolveSurveyWritingDraftOptions
): Promise<WritingFormDraft> {
  const versionId = options?.templateVersionId
  if (versionId != null && Number.isFinite(versionId) && versionId > 0) {
    try {
      const normalizedVersionId = Math.trunc(versionId)
      const saved = await queryClient.fetchQuery({
        queryKey: formTemplateQueryKeys.surveyVersionDraft(normalizedVersionId),
        queryFn: () =>
          loadWritingFormTemplateDraft(templateId, { templateVersionId: normalizedVersionId }),
        staleTime: options?.fresh ? 0 : SURVEY_VERSION_DRAFT_STALE_MS,
        retry: false,
      })
      if (saved?.draft != null) {
        return applySurveyDisplayTitleToDraft(
          normalizeWritingFormDraft(saved.draft),
          options?.templateName
        )
      }
    } catch (error) {
      console.warn('[survey-writing-draft] version load failed; using template draft', error)
    }
  }
  try {
    const saved = await loadWritingFormTemplateDraft(templateId)
    if (saved?.draft != null) {
      const draft = applySurveyDisplayTitleToDraft(
        normalizeWritingFormDraft(saved.draft),
        options?.templateName
      )
      rememberSurveyWritingDraft(templateId, draft)
      return draft
    }
  } catch (error) {
    console.warn('[survey-writing-draft] remote load failed; using seed', error)
  }

  const seed = buildDefaultSurveyWritingDraft(templateId, options)
  rememberSurveyWritingDraft(templateId, seed)
  return seed
}

/**
 * 캐시 → 없으면 seed (remote 미대기). hydrate/`resolveSurveyWritingDraft` 이후 사용 권장.
 */
export function resolveSurveyWritingDraftSync(
  templateId: string,
  options?: ResolveSurveyWritingDraftOptions
): WritingFormDraft {
  const cached = peekSurveyWritingDraft(templateId)
  if (cached != null) {
    return applySurveyDisplayTitleToDraft(cached, options?.templateName)
  }
  return buildDefaultSurveyWritingDraft(templateId, options)
}

export function validateSurveyWritingDraft(
  draft: WritingFormDraft
): SurveyWritingDraftValidationResult {
  const incompleteKeys = listIncompleteSurveyWritingDraftKeys(draft)
  if (incompleteKeys.length > 0) {
    return {
      ok: false,
      message: firstSurveyWritingIncompleteMessage(incompleteKeys),
      incompleteKeys,
    }
  }
  return { ok: true }
}

export async function saveSurveyWritingTemplate(
  templateId: string,
  draft: WritingFormDraft
): Promise<SurveyWritingDraftValidationResult> {
  const validation = validateSurveyWritingDraft(draft)
  if (!validation.ok) return validation

  const normalized = normalizeWritingFormDraft(draft)
  try {
    await persistWritingFormTemplateDraft({
      templateId,
      draft: normalized,
    })
    rememberSurveyWritingDraft(templateId, normalized)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(WRITING_FORM_TEMPLATE_SAVE_EVENT, { detail: { templateId } })
      )
    }
    return { ok: true }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim() !== ''
        ? error.message
        : '양식 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
    return { ok: false, message }
  }
}
