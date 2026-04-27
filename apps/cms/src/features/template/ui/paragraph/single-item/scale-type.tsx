import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 점수 선택형 (scale-type) — 단락 바디 슬롯 (추후 본문 연동) */
export function ScaleType(_props: {
  paragraph: ScaleTypeParagraph
  onChange?: (next: ScaleTypeParagraph) => void
  isEditMode: boolean
}) {
  return null
}
