import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFPagination, PFLoadingSpinner, PFText } from '@/shared/ui'
import type { LectureReportContent } from '../api/lecture-report-client'
import { LectureReportPreviewBody } from './lecture-report-preview-body'
import { LectureReportPreviewPage } from './lecture-report-preview-page'
import styles from './lecture-report-preview-overlay.module.css'

const PREVIEW_NOTICE = '현재 화면은 미리보기 화면입니다.'

type LectureReportPreviewOverlayProps = {
  open: boolean
  title: string
  draft: WritingFormDraft | null
  content: LectureReportContent | null
  onClose: () => void
  loading?: boolean
  error?: string
}

function paragraphWeight(paragraph: WritingFormDraft['paragraphs'][number]): number {
  if (paragraph.kind === 'single_item') {
    if (paragraph.variant === 'lecture_report_program_progress') return 3
    if (paragraph.variant === 'session_plan_short_essay') return 1 + (paragraph.items?.length ?? 1)
    if (paragraph.variant === 'short_essay') return 1 + (paragraph.items?.length ?? 1)
    return 1
  }
  return paragraph.variant === 'closing' ? 1 : 0
}

function splitLectureReportPages(draft: WritingFormDraft): WritingFormDraft['paragraphs'][] {
  const visible = draft.paragraphs.filter(
    paragraph => !(paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'),
  )
  if (visible.length === 0) return [[]]

  const pages: WritingFormDraft['paragraphs'][] = []
  let current: WritingFormDraft['paragraphs'] = []
  let currentWeight = 0
  const pageCapacity = 7

  for (const paragraph of visible) {
    const weight = paragraphWeight(paragraph)
    if (current.length > 0 && currentWeight + weight > pageCapacity) {
      pages.push(current)
      current = []
      currentWeight = 0
    }
    current.push(paragraph)
    currentWeight += weight
  }
  if (current.length > 0) pages.push(current)
  return pages.length > 0 ? pages : [[]]
}

export function LectureReportPreviewOverlay({
  open,
  title,
  draft,
  content,
  onClose,
  loading = false,
  error = '',
}: LectureReportPreviewOverlayProps) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!open) return
    const body = document.body
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [open])

  const pages = useMemo(() => (draft ? splitLectureReportPages(draft) : [[]]), [draft])
  const totalPages = Math.max(1, pages.length)
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const activeParagraphs = pages[safePage - 1] ?? []
  const pageDraft = draft ? { ...draft, paragraphs: activeParagraphs } : null

  if (!open) return null

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="강의보고서 미리보기">
      <header className={styles.topBar}>
        <PFText as="h2" typo="hl-lg" color="black" className={styles.topBarTitle}>
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

      <div className={styles.bottomChrome}>
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
      </div>
    </div>,
    document.body,
  )
}
