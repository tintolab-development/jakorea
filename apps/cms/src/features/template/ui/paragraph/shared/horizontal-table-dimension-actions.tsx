import { CmsButton } from '@/shared/ui/cms-button'
import { FormEditorPlusIcon } from '@/features/template/ui/paragraph/shared/form-editor-plus-icon'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  horizontalTableAddColumn,
  horizontalTableAddRow,
} from '@/features/template/model/writing-form-draft.schema'

export function HorizontalTableDimensionActions({
  paragraph,
  onUpdate,
  disabled = false,
}: {
  paragraph: HorizontalTableParagraph
  onUpdate: (next: HorizontalTableParagraph) => void
  /** 카드 비선택 시 레이아웃 유지용(버튼만 비활성) */
  disabled?: boolean
}) {
  return (
    <div
      className="form-editor-horizontal-table-dimension-actions"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      role="group"
      aria-label="테이블 행·열 추가"
    >
      <CmsButton
        className="form-editor-horizontal-table-dimension-actions__btn"
        variant="primary"
        type="button"
        size="large"
        icon={<FormEditorPlusIcon />}
        disabled={disabled}
        title="테이블 최하단에 가로 한 줄(행)을 추가합니다."
        onClick={() => onUpdate(horizontalTableAddRow(paragraph))}
      >
        행 추가
      </CmsButton>
      <CmsButton
        className="form-editor-horizontal-table-dimension-actions__btn"
        variant="primary"
        type="button"
        size="large"
        icon={<FormEditorPlusIcon />}
        disabled={disabled}
        title="테이블 가장 오른쪽에 세로 한 줄(열)을 추가합니다."
        onClick={() => onUpdate(horizontalTableAddColumn(paragraph))}
      >
        열 추가
      </CmsButton>
    </div>
  )
}
