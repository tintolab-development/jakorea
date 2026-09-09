import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type FormEditorKind,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'

export type SurveyUserInfoWriteField = {
  key: string
  label: string
}

export type SurveyDisplayCard = {
  paragraph: WritingFormParagraph
  displayKey: string
  writeField?: SurveyUserInfoWriteField
}

export function shouldFlattenSurveyUserInfoWrite(
  editorKind: FormEditorKind,
  mode: ParagraphBodyInteractionMode
): boolean {
  return editorKind === 'survey' && (mode === 'user' || mode === 'preview')
}

export function buildSurveyDisplayCards(
  paragraphs: WritingFormParagraph[],
  expandWrite: boolean
): SurveyDisplayCard[] {
  if (!expandWrite) {
    return paragraphs.map(paragraph => ({ paragraph, displayKey: paragraph.id }))
  }

  const cards: SurveyDisplayCard[] = []
  for (const paragraph of paragraphs) {
    if (isUserInfoParagraph(paragraph)) {
      const entries = getUserInfoSelectedEntries(paragraph)
      if (entries.length === 0) continue
      for (const entry of entries) {
        cards.push({
          paragraph,
          displayKey: `${paragraph.id}::${entry.key}`,
          writeField: { key: entry.key, label: entry.label },
        })
      }
      continue
    }
    cards.push({ paragraph, displayKey: paragraph.id })
  }
  return cards
}
