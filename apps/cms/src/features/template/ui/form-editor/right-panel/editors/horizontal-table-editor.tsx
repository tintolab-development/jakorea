import { FormEditorHorizontalTableBodyFields } from '@/features/template/ui/form-editor/table-fields/form-editor-horizontal-table-body-fields'
import { FormEditorHorizontalTableHeaderFields } from '@/features/template/ui/form-editor/table-fields/form-editor-horizontal-table-header-fields'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

type HorizontalTableEditorProps = {
  paragraph: HorizontalTableParagraph
  rowSelection: FormEditorRightPanelProps['horizontalTableRowSelection']
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
  /** 구조 조작 전용 잠금 — 행/열 삭제·셀 유형 변경 숨김, 항목명·안내 텍스트는 편집 */
  structureControlLocked?: boolean
}

function FormEditorHorizontalTableCustomFields({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
  structureControlLocked = false,
}: HorizontalTableEditorProps) {
  if (rowSelection?.area === 'header') {
    return (
      <FormEditorHorizontalTableHeaderFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        updateParagraph={updateParagraph}
        structureControlLocked={structureControlLocked}
      />
    )
  }

  if (rowSelection?.area !== 'body') return null

  const rowIndex = rowSelection.row
  const rowCount = Math.max(1, paragraph.dataRows.length)
  if (rowIndex < 0 || rowIndex >= rowCount) return null

  return (
    <FormEditorHorizontalTableBodyFields
      paragraph={paragraph}
      paragraphId={paragraph.id}
      rowIndex={rowIndex}
      focusedCol={rowSelection.col}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
      structureControlLocked={structureControlLocked}
    />
  )
}

export function HorizontalTableEditor({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
  structureControlLocked = false,
}: HorizontalTableEditorProps) {
  return (
    <FormEditorHorizontalTableCustomFields
      paragraph={paragraph}
      rowSelection={rowSelection}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
      structureControlLocked={structureControlLocked}
    />
  )
}
