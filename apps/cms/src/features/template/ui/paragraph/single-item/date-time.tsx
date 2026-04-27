import type { DateTimeParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 날짜/시간형 (date-time) — 단락 바디 슬롯 (추후 본문 연동) */
export function DateTime(_props: {
  paragraph: DateTimeParagraph
  onChange?: (next: DateTimeParagraph) => void
  isEditMode: boolean
}) {
  return null
}
