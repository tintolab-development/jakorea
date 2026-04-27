import type { ShortEssayParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 주관식형 (short-essay) — 단락 바디 슬롯 (추후 본문 연동) */
export function ShortEssay(_props: {
  paragraph: ShortEssayParagraph
  onChange?: (next: ShortEssayParagraph) => void
  isEditMode: boolean
}) {
  return null
}
