import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildPlatformConsentFillOptions, isCrimeConsentTemplate } from '@jakorea/form-schema/consent'
import type { PaymentStatementBasicInfoValues } from '@jakorea/form-schema/consent'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PlatformConsentFormBody } from '@/features/mypage/instructor-apply/consent/platform-consent-form-body'
import closeIconUrl from '@/shared/ui/pf-modal/icons/close.svg'
import { PFPagination, PFLoadingSpinner, PFText } from '@/shared/ui'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { fetchPortalConsentDocument } from '../api/consents'
import { fetchSubmittedCrimeConsentOriginal } from '../lib/download-submitted-crime-consent'
import { renderCrimeConsentPdfToPageObjectUrls } from '../lib/render-crime-consent-preview-pages'
import {
  buildConsentDocumentPreviewHeaderTitle,
  resolveConsentDocumentA4Title,
  resolveConsentDocumentPreviewConfig,
} from '../lib/consent-document-preview-config'
import { resolveConsentA4PreviewDateLabel } from '../lib/format-consent-submitted-date'
import { loadConsentPreviewSignature } from '../lib/load-consent-preview-signature'
import {
  readPaymentBasicInfoFromConsentDetail,
  resolveConsentPreviewDraft,
  resolveConsentPreviewTemplateId,
} from '../lib/parse-consent-document-draft'
import { resolveConsentPreviewSignerName } from '../lib/resolve-consent-preview-signer'
import {
  filterPreviewParagraphs,
  sliceDraftForParagraphs,
  splitParagraphsIntoPages,
} from '../lib/split-consent-draft-pages'
import type { SettingsConsentItem } from '../lib/consent-catalog'
import { ConsentDocumentA4Page } from './consent-document-a4-page'
import styles from './consent-document-preview-overlay.module.css'

const LOAD_FAILED_MESSAGE = '동의서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
const NO_SUBMITTED_DOCUMENT_MESSAGE =
  '제출된 동의서를 찾을 수 없어요. 잠시 후 다시 시도하거나 고객센터로 문의해 주세요.'
const PREVIEW_NOTICE = '현재 화면은 미리보기 화면입니다.'

function revokePreviewObjectUrl(url: string | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function revokePreviewObjectUrls(urls: readonly string[]) {
  urls.forEach(revokePreviewObjectUrl)
}

export type ConsentDocumentPreviewTarget = SettingsConsentItem

type ConsentDocumentPreviewOverlayProps = {
  open: boolean
  item: ConsentDocumentPreviewTarget | null
  isRemoteSession: boolean
  onClose: () => void
  /** 원격 제출본이 없을 때 강사 신청 로컬 작성 초안을 미리보기에 사용 */
  fallbackDraft?: WritingFormDraft | null
  fallbackPaymentBasicInfo?: Partial<PaymentStatementBasicInfoValues>
  /** 방금 작성한 전자서명 이미지(data URL). 원격 documentId가 없을 때 사용 */
  fallbackSignatureImageSrc?: string | null
}

function ConsentDocumentPreviewBody({
  templateId,
  pageDraft,
  titleNumberingParagraphs,
  submittedDateLabel,
  showClosingRecipient,
  paymentBasicInfo,
  signerName,
  signatureImageSrc,
}: {
  templateId: string
  pageDraft: WritingFormDraft
  /** 전체 쪽 단락 — 쪽마다 번호를 1부터 다시 세지 않도록 */
  titleNumberingParagraphs?: readonly WritingFormParagraph[]
  submittedDateLabel: string
  showClosingRecipient: boolean
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoValues>
  signerName?: string
  signatureImageSrc?: string
}) {
  const fillOptions = useMemo(
    () => buildPlatformConsentFillOptions(templateId),
    [templateId],
  )

  return (
    <PlatformConsentFormBody
      draft={pageDraft}
      hiddenParagraphIds={new Set()}
      onUpdateParagraph={() => undefined}
      fillOptions={fillOptions}
      documentPreview
      documentPreviewTemplateId={templateId}
      titleNumberingParagraphs={titleNumberingParagraphs}
      submittedDateLabel={submittedDateLabel}
      showClosingRecipient={showClosingRecipient}
      paymentBasicInfo={paymentBasicInfo}
      signerName={signerName}
      signatureImageSrc={signatureImageSrc}
    />
  )
}

export function ConsentDocumentPreviewOverlay({
  open,
  item,
  isRemoteSession,
  onClose,
  fallbackDraft = null,
  fallbackPaymentBasicInfo,
  fallbackSignatureImageSrc = null,
}: ConsentDocumentPreviewOverlayProps) {
  const { displayName: memberName } = useMypageMember()
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  /** 성범죄 동의서 — 제출 원본(PDF는 페이지별 이미지) */
  const [crimePageSrcs, setCrimePageSrcs] = useState<string[]>([])
  const [loadFailedMessage, setLoadFailedMessage] = useState(LOAD_FAILED_MESSAGE)
  const [submittedAtRaw, setSubmittedAtRaw] = useState<string | undefined>()
  const [paymentBasicInfo, setPaymentBasicInfo] = useState<
    Partial<PaymentStatementBasicInfoValues> | undefined
  >()
  const [signatureDisplayName, setSignatureDisplayName] = useState('')
  const [signatureImageSrc, setSignatureImageSrc] = useState<string | undefined>()
  const [isSubmittedDocument, setIsSubmittedDocument] = useState(false)

  const previewConfig = item ? resolveConsentDocumentPreviewConfig(item.id) : null
  const headerTitle = item ? buildConsentDocumentPreviewHeaderTitle(item.title) : ''
  const documentTitle =
    item != null && previewConfig != null
      ? resolveConsentDocumentA4Title(previewConfig.templateId, item.title)
      : (item?.title ?? '')

  useEffect(() => {
    if (!open) return
    setCurrentPage(1)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || item == null || previewConfig == null) {
      setDraft(null)
      setCrimePageSrcs(previous => {
        revokePreviewObjectUrls(previous)
        return []
      })
      setSubmittedAtRaw(undefined)
      setPaymentBasicInfo(undefined)
      setSignatureDisplayName('')
      setSignatureImageSrc(previous => {
        revokePreviewObjectUrl(previous)
        return undefined
      })
      setIsSubmittedDocument(false)
      setLoadFailed(false)
      setLoadFailedMessage(LOAD_FAILED_MESSAGE)
      setIsLoading(false)
      return
    }

    let cancelled = false
    const { templateId } = previewConfig

    const load = async () => {
      setIsLoading(true)
      setLoadFailed(false)
      setLoadFailedMessage(LOAD_FAILED_MESSAGE)
      setDraft(null)
      setCrimePageSrcs(previous => {
        revokePreviewObjectUrls(previous)
        return []
      })
      setSubmittedAtRaw(item.agreedAt)
      setPaymentBasicInfo(undefined)
      setSignatureDisplayName('')
      setSignatureImageSrc(previous => {
        revokePreviewObjectUrl(previous)
        return undefined
      })
      setIsSubmittedDocument(false)

      const applyLocalDraftFallback = () => {
        setIsSubmittedDocument(false)
        setDraft(fallbackDraft)
        setPaymentBasicInfo(fallbackPaymentBasicInfo)
        const localImage = fallbackSignatureImageSrc?.trim()
        if (localImage) {
          setSignatureImageSrc(previous => {
            revokePreviewObjectUrl(previous)
            return localImage
          })
        }
      }

      try {
        let detail = null
        if (isRemoteSession) {
          if (item.documentId == null) {
            if (fallbackDraft != null && !isCrimeConsentTemplate(templateId)) {
              applyLocalDraftFallback()
              return
            }
            setLoadFailed(true)
            setLoadFailedMessage(NO_SUBMITTED_DOCUMENT_MESSAGE)
            return
          }
          detail = await fetchPortalConsentDocument(item.documentId)
          if (!cancelled) {
            setIsSubmittedDocument(true)
            setSubmittedAtRaw(detail.signedAt?.trim() || item.agreedAt)
            setPaymentBasicInfo(readPaymentBasicInfoFromConsentDetail(detail))
            const signature = await loadConsentPreviewSignature({
              signatureFields: detail.signatureFields,
            })
            if (!cancelled) {
              setSignatureDisplayName(signature.displayName)
              setSignatureImageSrc(previous => {
                revokePreviewObjectUrl(previous)
                return signature.imageSrc ?? undefined
              })
            } else if (signature.imageSrc) {
              revokePreviewObjectUrl(signature.imageSrc)
            }
          }
        }
        if (cancelled) return

        const previewTemplateId = resolveConsentPreviewTemplateId(detail, templateId)

        if (isCrimeConsentTemplate(previewTemplateId)) {
          // 제출 원본은 GET .../content로 받는다. detail.content는 약관 본문이라 주소로 쓰지 않는다.
          let crimePages: string[] = []
          if (isRemoteSession && item.documentId != null) {
            const original = await fetchSubmittedCrimeConsentOriginal(item.documentId)
            crimePages =
              original.kind === 'pdf'
                ? await renderCrimeConsentPdfToPageObjectUrls(original.blob)
                : [URL.createObjectURL(original.blob)]
          } else {
            const content = detail?.content?.trim()
            if (content && (content.startsWith('http') || content.startsWith('data:'))) {
              crimePages = [content]
            }
          }
          if (cancelled) {
            revokePreviewObjectUrls(crimePages)
            return
          }
          if (crimePages.length === 0) {
            setLoadFailed(true)
            return
          }
          setCrimePageSrcs(previous => {
            revokePreviewObjectUrls(previous)
            return crimePages
          })
          return
        }

        const resolved = resolveConsentPreviewDraft(detail, previewTemplateId, {
          allowTemplateSeedFallback: !isRemoteSession && fallbackDraft == null,
        })
        if (resolved == null) {
          if (fallbackDraft != null && !isCrimeConsentTemplate(templateId)) {
            applyLocalDraftFallback()
            return
          }
          setLoadFailed(true)
          setLoadFailedMessage(
            isRemoteSession ? NO_SUBMITTED_DOCUMENT_MESSAGE : LOAD_FAILED_MESSAGE,
          )
          return
        }
        setDraft(resolved)
      } catch {
        if (!cancelled) {
          setLoadFailed(true)
          setLoadFailedMessage(LOAD_FAILED_MESSAGE)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [
    open,
    item,
    previewConfig,
    isRemoteSession,
    fallbackDraft,
    fallbackPaymentBasicInfo,
    fallbackSignatureImageSrc,
  ])

  const pages = useMemo(() => {
    if (draft == null || previewConfig == null) return [[]]
    const visible = filterPreviewParagraphs(draft.paragraphs, previewConfig.a4HiddenParagraphIds)
    return splitParagraphsIntoPages(visible, previewConfig.pageBreakBeforeParagraphIds)
  }, [draft, previewConfig])

  const allPageParagraphs = useMemo(() => pages.flat(), [pages])
  const totalPages = Math.max(1, crimePageSrcs.length > 0 ? crimePageSrcs.length : pages.length)
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const activeParagraphs = pages[safePage - 1] ?? []
  const pageDraft =
    draft != null ? sliceDraftForParagraphs(draft, activeParagraphs) : null
  const submittedDateLabel = resolveConsentA4PreviewDateLabel(submittedAtRaw, isSubmittedDocument)
  const signerName = isSubmittedDocument
    ? resolveConsentPreviewSignerName({
        draft,
        paymentName: paymentBasicInfo?.nameKo,
        memberName,
        signatureDisplayName,
      })
    : ''
  const showClosingRecipient =
    previewConfig?.templateId === 'agreement-third-party' && safePage === totalPages

  if (!open || item == null) return null

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={headerTitle}>
      <header className={styles.topBar}>
        <PFText as="h2" typo="hl-lg" color="black" className={styles.topBarTitle}>
          {headerTitle}
        </PFText>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <img src={closeIconUrl} alt="" aria-hidden />
        </button>
      </header>

      <div className={styles.documentScroll}>
        {isLoading ? (
          <PFLoadingSpinner label="동의서를 불러오는 중" />
        ) : null}

        {!isLoading && loadFailed ? (
          <PFText as="p" typo="bd-md-rg" color="error">
            {loadFailedMessage}
          </PFText>
        ) : null}

        {!isLoading && !loadFailed && crimePageSrcs.length > 0 ? (
          <ConsentDocumentA4Page title={documentTitle} pageIndex={safePage - 1}>
            <img
              className={styles.crimeImage}
              src={crimePageSrcs[safePage - 1] ?? crimePageSrcs[0]}
              alt={documentTitle}
            />
          </ConsentDocumentA4Page>
        ) : null}

        {!isLoading && !loadFailed && pageDraft != null ? (
          <ConsentDocumentA4Page title={documentTitle} pageIndex={safePage - 1}>
            <div className={styles.previewForm}>
              <ConsentDocumentPreviewBody
                templateId={previewConfig!.templateId}
                pageDraft={pageDraft}
                titleNumberingParagraphs={allPageParagraphs}
                submittedDateLabel={submittedDateLabel}
                showClosingRecipient={showClosingRecipient}
                paymentBasicInfo={paymentBasicInfo}
                signerName={signerName}
                signatureImageSrc={signatureImageSrc}
              />
            </div>
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
          ariaLabel="동의서 미리보기 페이지"
          className={styles.pagination}
        />
      </div>
    </div>,
    document.body,
  )
}
