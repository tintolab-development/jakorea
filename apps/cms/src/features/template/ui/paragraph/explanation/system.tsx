import type { SystemParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 설명글·기타형 — 본문 미구성 시 `null` */
export function ExplanationSystem(_props: {
  paragraph: SystemParagraph
  onChange: (next: SystemParagraph) => void
  isEditMode: boolean
}): null {
  return null
}
