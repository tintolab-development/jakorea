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
  /**
   * 단락 종류·상세 셀렉트 숨김 강제 여부.
   * 미지정 시: 사용자 추가·시드·관리자 고정 단락 모두 유형 셀렉트·잠금 안내 노출.
   * `true`면 유형 셀렉트·잠금 안내 모두 숨김.
   */
  hideParagraphKindOutline?: boolean
  /** 구조 잠금 단락 ID — 해당 단락 선택 시 우측 패널이 잠금 안내 UI로 전환 */
  structureLockedParagraphIds?: ReadonlySet<string>
  /**
   * 등록·모집 시드 잠금 시 유형 셀렉트를 「테이블 / 시스템 설정」으로 고정 표시.
   * 신청 양식은 미지정(실제 단락 유형 표시).
   */
  structureLockedTypeSelectPreset?: import('@/features/template/ui/form-editor/right-panel/sections/structure-locked-section').StructureLockedTypeSelectPreset
}
