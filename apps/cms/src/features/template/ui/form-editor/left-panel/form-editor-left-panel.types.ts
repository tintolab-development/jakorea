import type {
  FormEditorKind,
  FormTitleNumberingStyle,
  HorizontalTableRowSelection,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type {
  ParagraphBodyInteractionMode,
  RenderFormParagraphBodyOptions,
} from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export type FormEditorLeftPanelLayout = 'five' | 'three'

export interface FormEditorLeftPanelProps {
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  onReorderMiddle: (activeId: string, overId: string) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  editorKind?: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: (paragraphId: string, itemId: string | null) => void
  layout?: FormEditorLeftPanelLayout
  horizontalTableRowSelectionsByParagraphId?: Record<string, HorizontalTableRowSelection | null>
  onHorizontalTableRowSelectionChange?: (
    paragraphId: string,
    next: HorizontalTableRowSelection | null
  ) => void
  /** 테이블 세로형: 본문 행 선택(캔버스) — 에디터에서 하나만 유지 */
  verticalTableBodyRowSelection?: { paragraphId: string; row: number } | null
  onVerticalTableBodyRowSelectionChange?: (paragraphId: string, row: number | null) => void
  /**
   * 중간(middle) 단락 공통 액션 — `getWritingFormHeadMiddlePinnedTail` 기준.
   * [단락 추가]는 설명글 텍스트형(`agreement_explanation_text`) 삽입, 복제 시 단락·하위 id 재발급.
   */
  middleParagraphActions?: {
    onAddAfter: (paragraphId: string) => void
    onDuplicate: (paragraphId: string) => void
    onDelete: (paragraphId: string) => void
  }
  /** `renderFormParagraphBody`에 그대로 전달(동의 시스템 단락 write 모드 등) */
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  /**
   * 단락 본문 상호작용 모드. `paragraphBodyOptions`와 병합되어 본문 렌더에 일관 적용된다.
   * 동일 키가 `paragraphBodyOptions`에도 있으면 그쪽이 우선한다.
   * 기본 authoring(템플릿 편집).
   */
  paragraphInteractionMode?: ParagraphBodyInteractionMode
  /** false면 순서 변경·하단 토글·단락 액션·드래그 핸들 미노출(응답자 미리보기 등) */
  showEditorChrome?: boolean
  /** 포함된 단락 id — 표 구조·카드 액션·드래그·본문 편집 잠금 */
  structureLockedParagraphIds?: ReadonlySet<string>
  /** 해당 id 단락은 드래그(햄버거) 핸들 비노출 — 지급조서 1번 제목형 등 */
  hideDragHandleForParagraphIds?: ReadonlySet<string>
  /** true면 필수(*)·하단 답변 필수 등 단락 필수 관련 토글·표시 숨김(지급조서 발급 편집 등) */
  hideParagraphRequiredChrome?: boolean
  /**
   * 카드 「설명 입력」에 추가할 class — 발급용에서 `paragraph-input-explanation-title`을 주면
   * 18px 기준으로 너비·하단 스트로크가 텍스트 길이에 맞는다.
   */
  headingDescriptionExtraClassName?: string
}
