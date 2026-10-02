import { FormEditorVerticalTableRowFields } from '@/features/template/ui/form-editor/table-fields/form-editor-vertical-table-row-fields'
import type { VerticalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeVerticalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function VerticalTableEditor({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: VerticalTableParagraph
  rowSelection: FormEditorRightPanelProps['verticalTableBodyRowSelection']
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  const p = normalizeVerticalTableParagraph(paragraph)
  if (
    rowSelection == null ||
    rowSelection.paragraphId !== paragraph.id ||
    rowSelection.row < 0 ||
    rowSelection.row >= Math.max(1, p.rows.length)
  ) {
    return null
  }

  return (
    <FormEditorVerticalTableRowFields
      paragraph={paragraph}
      paragraphId={paragraph.id}
      rowIndex={rowSelection.row}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
    />
  )
}
