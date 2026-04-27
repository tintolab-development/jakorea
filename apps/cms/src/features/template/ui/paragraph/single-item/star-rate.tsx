import type { StarRateParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 별점형 (star-rate) — 단락 바디 슬롯 (추후 본문 연동) */
export function StarRate(_props: {
  paragraph: StarRateParagraph
  onChange?: (next: StarRateParagraph) => void
  isEditMode: boolean
}) {
  return null
}
