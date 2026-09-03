import { FormEditorHorizontalTableBodyFields } from '@/features/template/ui/form-editor/table-fields/form-editor-horizontal-table-body-fields'
import { FormEditorHorizontalTableHeaderFields } from '@/features/template/ui/form-editor/table-fields/form-editor-horizontal-table-header-fields'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

function FormEditorHorizontalTableCustomFields({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: HorizontalTableParagraph
  rowSelection: FormEditorRightPanelProps['horizontalTableRowSelection']
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  if (rowSelection?.area === 'header') {
    return (
      <FormEditorHorizontalTableHeaderFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        updateParagraph={updateParagraph}
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
    />
  )
}

export function HorizontalTableEditor({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: HorizontalTableParagraph
  rowSelection: FormEditorRightPanelProps['horizontalTableRowSelection']
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  return (
    <FormEditorHorizontalTableCustomFields
      paragraph={paragraph}
      rowSelection={rowSelection}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
    />
  )
}
