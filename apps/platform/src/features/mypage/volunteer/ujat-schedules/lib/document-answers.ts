import {
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { collectRuntimeHiddenAnswerKeys } from '@/features/program/lib/application-form-draft'
import { resolveApplicationAnswerKey as resolveAnswerKey } from '@/features/program/lib/application-answer-key'
import {
  buildEducationSurveyAnswers,
  validateEducationSurveyFill,
  type EducationSurveyFillValidation,
} from '@/features/mypage/education/surveys/lib/survey-answers'
import type { SurveySidecarState } from '@/features/mypage/education/surveys/lib/survey-sidecar'

export type UjatDocumentAttachedFile = {
  questionKey: string
  fileObjectId: number
  fileName: string
}

export function buildUjatDocumentAnswers(
  draft: WritingFormDraft,
  sidecar: SurveySidecarState,
  remoteForm: unknown,
): Record<string, unknown> {
  const hidden = collectRuntimeHiddenAnswerKeys(remoteForm)
  const answers = buildEducationSurveyAnswers(draft, sidecar)
  for (const key of hidden) {
    delete answers[key]
  }
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') {
      const key = resolveAnswerKey(paragraph)
      if (key) delete answers[key]
    }
  }
  return answers
}

export function buildUjatDocumentFileObjectIds(
  files: readonly UjatDocumentAttachedFile[],
): Record<string, number[]> | undefined {
  const grouped: Record<string, number[]> = {}
  for (const file of files) {
    if (!file.questionKey || file.fileObjectId <= 0) continue
    grouped[file.questionKey] = [...(grouped[file.questionKey] ?? []), file.fileObjectId]
  }
  return Object.keys(grouped).length > 0 ? grouped : undefined
}

export function validateUjatDocumentFill(
  draft: WritingFormDraft,
  sidecar: SurveySidecarState,
  files: readonly UjatDocumentAttachedFile[],
): EducationSurveyFillValidation {
  const fileKeys = new Set(files.map(file => file.questionKey))
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item' || paragraph.variant !== 'file_attachment') continue
    const required = paragraph.answerRequired === true || paragraph.requiredMark === true
    if (!required) continue
    const key = resolveAnswerKey(paragraph)
    if (!key || !fileKeys.has(key)) {
      const title = paragraph.paragraphTitle?.trim() || '필수 첨부'
      return { ok: false, message: `${title} 파일을 첨부해 주세요.` }
    }
  }
  return validateEducationSurveyFill(draft, sidecar)
}

export function hasUjatDocumentSubmitPayload(
  answers: Record<string, unknown>,
  files: readonly UjatDocumentAttachedFile[],
): boolean {
  return Object.keys(answers).length > 0 || files.length > 0
}

export function fileQuestionKey(paragraph: WritingFormParagraph): string | null {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'file_attachment') return null
  return resolveAnswerKey(paragraph) || paragraph.id
}
