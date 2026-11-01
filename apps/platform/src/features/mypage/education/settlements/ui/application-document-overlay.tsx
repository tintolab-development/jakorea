import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFLoadingSpinner, PFPagination, PFText } from '@/shared/ui'
import { ConsentDocumentA4Page } from '@/features/mypage/settings/ui/consent-document-a4-page'
import type { SettlementApplicationDocumentResponse } from '../api/application-document-types'
import {
  EducationSettlementApplicationDocumentView,
  type SettlementApplicationDocumentPage,
} from './application-document-view'
import styles from './application-document-overlay.module.css'

const PREVIEW_NOTICE = '현재 화면은 미리보기 화면입니다.'
const DEFAULT_DOCUMENT_TITLE = 'JA KOREA 정산 신청서'

type EducationSettlementApplicationDocumentOverlayProps = {
  open: boolean
  document: SettlementApplicationDocumentResponse | null
  programTitle?: string | null
  loading?: boolean
  error?: string
  refreshing?: boolean
  onClose: () => void
  onRefreshDocument: () => void | Promise<unknown>
}

function resolveDocumentPages(
  applicationDocument: SettlementApplicationDocumentResponse | null,
): SettlementApplicationDocumentPage[] {
  if (applicationDocument == null) return ['summary']
  if (applicationDocument.attachments.length > 0) return ['summary', 'attachments']
  return ['summary']
}

export function EducationSettlementApplicationDocumentOverlay({
  open,
  document: applicationDocument,
  programTitle,
  loading = false,
  error = '',
  refreshing = false,
  onClose,
  onRefreshDocument,
}: EducationSettlementApplicationDocumentOverlayProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pages = useMemo(
    () => resolveDocumentPages(applicationDocument),
    [applicationDocument],
  )
  const totalPages = Math.max(1, pages.length)
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const activePage = pages[safePage - 1] ?? 'summary'
  const sheetTitle = applicationDocument?.title.trim() || DEFAULT_DOCUMENT_TITLE

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby="settlement-application-document-overlay-title">
      <header className={styles.topBar}>
        <PFText
          as="h2"
          id="settlement-application-document-overlay-title"
          typo="hl-lg"
          color="black"
          className={styles.topBarTitle}
        >
          {sheetTitle}
        </PFText>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <img src={closeIconUrl} alt="" aria-hidden />
        </button>
      </header>

      <div className={styles.documentScroll}>
        {loading ? (
          <div className={styles.state}>
            <PFLoadingSpinner label="정산 신청서를 불러오는 중" />
          </div>
        ) : null}
        {!loading && error ? (
          <PFText as="p" typo="bd-md-rg" color="error" className={styles.state}>
            {error}
          </PFText>
        ) : null}
        {!loading && !error && applicationDocument == null ? (
          <PFText as="p" typo="bd-md-rg" color="error" className={styles.state}>
            정산 신청서를 불러오지 못했습니다.
          </PFText>
        ) : null}
        {!loading && !error && applicationDocument != null ? (
          <ConsentDocumentA4Page title={sheetTitle} pageIndex={safePage - 1}>
            <EducationSettlementApplicationDocumentView
              document={applicationDocument}
              programTitle={programTitle}
              page={activePage}
              onRefreshDocument={onRefreshDocument}
              refreshing={refreshing}
            />
          </ConsentDocumentA4Page>
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
          ariaLabel="정산 신청서 미리보기 페이지"
          className={styles.pagination}
        />
      </div>
    </div>,
    document.body,
  )
}
