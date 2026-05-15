import type {
  FormEditorKind,
  FormTitleNumberingStyle,
  HorizontalTableRowSelection,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

export type FormEditorRightPanelUpdateParagraph = (
  id: string,
  updater: (p: WritingFormParagraph) => WritingFormParagraph
) => void

export interface FormEditorRightPanelProps {
  draft: WritingFormDraft
  activeParagraphId: string | null
  onTitleNumberingChange: (style: FormTitleNumberingStyle) => void
  updateParagraph: FormEditorRightPanelUpdateParagraph
  editorKind?: FormEditorKind
  showTitleNumbering?: boolean
  singleItemListActiveItemId?: string | null
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  onHorizontalTableBodyRowDeleted?: (nextRowIndex: number) => void
  verticalTableBodyRowSelection?: { paragraphId: string; row: number } | null
  onVerticalTableBodyRowDeleted?: (nextRowIndex: number) => void
  structureLockedParagraphIds?: ReadonlySet<string>
}
