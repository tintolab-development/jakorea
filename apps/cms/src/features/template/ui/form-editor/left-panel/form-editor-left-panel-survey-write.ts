import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type FormEditorKind,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'

export type SurveyDisplayCard = {
  paragraph: WritingFormParagraph
  displayKey: string
}

/** 설문 사용자 작성·미리보기 — write 번호 규칙을 쓰고, 선택 항목이 없는 설문자 정보는 숨긴다. */
export function shouldFlattenSurveyUserInfoWrite(
  editorKind: FormEditorKind,
  mode: ParagraphBodyInteractionMode
): boolean {
  return editorKind === 'survey' && (mode === 'user' || mode === 'preview')
}

/** 설문자 정보는 템플릿과 같이 자동입력 표 1장으로 노출한다. */
export function buildSurveyDisplayCards(
  paragraphs: WritingFormParagraph[],
  expandWrite: boolean
): SurveyDisplayCard[] {
  const visible = expandWrite
    ? paragraphs.filter(
        paragraph =>
          !isUserInfoParagraph(paragraph) || getUserInfoSelectedEntries(paragraph).length > 0
      )
    : paragraphs
  return visible.map(paragraph => ({ paragraph, displayKey: paragraph.id }))
}
