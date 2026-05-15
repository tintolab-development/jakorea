import type {
  FormEditorKind,
  HorizontalTableRowSelection,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  renderFormParagraphBody,
  type RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel.types'

export function renderFormEditorParagraphBody(
  paragraph: WritingFormParagraph,
  updateParagraph: FormEditorLeftPanelProps['updateParagraph'],
  isSelected: boolean,
  editorKind: FormEditorKind,
  rowSelectionsByParagraphId: FormEditorLeftPanelProps['horizontalTableRowSelectionsByParagraphId'],
  onHorizontalTableRowSelectionChange: FormEditorLeftPanelProps['onHorizontalTableRowSelectionChange'],
  verticalTableBodyRowSelection: FormEditorLeftPanelProps['verticalTableBodyRowSelection'],
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPanelProps['onVerticalTableBodyRowSelectionChange'],
  singleItemListActiveItemId: FormEditorLeftPanelProps['singleItemListActiveItemId'],
  onSelectSingleItemListItem: FormEditorLeftPanelProps['onSelectSingleItemListItem'],
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
) {
  return renderFormParagraphBody(paragraph, updateParagraph, isSelected, editorKind, {
    horizontalTableRowSelection: rowSelectionsByParagraphId?.[paragraph.id] ?? null,
    onHorizontalTableRowSelectionChange:
      onHorizontalTableRowSelectionChange == null
        ? undefined
        : (next: HorizontalTableRowSelection | null) =>
            onHorizontalTableRowSelectionChange(paragraph.id, next),
    verticalTableRowSelection:
      verticalTableBodyRowSelection != null &&
      verticalTableBodyRowSelection.paragraphId === paragraph.id
        ? verticalTableBodyRowSelection.row
        : null,
    onVerticalTableRowSelectionChange:
      onVerticalTableBodyRowSelectionChange == null
        ? undefined
        : (row: number | null) => onVerticalTableBodyRowSelectionChange(paragraph.id, row),
    singleItemListActiveItemId,
    onSelectSingleItemListItem:
      (paragraph.variant === 'short_essay' ||
        paragraph.variant === 'session_plan_short_essay' ||
        paragraph.variant === 'subjective' ||
        paragraph.variant === 'multiple_choice') &&
      onSelectSingleItemListItem
        ? (itemId: string | null) => onSelectSingleItemListItem(paragraph.id, itemId)
        : undefined,
    ...paragraphBodyOptions,
  })
}
