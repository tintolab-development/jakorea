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
   * 구조 조작 전용 잠금 단락 ID — 일반 편집 패널을 그대로 그리되 유형·상세 셀렉트, 표 행/열 삭제·셀 유형 변경만 막는다.
   * 문구(항목명·안내 텍스트·내용·설명글 본문)는 편집할 수 있다.
   * 템플릿 관리 시스템 동의 양식(QA 261113 #16 — 단락·항목 추가·삭제·이동 불가, 문구만 수정)에서 쓴다.
   * `structureLockedParagraphIds`에도 든 단락은 본문 잠금이 우선한다.
   */
  structureControlLockedParagraphIds?: ReadonlySet<string>
  /**
   * 등록·모집 시드 잠금 시 유형 셀렉트를 「테이블 / 시스템 설정」으로 고정 표시.
   * 신청 양식은 미지정(실제 단락 유형 표시).
   */
  structureLockedTypeSelectPreset?: import('@/features/template/ui/form-editor/right-panel/sections/structure-locked-section').StructureLockedTypeSelectPreset
  /** 만족도조사 일정별 — 제목 단락「작성 기간」설정 인풋 비활성 */
  lockSurveyWritingPeriodInput?: boolean
}
