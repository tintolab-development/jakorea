import { useEffect, useMemo, useState } from 'react'
import type {
  FormEditorKind,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorLeftPane } from '@/features/template/ui/form-editor/form-editor-left-pane'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import { AgreementTemplatePreviewModal } from '@/features/template/ui/modal/agreement-template-preview-modal'
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
  const PAGE_PARAGRAPH_SIZE = 6
  const isReportPreviewLayout = editorKind === 'survey'
  const isAgreementPreviewLayout = editorKind === 'agreement'
  const isHorizontalTablePreviewLayout = editorKind === 'horizontal_table'
  const isFormPreviewLayout = isReportPreviewLayout || isAgreementPreviewLayout
  const modalClassName = [
    'template-preview-modal',
    'teal-header-modal--full',
    isFormPreviewLayout ? 'template-preview-modal--form-layout' : '',
    isReportPreviewLayout ? 'template-preview-modal--agreement-layout' : '',
    isReportPreviewLayout ? 'template-preview-modal--survey-layout' : '',
    isHorizontalTablePreviewLayout ? 'template-preview-modal--horizontal-table-layout' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const pagedParagraphs = useMemo(() => {
    if (!isReportPreviewLayout) return [draft.paragraphs]
    if (draft.paragraphs.length === 0) return [[]]
    const pages: typeof draft.paragraphs[] = []
    for (let i = 0; i < draft.paragraphs.length; i += PAGE_PARAGRAPH_SIZE) {
      pages.push(draft.paragraphs.slice(i, i + PAGE_PARAGRAPH_SIZE))
    }
    return pages
  }, [draft.paragraphs, isReportPreviewLayout])
  const totalPages = pagedParagraphs.length
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  useEffect(() => {
    setCurrentPageIndex(0)
  }, [open, editorKind])

  useEffect(() => {
    setCurrentPageIndex(prev => Math.min(prev, Math.max(totalPages - 1, 0)))
  }, [totalPages])

  const currentPageParagraphs = isReportPreviewLayout
    ? pagedParagraphs[currentPageIndex] ?? []
    : draft.paragraphs

  if (isAgreementPreviewLayout) {
    return (
      <AgreementTemplatePreviewModal
        open={open}
        onClose={onClose}
        headerTitle={headerTitle}
        draft={draft}
        updateParagraph={updateParagraph}
        editorKind={editorKind}
        zIndex={zIndex}
      />
    )
  }

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className={modalClassName}
      zIndex={zIndex}
    >
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{headerTitle}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
        </header>

        <div className="template-preview-modal__body">
          {isReportPreviewLayout ? (
            <div className="template-preview-modal__notice">
              <div className="template-preview-modal__notice-text-wrap">
                <p className="template-preview-modal__notice-text">
                  현재 화면은 미리보기 화면입니다.
                </p>
              </div>
              <button
                type="button"
                className="template-preview-modal__notice-close-btn"
                onClick={onClose}
              >
                미리보기 닫기
              </button>
            </div>
          ) : null}

          <div className={isFormPreviewLayout ? 'template-preview-modal__pages' : 'template-preview-modal__content'}>
            {isReportPreviewLayout ? (
              <div className="template-preview-modal__a4-stage">
                <div className="template-preview-modal__a4-frame">
                  <div className="template-preview-modal__a4-scale-inner">
                    <A4DocumentPageLayout title={headerTitle} pageIndex={currentPageIndex}>
                      <div className="template-preview-modal__a4-text-content">
                        <FormEditorLeftPane
                          paragraphs={currentPageParagraphs}
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
                    </A4DocumentPageLayout>
                  </div>
                </div>
                {totalPages > 1 ? (
                  <div className="template-preview-modal__page-nav">
                    <button
                      type="button"
                      className="template-preview-modal__page-nav-button"
                      onClick={() => setCurrentPageIndex(prev => Math.max(prev - 1, 0))}
                      disabled={currentPageIndex === 0}
                      aria-label="이전 페이지"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <mask
                          id="template-preview-nav-prev-mask"
                          style={{ maskType: 'alpha' }}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="28"
                          height="28"
                        >
                          <rect width="28" height="28" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#template-preview-nav-prev-mask)">
                          <path
                            d="M13.0593 14.8753H17.4993C17.7473 14.8753 17.955 14.7914 18.1226 14.6236C18.2904 14.4558 18.3743 14.248 18.3743 14C18.3743 13.7519 18.2904 13.5442 18.1226 13.3767C17.955 13.2091 17.7473 13.1253 17.4993 13.1253H13.0593L14.6142 11.5705C14.7756 11.4114 14.8563 11.209 14.8563 10.9632C14.8563 10.7174 14.7756 10.5137 14.6142 10.3522C14.4526 10.1908 14.2489 10.1101 14.0031 10.1101C13.7574 10.1101 13.5549 10.1908 13.3959 10.3522L10.4859 13.2621C10.275 13.4731 10.1695 13.7192 10.1695 14.0003C10.1695 14.2815 10.275 14.5276 10.4859 14.7385L13.3959 17.6485C13.5575 17.8099 13.7605 17.8887 14.0049 17.885C14.2495 17.8813 14.4526 17.7987 14.6142 17.6371C14.7756 17.4755 14.8563 17.2719 14.8563 17.0261C14.8563 16.7803 14.7756 16.5779 14.6142 16.4188L13.0593 14.8753ZM14.0014 25.0837C12.4684 25.0837 11.0275 24.7928 9.6786 24.211C8.32974 23.6292 7.15646 22.8397 6.15877 21.8424C5.16107 20.8451 4.37114 19.6723 3.78897 18.324C3.207 16.9757 2.91602 15.5352 2.91602 14.0024C2.91602 12.4694 3.2069 11.0284 3.78868 9.67957C4.37046 8.33071 5.16 7.15744 6.15731 6.15974C7.15461 5.16205 8.3274 4.37212 9.67568 3.78995C11.024 3.20798 12.4645 2.91699 13.9973 2.91699C15.5303 2.91699 16.9712 3.20788 18.3201 3.78966C19.669 4.37144 20.8422 5.16098 21.8399 6.15828C22.8376 7.15559 23.6276 8.32838 24.2097 9.67666C24.7917 11.0249 25.0827 12.4655 25.0827 13.9983C25.0827 15.5313 24.7918 16.9722 24.21 18.3211C23.6282 19.6699 22.8387 20.8432 21.8414 21.8409C20.8441 22.8386 19.6713 23.6285 18.323 24.2107C16.9747 24.7927 15.5342 25.0837 14.0014 25.0837ZM13.9993 23.3337C16.6049 23.3337 18.8118 22.4295 20.6202 20.6212C22.4285 18.8128 23.3327 16.6059 23.3327 14.0003C23.3327 11.3948 22.4285 9.18783 20.6202 7.37949C18.8118 5.57116 16.6049 4.66699 13.9993 4.66699C11.3938 4.66699 9.18685 5.57116 7.37852 7.37949C5.57018 9.18783 4.66602 11.3948 4.66602 14.0003C4.66602 16.6059 5.57018 18.8128 7.37852 20.6212C9.18685 22.4295 11.3938 23.3337 13.9993 23.3337Z"
                            fill="white"
                          />
                        </g>
                      </svg>
                    </button>
                    <span className="template-preview-modal__page-nav-label">
                      {currentPageIndex + 1}/{totalPages}
                    </span>
                    <button
                      type="button"
                      className="template-preview-modal__page-nav-button"
                      onClick={() => setCurrentPageIndex(prev => Math.min(prev + 1, totalPages - 1))}
                      disabled={currentPageIndex === totalPages - 1}
                      aria-label="다음 페이지"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <mask
                          id="template-preview-nav-next-mask"
                          style={{ maskType: 'alpha' }}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="28"
                          height="28"
                        >
                          <rect width="28" height="28" fill="#D9D9D9" />
                        </mask>
                        <g mask="url(#template-preview-nav-next-mask)">
                          <path
                            d="M14.9394 14.8753L13.3845 16.4302C13.2231 16.5918 13.1443 16.7929 13.148 17.0337C13.1517 17.2744 13.2343 17.4755 13.3959 17.6371C13.5575 17.7987 13.7612 17.8795 14.0069 17.8795C14.2527 17.8795 14.4551 17.7987 14.6142 17.6371L17.5128 14.7385C17.7237 14.5276 17.8292 14.2815 17.8292 14.0003C17.8292 13.7192 17.7237 13.4731 17.5128 13.2621L14.6028 10.3522C14.4412 10.1908 14.2401 10.1101 13.9993 10.1101C13.7586 10.1101 13.5575 10.1908 13.3959 10.3522C13.2343 10.5137 13.1535 10.7174 13.1535 10.9632C13.1535 11.209 13.2343 11.4114 13.3959 11.5705L14.9394 13.1253H10.4993C10.2514 13.1253 10.0437 13.2092 9.87606 13.377C9.70825 13.5448 9.62435 13.7527 9.62435 14.0006C9.62435 14.2487 9.70825 14.4565 9.87606 14.6239C10.0437 14.7915 10.2514 14.8753 10.4993 14.8753H14.9394ZM14.0014 25.0837C12.4684 25.0837 11.0275 24.7928 9.6786 24.211C8.32974 23.6292 7.15646 22.8397 6.15877 21.8424C5.16107 20.8451 4.37114 19.6723 3.78897 18.324C3.207 16.9757 2.91602 15.5352 2.91602 14.0024C2.91602 12.4694 3.2069 11.0284 3.78868 9.67957C4.37046 8.33071 5.16 7.15744 6.15731 6.15974C7.15461 5.16205 8.3274 4.37212 9.67568 3.78995C11.024 3.20798 12.4645 2.91699 13.9973 2.91699C15.5303 2.91699 16.9712 3.20788 18.3201 3.78966C19.669 4.37144 20.8422 5.16098 21.8399 6.15828C22.8376 7.15559 23.6276 8.32838 24.2097 9.67666C24.7917 11.0249 25.0827 12.4655 25.0827 13.9983C25.0827 15.5313 24.7918 16.9722 24.21 18.3211C23.6282 19.6699 22.8387 20.8432 21.8414 21.8409C20.8441 22.8386 19.6713 23.6285 18.323 24.2107C16.9747 24.7927 15.5342 25.0837 14.0014 25.0837ZM13.9993 23.3337C16.6049 23.3337 18.8118 22.4295 20.6202 20.6212C22.4285 18.8128 23.3327 16.6059 23.3327 14.0003C23.3327 11.3948 22.4285 9.18783 20.6202 7.37949C18.8118 5.57116 16.6049 4.66699 13.9993 4.66699C11.3938 4.66699 9.18685 5.57116 7.37852 7.37949C5.57018 9.18783 4.66602 11.3948 4.66602 14.0003C4.66602 16.6059 5.57018 18.8128 7.37852 20.6212C9.18685 22.4295 11.3938 23.3337 13.9993 23.3337Z"
                            fill="white"
                          />
                        </g>
                      </svg>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
