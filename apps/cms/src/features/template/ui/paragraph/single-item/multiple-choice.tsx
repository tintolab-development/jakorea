import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 객관식형 (multiple-choice) — 단락 바디 슬롯 (추후 본문 연동) */
export function MultipleChoice(_props: {
  paragraph: MultipleChoiceParagraph
  onChange?: (next: MultipleChoiceParagraph) => void
  isEditMode: boolean
}) {
  return null
}
