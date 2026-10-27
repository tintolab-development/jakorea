import { useEffect, useMemo, useState } from 'react'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFPagination, PFLoadingSpinner, PFModal, PFText } from '@/shared/ui'
import type { LectureReportContent } from '../api/lecture-report-client'
import { LectureReportPreviewBody } from './lecture-report-preview-body'
import { LectureReportPreviewPage } from './lecture-report-preview-page'
import styles from './lecture-report-preview-modal.module.css'

const PREVIEW_NOTICE = '현재 화면은 미리보기 화면입니다.'

type LectureReportPreviewModalProps = {
  open: boolean
  title: string
  draft: WritingFormDraft | null
  content: LectureReportContent | null
  onClose: () => void
  loading?: boolean
  error?: string
}

function splitLectureReportPages(draft: WritingFormDraft): WritingFormDraft['paragraphs'][] {
  const visible = draft.paragraphs.filter(
    paragraph => !(paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'),
  )
  if (visible.length === 0) return [[]]

  const photosId = LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationPhotos
  const photosIndex = visible.findIndex(paragraph => paragraph.id === photosId)
  if (photosIndex < 0) return [visible]

  const beforePhotos = visible.slice(0, photosIndex)
  const photosPage = visible.slice(photosIndex)
  if (beforePhotos.length === 0) return [photosPage]
  if (photosPage.length === 0) return [beforePhotos]
  return [beforePhotos, photosPage]
}

export function LectureReportPreviewModal({
  open,
  title,
  draft,
  content,
  onClose,
  loading = false,
  error = '',
}: LectureReportPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!open) setCurrentPage(1)
  }, [open, draft])

  const pages = useMemo(() => (draft ? splitLectureReportPages(draft) : [[]]), [draft])
  const totalPages = Math.max(1, pages.length)
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const activeParagraphs = pages[safePage - 1] ?? []
  const pageDraft = draft ? { ...draft, paragraphs: activeParagraphs } : null

  return (
    <PFModal
      open={open}
      onClose={onClose}
      mobilePlacement="full"
      className={styles.modal}
      closeOnBackdropClick
      ariaLabelledBy="lecture-report-preview-modal-title"
    >
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <PFText
            as="h2"
            id="lecture-report-preview-modal-title"
            typo="hl-lg"
            color="black"
            className={styles.topBarTitle}
          >
            강의보고서 미리보기
          </PFText>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            <img src={closeIconUrl} alt="" aria-hidden />
          </button>
        </header>

        <div className={styles.documentScroll}>
          {loading ? (
            <div className={styles.state}>
              <PFLoadingSpinner label="강의보고서를 불러오는 중" />
            </div>
          ) : null}
          {!loading && error ? (
            <PFText as="p" typo="bd-md-rg" color="error" className={styles.state}>
              {error}
            </PFText>
          ) : null}
          {!loading && !error && pageDraft == null ? (
            <PFText as="p" typo="bd-md-rg" color="error" className={styles.state}>
              강의보고서 미리보기 내용을 불러오지 못했습니다.
            </PFText>
          ) : null}
          {!loading && !error && pageDraft != null ? (
            <LectureReportPreviewPage title={title} pageIndex={safePage - 1}>
              <LectureReportPreviewBody draft={pageDraft} content={content} />
            </LectureReportPreviewPage>
          ) : null}
        </div>

        <footer className={styles.bottomChrome}>
          <p className={styles.previewBadge}>{PREVIEW_NOTICE}</p>
          <PFPagination
            variant="compact"
            size="small"
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            ariaLabel="강의보고서 미리보기 페이지"
            className={styles.pagination}
          />
        </footer>
      </div>
    </PFModal>
  )
}
