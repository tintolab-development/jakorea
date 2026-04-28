import type { DropdownParagraph } from '@/features/template/model/writing-form-draft.schema'

/** 드롭다운형 (dropdown) — 단락 바디 슬롯 (추후 본문 연동) */
export function Dropdown(_props: {
  paragraph: DropdownParagraph
  onChange?: (next: DropdownParagraph) => void
  isEditMode: boolean
}) {
  return null
}
