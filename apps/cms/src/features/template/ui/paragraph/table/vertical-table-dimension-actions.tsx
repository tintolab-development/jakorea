import { CmsButton } from '@/shared/ui/cms-button'
import { ButtonAddIcon } from '@/shared/ui/icons/ButtonIcons'
import type { VerticalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { verticalTableAddRow } from '@/features/template/model/writing-form-draft.schema'

export function VerticalTableDimensionActions({
  paragraph,
  onUpdate,
  disabled = false,
}: {
  paragraph: VerticalTableParagraph
  onUpdate: (next: VerticalTableParagraph) => void
  disabled?: boolean
}) {
  return (
    <div
      className="form-editor-horizontal-table-dimension-actions"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      role="group"
      aria-label="테이블 행 추가"
    >
      <CmsButton
        variant="primary"
        type="button"
        size="large"
        icon={<ButtonAddIcon />}
        disabled={disabled}
        title="테이블 최하단에 한 줄(행)을 추가합니다."
        onClick={() => onUpdate(verticalTableAddRow(paragraph))} >
        행 추가
      </CmsButton>
    </div>
  )
}
