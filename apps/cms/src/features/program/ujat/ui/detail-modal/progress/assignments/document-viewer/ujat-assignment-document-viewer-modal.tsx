import { useCallback, useMemo, useRef, useState } from 'react'
import { CloseOutlined, DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { A4DocumentPageLayout } from '@/features/template/ui/layout'
import { FormDocumentPreviewBody } from '@/features/template/ui/document-preview'
import { useA4ParagraphPages } from '@/features/template/hooks/use-a4-paragraph-pages'
import {
  getA4DocumentTitle,
  getA4PreviewParagraphs,
} from '@/features/template/lib/a4-document-preview'
import {
  collectFormDocumentPdfPageElements,
  downloadFormDocumentPdfFromPageElements,
} from '@/features/template/lib/generate-form-document-pdf'
import {
  createUjatEducationIssuanceA4Preview,
} from '@/features/template/model/ujat-education-issuance-a4-preview'
import { useCmsAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { UjatAssignmentFeedbackModal, type UjatFeedbackModalMode } from './ujat-assignment-feedback-modal'
import {
  buildUjatDocumentFileName,
  type UjatDocumentViewerTarget,
} from './ujat-document-viewer-types'
import { createVolunteerFilledDraft } from './ujat-document-volunteer-draft'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import './ujat-assignment-document-viewer-modal.css'

interface UjatAssignmentDocumentViewerModalProps {
  open: boolean
  onCancel: () => void
  target: UjatDocumentViewerTarget | null
}

function getEducationTargetLabel(institutionName: string): string {
  if (institutionName.includes('초등')) return '초등학교'
  if (institutionName.includes('중학')) return '중학교'
  if (institutionName.includes('고등')) return '고등학교'
  return '-'
}

function buildVolunteerUserInfoPreviewValues(
  target: UjatDocumentViewerTarget
): Record<string, string> {
  return {
    name: target.volunteerName,
    gender: '-',
    birthDate: '-',
    phone: '-',
    email: '-',
    addressRegion: target.regionLabel,
    addressDetail: '-',
    affiliation: target.institutionName,
    applicantType: '봉사자',
    programName: 'UJAT',
    period: '-',
    institutionName: target.institutionName,
    institutionRegion: target.regionLabel,
    educationTarget: getEducationTargetLabel(target.institutionName),
    educationGrade: target.assignedClass,
    teamName: '-',
    teamPartnerName: '-',
  }
}

export function UjatAssignmentDocumentViewerModal({
  open,
  onCancel,
  target,
}: UjatAssignmentDocumentViewerModalProps) {
  const { showAlert } = useCmsAlert()

  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [feedbackMode, setFeedbackMode] = useState<UjatFeedbackModalMode | null>(null)
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const pdfHostRef = useRef<HTMLDivElement>(null)

  const draft = useMemo(() => {
    if (!target) return null
    return createVolunteerFilledDraft(target)
  }, [target])

  const a4Variant = target?.docType === 'plan' ? 'plan' : 'journal'
  const ujatA4Preview = useMemo(() => {
    if (target == null) return null
    return createUjatEducationIssuanceA4Preview({
      variant: a4Variant,
      userInfoPreviewValues: buildVolunteerUserInfoPreviewValues(target),
      ...(target.docType === 'log'
        ? { journalInstitutionName: target.institutionName }
        : {}),
    })
  }, [a4Variant, target])
  const previewParagraphs = useMemo(
    () =>
      getA4PreviewParagraphs(
        draft?.paragraphs ?? [],
        ujatA4Preview?.a4HiddenParagraphIds
      ),
    [draft?.paragraphs, ujatA4Preview?.a4HiddenParagraphIds]
  )
  const paragraphBodyOptions = ujatA4Preview?.paragraphBodyOptions
  const a4RenderMode = ujatA4Preview?.a4PreviewOptions.a4RenderMode ?? 'contentOnly'
  const a4ParagraphGapPx = ujatA4Preview?.a4ParagraphGapPx

  const { pages, overflowParagraphIds, measureLayer } = useA4ParagraphPages({
    allParagraphs: previewParagraphs,
    titleNumbering: draft?.formSettings.titleNumbering ?? 'numeric',
    editorKind: 'survey',
    enabled: open && draft != null,
    paragraphBodyOptions,
    renderMode: a4RenderMode,
    paragraphGapPx: a4ParagraphGapPx,
  })

  const totalPages = pages.length || 1
  const safePageIndex = Math.min(currentPageIndex, totalPages - 1)
  const currentPageParagraphs = pages[safePageIndex] ?? []
  const allParagraphs = previewParagraphs
  const titleNumbering = draft?.formSettings.titleNumbering ?? 'numeric'

  const docTypeLabel = target?.docType === 'plan' ? '교육계획서' : '교육일지'
  const fileName = target ? buildUjatDocumentFileName(target) : ''
  const fallbackTitle =
    target?.docType === 'plan' ? 'UJAT 교육계획서' : 'UJAT 교육일지'
  const surveyTitle = draft != null ? getA4DocumentTitle(draft, fallbackTitle) : fallbackTitle

  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPageIndex(prev => Math.min(totalPages - 1, prev + 1))
  }, [totalPages])

  const handleClose = useCallback(() => {
    setCurrentPageIndex(0)
    setFeedbackMode(null)
    setSubmittedFeedback(null)
    onCancel()
  }, [onCancel])

  const handleFeedbackButtonClick = useCallback(() => {
    if (submittedFeedback != null) {
      setFeedbackMode('view')
    } else {
      setFeedbackMode('write')
    }
  }, [submittedFeedback])

  const handleFeedbackSubmit = useCallback((feedback: string) => {
    setSubmittedFeedback(feedback)
    setFeedbackMode(null)
  }, [])

  const handleDownloadPdf = useCallback(async () => {
    const root = pdfHostRef.current
    if (!root || pdfLoading) return
    setPdfLoading(true)
    try {
      const pageEls = collectFormDocumentPdfPageElements(root)
      await downloadFormDocumentPdfFromPageElements(
        pageEls,
        `${fileName}.pdf`
      )
    } catch (e) {
      handleError(e, { context: 'ujatDocumentViewerModal.downloadPdf' })
      showAlert({ title: '안내', content: 'PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setPdfLoading(false)
    }
  }, [fileName, pdfLoading, showAlert])

  const actionButtons = (
    <div className="full-page-modal__actions ujat-doc-viewer-modal__actions">
      <CmsButton variant="secondary" size="medium" onClick={handleClose}>
        닫기
      </CmsButton>
      <CmsButton
        variant={submittedFeedback != null ? 'default' : 'primary'}
        size="medium"
        width={120}
        onClick={handleFeedbackButtonClick}
      >
        {submittedFeedback != null ? '피드백 보기' : '피드백 작성'}
      </CmsButton>
      <CmsButton
        variant="default"
        size="medium"
        width={140}
        icon={<DownloadOutlined />}
        disabled={pdfLoading}
        onClick={() => void handleDownloadPdf()}
      >
        파일 다운로드
      </CmsButton>
    </div>
  )

  return (
    <>
      {open && draft != null ? measureLayer : null}

      <TealHeaderModal
        open={open}
        onCancel={handleClose}
        title=""
        size="full"
        hideHeader
        className="full-page-modal ujat-doc-viewer-modal"
      >
        <div className="full-page-modal__layout">
          <header className="full-page-modal__topbar">
            <div className="full-page-modal__title ujat-doc-viewer-modal__title-wrap">
              <span className="full-page-modal__title-text ujat-doc-viewer-modal__file-name">
                {fileName}
              </span>
              <span className="ujat-doc-viewer-modal__badge">미리보기</span>
            </div>
            <button
              type="button"
              className="full-page-modal__close"
              onClick={handleClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="full-page-modal__body">
            <div className="full-page-modal__body-header">
              <p className="full-page-modal__description ujat-doc-viewer-modal__description">
                봉사자가 제출한 {docTypeLabel} 미리보기 화면입니다.
              </p>
              {actionButtons}
            </div>

            <div className="ujat-doc-viewer-modal__workspace">
              <div className="ujat-doc-viewer-modal__page">
                <A4DocumentPageLayout title={surveyTitle} pageIndex={safePageIndex}>
                  <FormDocumentPreviewBody
                    paragraphs={currentPageParagraphs}
                    allParagraphs={allParagraphs}
                    titleNumbering={titleNumbering}
                    editorKind="survey"
                    overflowParagraphIds={overflowParagraphIds}
                    renderMode={a4RenderMode}
                    paragraphBodyOptions={paragraphBodyOptions}
                    paragraphGapPx={a4ParagraphGapPx}
                  />
                </A4DocumentPageLayout>
              </div>

              <div className="ujat-doc-viewer-modal__page-nav">
                <button
                  type="button"
                  className="ujat-doc-viewer-modal__page-nav-btn"
                  onClick={handlePrevPage}
                  disabled={safePageIndex === 0}
                  aria-label="이전 페이지"
                >
                  <LeftOutlined />
                </button>
                <span className="ujat-doc-viewer-modal__page-indicator">
                  {safePageIndex + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  className="ujat-doc-viewer-modal__page-nav-btn"
                  onClick={handleNextPage}
                  disabled={safePageIndex >= totalPages - 1}
                  aria-label="다음 페이지"
                >
                  <RightOutlined />
                </button>
              </div>
            </div>
            <div className="full-page-modal__body-bottom" aria-hidden="true" />
          </div>
        </div>
      </TealHeaderModal>

      {/* 오프스크린 PDF 렌더 호스트 */}
      {open && draft != null ? (
        <div ref={pdfHostRef} className="ujat-doc-viewer-modal__pdf-host" aria-hidden="true">
          {pages.map((pageParagraphs, pageIndex) => (
            <A4DocumentPageLayout
              key={pageIndex}
              title={surveyTitle}
              pageIndex={pageIndex}
              pdfCapture
            >
              <div style={{ width: '100%', paddingBottom: 16, boxSizing: 'border-box' }}>
                <FormDocumentPreviewBody
                  paragraphs={pageParagraphs}
                  allParagraphs={allParagraphs}
                  titleNumbering={titleNumbering}
                  editorKind="survey"
                  overflowParagraphIds={overflowParagraphIds}
                  renderMode={a4RenderMode}
                  paragraphBodyOptions={paragraphBodyOptions}
                  paragraphGapPx={a4ParagraphGapPx}
                />
              </div>
            </A4DocumentPageLayout>
          ))}
        </div>
      ) : null}

      {target != null ? (
        <UjatAssignmentFeedbackModal
          open={feedbackMode != null}
          onCancel={() => setFeedbackMode(null)}
          mode={feedbackMode ?? 'write'}
          volunteerName={target.volunteerName}
          docTypeLabel={docTypeLabel}
          existingFeedback={submittedFeedback ?? ''}
          onSubmit={handleFeedbackSubmit}
        />
      ) : null}
    </>
  )
}
