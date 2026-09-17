/**
 * 프로그램 설문 관리 draft — form-template version API SSOT (양식 관리와 동일).
 * localStorage에 쓰지 않는다. remote 실패 시 seed만 사용.
 */
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
  WRITING_FORM_TEMPLATE_SAVE_EVENT,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  getWritingFormHeadMiddlePinnedTail,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export type SurveyWritingDraftValidationResult =
  | { ok: true }
  | { ok: false; message: string }

export type ResolveSurveyWritingDraftOptions = {
  templateName?: string
}

/** remote load/save 후 동기 peek용 (poll/preview hydrate) */
const draftCache = new Map<string, WritingFormDraft>()

export function peekSurveyWritingDraft(templateId: string): WritingFormDraft | null {
  return draftCache.get(templateId) ?? null
}

export function rememberSurveyWritingDraft(templateId: string, draft: WritingFormDraft): void {
  draftCache.set(templateId, normalizeWritingFormDraft(draft))
}

function applyTemplateNameToDefaultDraft(
  draft: WritingFormDraft,
  displayName: string | undefined
): WritingFormDraft {
  if (displayName == null || displayName === '') return draft
  return normalizeWritingFormDraft({
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      paragraph.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title && paragraph.kind === 'description'
        ? { ...paragraph, surveyTitle: displayName }
        : paragraph
    ),
  })
}

/** remote 없을 때·로드 실패 시 시드 */
export function buildDefaultSurveyWritingDraft(
  templateId: string,
  options?: ResolveSurveyWritingDraftOptions
): WritingFormDraft {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  const displayName = (options?.templateName ?? row?.templateName)?.trim()
  const defaultDraft = normalizeWritingFormDraft(createDefaultSurveyDraft())
  return applyTemplateNameToDefaultDraft(defaultDraft, displayName)
}

/**
 * form-template remote draft 우선. 실패·없음 → seed.
 * 성공 시 메모리 캐시에 보관 (동기 peek / poll 결과용).
 */
export async function resolveSurveyWritingDraft(
  templateId: string,
  options?: ResolveSurveyWritingDraftOptions
): Promise<WritingFormDraft> {
  try {
    const saved = await loadWritingFormTemplateDraft(templateId)
    if (saved?.draft != null) {
      const draft = normalizeWritingFormDraft(saved.draft)
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
  if (cached != null) return cached
  return buildDefaultSurveyWritingDraft(templateId, options)
}

export function validateSurveyWritingDraft(
  draft: WritingFormDraft
): SurveyWritingDraftValidationResult {
  const split = getWritingFormHeadMiddlePinnedTail(draft.paragraphs)
  if (split == null || split.middle.length < 1) {
    return {
      ok: false,
      message:
        '제목과 마무리글, 설문자 정보를 제외하고 최소 1개 이상의 단락이 존재해야 합니다.',
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
