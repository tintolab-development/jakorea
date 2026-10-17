import { isTitleWithPeriodParagraph } from '@/features/template/lib/title-with-period-settings'
import { isAgreementExplanationTextParagraph } from '@/features/template/model/writing-form/paragraph-guards'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 설문조사 — 제목형(`survey_title_with_period`) */
export function isSurveyTitleParagraph(p: WritingFormParagraph): boolean {
  return isTitleWithPeriodParagraph(p)
}

/** 설문조사 — 설명글 텍스트형(`agreement_explanation_text`) */
export function isSurveyExplanationTextParagraph(p: WritingFormParagraph): boolean {
  return isAgreementExplanationTextParagraph(p)
}

/** 설문 에디터에서 복제·삭제 불가 단락 (제목형·설명글 텍스트형) */
export function isSurveyParagraphDuplicateDeleteLocked(p: WritingFormParagraph): boolean {
  return isSurveyTitleParagraph(p) || isSurveyExplanationTextParagraph(p)
}

/** 좌측 카드 푸터 — 설문(`editorKind === 'survey'`) 복제·삭제 비활성 */
export function isSurveyEditorParagraphDupDeleteLocked(p: WritingFormParagraph): boolean {
  return isSurveyParagraphDuplicateDeleteLocked(p)
}

export function countSurveyTitleParagraphs(paragraphs: readonly WritingFormParagraph[]): number {
  return paragraphs.filter(isSurveyTitleParagraph).length
}
