import { CloseOutlined } from '@ant-design/icons'
import type {
  FormEditorKind,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPane } from '@/features/template/ui/form-editor/form-editor-left-pane'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './template-preview-modal.css'

export interface TemplatePreviewModalProps {
  open: boolean
  onClose: () => void
  /** 상단 청록 바에 표시할 양식 제목 */
  headerTitle: string
  draft: WritingFormDraft
  updateParagraph: FormUpdateParagraph
  editorKind?: FormEditorKind
  /**
   * 부모 풀페이지 모달 위에 겹침 — Ant Modal 기본 z-index(1000)보다 높게
   * @default 1100
   */
  zIndex?: number
}

/**
 * 작성 화면과 별도로, 응답자(user) 관점 레이아웃으로 단락을 렌더하는 풀페이지 미리보기.
 * 본문은 `FormEditorLeftPane`의 `paragraphInteractionMode="user"` + 크롬 비표시로 구성한다.
 */
export function TemplatePreviewModal({
  open,
  onClose,
  headerTitle,
  draft,
  updateParagraph,
  editorKind = 'survey',
  zIndex = 1100,
}: TemplatePreviewModalProps) {
  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className="template-preview-modal teal-header-modal--full"
      zIndex={zIndex}
    >
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{headerTitle}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
          <button
            type="button"
            className="template-preview-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="template-preview-modal__body">
          <FormEditorLeftPane
            paragraphs={draft.paragraphs}
            titleNumbering={draft.formSettings.titleNumbering}
            selectedCardId={null}
            onSelectCard={() => {}}
            onReorderMiddle={() => {}}
            updateParagraph={updateParagraph}
            editorKind={editorKind}
            singleItemListActiveItemId={null}
            paragraphInteractionMode="user"
            showEditorChrome={false}
          />
        </div>
      </div>
    </TealHeaderModal>
  )
}
