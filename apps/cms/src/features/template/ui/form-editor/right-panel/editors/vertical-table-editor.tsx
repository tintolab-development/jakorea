import { FormEditorOptionListEditor } from '@/features/template/ui/form-editor/form-editor-option-list-editor'
import { FormEditorVerticalTableRowFields } from '@/features/template/ui/form-editor/form-editor-vertical-table-row-fields'
import type { VerticalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  effectiveVerticalStageKinds,
  normalizeVerticalChoiceOptions,
  normalizeVerticalTableParagraph,
  verticalTableParagraphWithChoiceOptions,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

function FormEditorVerticalTableCustomFields({
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
  const selectedRow =
    rowSelection?.paragraphId === paragraph.id &&
    rowSelection.row >= 0 &&
    rowSelection.row < Math.max(1, p.rows.length)
      ? p.rows[rowSelection.row]
      : null
  const selectedRowHasChoiceStage =
    selectedRow != null
      ? effectiveVerticalStageKinds(selectedRow, p.verticalTableFlavor).some(
          k => k === 'single_choice' || k === 'multiple_choice'
        )
      : false
  const choiceFlavor =
    p.verticalTableFlavor === 'single_choice' ||
    p.verticalTableFlavor === 'multiple_choice' ||
    selectedRowHasChoiceStage

  const rowFields =
    p.verticalTableFlavor !== 'file_attachment' &&
    rowSelection != null &&
    rowSelection.paragraphId === paragraph.id &&
    rowSelection.row >= 0 &&
    rowSelection.row < Math.max(1, p.rows.length) ? (
      <FormEditorVerticalTableRowFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        rowIndex={rowSelection.row}
        updateParagraph={updateParagraph}
        onBodyRowDeleted={onBodyRowDeleted}
      />
    ) : null

  const choiceOptionsEditor = choiceFlavor ? (
    <div className="form-editor-right-panel__field">
      <FormEditorOptionListEditor
        values={normalizeVerticalChoiceOptions(p.verticalChoiceOptions)}
        onChange={options =>
          updateParagraph(paragraph.id, cur => {
            if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
            return verticalTableParagraphWithChoiceOptions(cur as VerticalTableParagraph, options)
          })
        }
        addLabel="+ 항목 추가"
        addButtonIcon={false}
      />
    </div>
  ) : null

  if (!choiceFlavor && rowFields == null) return null

  return (
    <>
      {choiceOptionsEditor}
      {rowFields}
    </>
  )
}

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
  return (
    <FormEditorVerticalTableCustomFields
      paragraph={paragraph}
      rowSelection={rowSelection}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
    />
  )
}
