import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  getWritingFormHeadMiddlePinnedTail,
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export type UjatSurveyWritingDraftValidationResult =
  | { ok: true }
  | { ok: false; message: string }

export type ResolveUjatSurveyWritingDraftOptions = {
  templateName?: string
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

/** localStorage 저장본 우선, 없으면 기본 설문 draft + 템플릿명 제목 반영 */
export function resolveUjatSurveyWritingDraft(
  templateId: string,
  options?: ResolveUjatSurveyWritingDraftOptions
): WritingFormDraft {
  const saved = loadWritingFormTemplateSave(templateId)
  if (saved?.draft != null) {
    return normalizeWritingFormDraft(saved.draft)
  }

  const row = findWritingTemplateRowByDefinitionId(templateId)
  const displayName = (options?.templateName ?? row?.templateName)?.trim()
  const defaultDraft = normalizeWritingFormDraft(createDefaultSurveyDraft())
  return applyTemplateNameToDefaultDraft(defaultDraft, displayName)
}

export function validateUjatSurveyWritingDraft(
  draft: WritingFormDraft
): UjatSurveyWritingDraftValidationResult {
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

export function saveUjatSurveyWritingTemplate(
  templateId: string,
  draft: WritingFormDraft
): UjatSurveyWritingDraftValidationResult {
  const validation = validateUjatSurveyWritingDraft(draft)
  if (!validation.ok) return validation

  try {
    persistWritingFormTemplateSave({
      templateId,
      draft: normalizeWritingFormDraft(draft),
    })
    return { ok: true }
  } catch {
    return { ok: false, message: '양식 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }
  }
}
