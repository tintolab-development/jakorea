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
  /** 기본 `true` — 단락 종류·상세·개요(구조 잠금 안내) 블록을 숨김. 우측 메타가 필요한 경우만 `false`. */
  hideParagraphKindOutline?: boolean
  /** 구조 잠금 단락 ID — 해당 단락 선택 시 우측 패널이 잠금 안내 UI로 전환 */
  structureLockedParagraphIds?: ReadonlySet<string>
}
