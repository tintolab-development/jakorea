import { ButtonAddIcon } from '@/shared/ui/icons'

/** 항목 추가 버튼용 + — 시안 `Icon / Button / w24` add 원본을 20 칸에 */
export function FormEditorHorizontalTableOptionAddIcon() {
  return (
    <span className="form-editor-horizontal-table-body-fields__option-add-icon" aria-hidden>
      <ButtonAddIcon style={{ display: 'block', width: 20, height: 20 }} />
    </span>
  )
}
