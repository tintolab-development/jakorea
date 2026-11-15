import { ModalCloseIcon } from '@/shared/ui/icons'
import { FullscreenSpinner } from '@/shared/ui/fullscreen-spinner'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveAgreementA4DocumentHiddenParagraphIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { AGREEMENT_CRIME_TEMPLATE_CODE } from '@/features/template/lib/agreement-crime-consent-settings'
import { schemaJsonToWritingFormDraft } from '@/features/template/api/adapters/form-template-draft-adapters'
import {
  normalizeNoticeIdTypeResidentInputInDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import { TemplatePreviewModal } from '@/features/template/ui/modal/template-preview-modal'
import { CrimeConsentDocumentPreview } from '@/features/template/ui/template-management/crime-consent-document-preview'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import { useConsentFilledDocumentMutation } from '@/features/user/api/hooks/use-consent-filled-document-mutation'
import {
  fetchConsentCrimeOriginalBlobRemote,
  fetchConsentDocumentDownloadBlobRemote,
  fetchConsentDocumentViewBlobRemote,
  fetchConsentEvidenceBlobRemote,
  fetchConsentSignedDocumentRemote,
  loadConsentSignedSignatureBlobRemote,
} from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal'
import {
  shouldAttemptSubmittedConsentDocumentFetch,
  type MemberConsentAgreeOnlyPreviewResult,
} from '@/features/user/shared/lib/build-member-consent-agree-only-preview-draft'
import { restoreAgreementNoticeFilledDocumentDraft } from '@/features/user/shared/lib/restore-agreement-notice-filled-document-draft'
import {
  MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON,
  memberConsentViewRequiresPrivacyReveal,
} from '@/features/user/shared/lib/member-consent-view-privacy'
import type { FilledDocumentResponse } from '@/shared/api/generated/members/schemas/filledDocumentResponse'
import type { PaymentStatementBasicInfo } from '@/shared/api/generated/members/schemas/paymentStatementBasicInfo'
import { PAYMENT_STATEMENT_DEFAULT_PURPOSE } from '@jakorea/form-schema/consent'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { downloadBlob } from '@/shared/utils/file-download'
import { handleError } from '@/shared/utils/error-handler'
import type { User } from '@/types/user'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canDownloadSensitiveConsentFile } from '@/shared/lib/can-download-sensitive-consent-file'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import type { ProtectedFileDownloadKind } from '@jakorea/domain/shared/protected-file-download-kinds'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './member-consent-agreement-modal.css'
import './member-consent-document-view-modal.css'

const MEMBER_CONSENT_VIEW_MODAL_Z_INDEX = 1200
const REVEAL_REASON_MODAL_Z_INDEX = 1300
const DEFAULT_CRIME_DOWNLOAD_FILENAME = '성범죄_경력조회_동의서.pdf'
const NO_SUBMITTED_CONSENT_MESSAGE = '제출된 동의서를 불러올 수 없습니다.'
const CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE =
  '제출된 성범죄 경력조회 동의서 원본을 불러올 수 없습니다.'
const SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE =
  '제출된 동의서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 서명 PDF는 BE 양식 그대로 보여 준다. 주석 값을 글자로 다시 쓰지 않는다.
 * 업로드 원본(성범죄 등)은 기존처럼 주석 값을 얹는다.
 */
export function consentFileViewPaintsPdfAnnotations(input: {
  signedPdfAvailable?: boolean
  signedPdfViewEndpoint?: string | null
  viewEndpoint?: string | null
}): boolean {
  const signedEndpoint = input.signedPdfViewEndpoint?.trim()
  if (
    input.signedPdfAvailable === true &&
    signedEndpoint &&
    input.viewEndpoint === signedEndpoint
  ) {
    return false
  }
  return true
}

export interface MemberConsentDocumentViewModalProps {
  open: boolean
  templateId: string
  modalTitle: string
  memberId?: number
  consentType?: string
  membersRemote?: boolean
  /** true면 제출 filled-document 경로. false/undefined면 동의-only 합성 미리보기(메타 없을 때) */
  filledDocumentAvailable?: boolean
  formResponseId?: number
  consentRecordId?: number
  filledDocumentId?: number
  filledDocumentRevealEndpoint?: string
  /**
   * 회원 상세 Summary 전용 (BE 회신 1~3번). 값이 있으면 작성본·서명본 대신
   * 서명 PDF(우선) 또는 업로드 원본을 열람 주소로 받아 A4 이미지로 보여 준다.
   */
  signedPdfAvailable?: boolean
  signedPdfViewEndpoint?: string
  signedPdfDownloadEndpoint?: string
  originalAvailable?: boolean
  originalViewEndpoint?: string
  originalDownloadEndpoint?: string
  /** consent-records 메타 없을 때 filled-document API 시도 여부 */
  documentAgreed?: boolean
  /** 동의-only 미리보기 PII 주입용 */
  memberUser?: Omit<User, 'password'>
  /** 프로그램 맥락의 Program Owner 여부. 미지정 시 전역 역할만으로 판단 */
  isProgramOwner?: boolean | null
  onClose: () => void
}

function filledSchemaToDraft(schemaJson: unknown): WritingFormDraft | null {
  if (schemaJson == null) return null
  try {
    const parsed = schemaJsonToWritingFormDraft(schemaJson as string | Record<string, unknown>)
    if (parsed == null) return null
    return normalizeNoticeIdTypeResidentInputInDraft(parsed)
  } catch {
    return null
  }
}

function paymentInfoToAutofill(
  info: PaymentStatementBasicInfo | undefined
): Partial<PaymentStatementBasicInfoAutofillValues> | undefined {
  if (info == null) return undefined
  return {
    nameKo: info.nameKo ?? '',
    nameEn: info.nameEn ?? '',
    residentFront: info.residentFront ?? '',
    residentBack: info.residentBack ?? '',
    affiliation: info.affiliation ?? '',
    noAffiliation: info.noAffiliation ?? false,
    addressRoad: info.addressRoad ?? '',
    addressDetail: info.addressDetail ?? '',
    bankName: info.bankName ?? '',
    accountNumber: info.accountNumber ?? '',
    accountHolder: info.accountHolder ?? '',
    paymentPurpose: info.paymentPurpose?.trim() || PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  }
}

/**
 * 파일 문서 보기 — 서명 PDF·업로드 원본(PDF/JPG/PNG)을 A4 이미지로 보여 준다.
 * 시안 「동의서 미리보기」(8247:6612)의 성범죄 동의서 레이아웃을 그대로 쓴다.
 */
function MemberConsentFileDocumentView({
  open,
  modalTitle,
  objectUrl,
  mimeType,
  fileName,
  isLoading,
  loadFailed,
  emptyMessage,
  canDownloadFile,
  downloadAvailable,
  paintAnnotationOverlays = true,
  onDownloadFile,
  onClose,
}: {
  open: boolean
  modalTitle: string
  objectUrl: string | null
  mimeType: string | null
  fileName: string
  isLoading: boolean
  loadFailed: boolean
  emptyMessage: string
  canDownloadFile: boolean
  /** 다운로드할 파일 존재 — 「문서 다운로드」 활성 조건 */
  downloadAvailable: boolean
  /** 서명 PDF는 false. 업로드 원본은 true */
  paintAnnotationOverlays?: boolean
  onDownloadFile: () => void
  onClose: () => void
}) {
  const handleDownload = useCallback(() => {
    if (!canDownloadFile || !downloadAvailable) return
    onDownloadFile()
  }, [canDownloadFile, downloadAvailable, onDownloadFile])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title={modalTitle}
      size="full"
      hideHeader
      zIndex={MEMBER_CONSENT_VIEW_MODAL_Z_INDEX}
      className="crime-consent-doc-modal member-consent-document-view-modal"
    >
      <div className="crime-consent-doc-modal__layout">
        <header className="crime-consent-doc-modal__topbar">
          <div className="crime-consent-doc-modal__title-row">
            <span className="crime-consent-doc-modal__title-text">{modalTitle}</span>
          </div>
          <button
            type="button"
            className="crime-consent-doc-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <ModalCloseIcon />
          </button>
        </header>

        <div className="crime-consent-doc-modal__body">
          <div className="crime-consent-doc-modal__toolbar member-consent-document-view-modal__toolbar">
            <div className="crime-consent-doc-modal__actions member-consent-document-view-modal__actions">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
              {canDownloadFile ? (
                <CmsButton
                  variant="secondary"
                  icon={<ButtonDownloadIcon />}
                  onClick={handleDownload}
                  size="medium"
                  disabled={!downloadAvailable}
                >
                  문서 다운로드
                </CmsButton>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <FullscreenSpinner />
          ) : objectUrl != null ? (
            <div className="crime-consent-doc-modal__a4-outer">
              <CrimeConsentDocumentPreview
                src={objectUrl}
                fileName={fileName}
                mimeType={mimeType}
                alt={modalTitle}
                paintAnnotationOverlays={paintAnnotationOverlays}
              />
            </div>
          ) : loadFailed ? (
            <p className="member-consent-agreement-modal__error">{emptyMessage}</p>
          ) : null}
        </div>
      </div>
    </TealHeaderModal>
  )
}

function MemberConsentAgreementDocumentView({
  open,
  templateId,
  modalTitle,
  filled,
  synthetic,
  isSyntheticPreview,
  isLoading,
  loadFailed,
  memberUser,
  signatureImageSrc,
  canDownloadFile,
  onDownloadFile,
  onClose,
}: {
  open: boolean
  templateId: string
  modalTitle: string
  filled: FilledDocumentResponse | null
  synthetic: MemberConsentAgreeOnlyPreviewResult | null
  isSyntheticPreview: boolean
  isLoading: boolean
  loadFailed: boolean
  memberUser?: Omit<User, 'password'>
  signatureImageSrc?: string | null
  canDownloadFile: boolean
  onDownloadFile: () => void
  onClose: () => void
}) {
  const agreementConfig = useMemo(() => resolveAgreementWritingFormConfig(templateId), [templateId])
  const submittedDraft = useMemo(
    () => filledSchemaToDraft(filled?.schemaJson),
    [filled?.schemaJson]
  )
  const submittedPayment = useMemo(
    () => paymentInfoToAutofill(filled?.paymentBasicInfo),
    [filled?.paymentBasicInfo]
  )

  const paymentValues = isSyntheticPreview ? synthetic?.paymentBasicInfo : submittedPayment
  const participantName =
    (isSyntheticPreview ? synthetic?.participantName : undefined)?.trim() ||
    memberUser?.name?.trim() ||
    undefined

  const paragraphBodyOptions = useMemo(() => {
    const base = agreementConfig?.paragraphBodyOptions
    const withCommon = {
      ...(base ?? {}),
      paragraphInteractionMode: 'preview' as const,
      paymentStatementDisplayMode: 'document' as const,
      /** 시안 5767:42795 — 응답 칸 텍스트·동의 라디오 disabled 스킨(보기 전용) */
      agreementDocumentReadOnlyView: true,
      ...(paymentValues != null ? { paymentStatementBasicInfoValues: paymentValues } : {}),
      ...(participantName != null && participantName !== ''
        ? { agreementSystemParticipantName: participantName }
        : {}),
    }
    const showSubmittedSignatureStack = !isSyntheticPreview && filled != null
    if (!showSubmittedSignatureStack) return withCommon
    const signatureSrc = signatureImageSrc?.trim() ?? ''
    const savedAt = filled.savedAt?.trim()
    return {
      ...withCommon,
      agreementAdminProxyConfirm: false,
      hiddenParagraphIds: resolveAgreementA4DocumentHiddenParagraphIds(
        withCommon.hiddenParagraphIds
      ),
      agreementSystemDisplayMode: 'document' as const,
      ...(signatureSrc ? { agreementSystemSignatureImageSrc: signatureSrc } : {}),
      ...(savedAt ? { agreementSystemNow: new Date(savedAt) } : {}),
    }
  }, [
    agreementConfig?.paragraphBodyOptions,
    filled,
    isSyntheticPreview,
    participantName,
    paymentValues,
    signatureImageSrc,
  ])

  const displayDraft = useMemo((): WritingFormDraft | null => {
    if (isSyntheticPreview) return synthetic?.draft ?? null
    if (submittedDraft == null) return null
    if (templateId === 'agreement-notice') {
      return restoreAgreementNoticeFilledDocumentDraft(submittedDraft)
    }
    return submittedDraft
  }, [isSyntheticPreview, synthetic?.draft, submittedDraft, templateId])

  const showEmpty = !isLoading && (loadFailed || displayDraft == null)
  const emptyMessage = loadFailed
    ? SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE
    : NO_SUBMITTED_CONSENT_MESSAGE

  if (isLoading) {
    return (
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title=""
        size="full"
        hideHeader
        zIndex={MEMBER_CONSENT_VIEW_MODAL_Z_INDEX}
        className="full-page-modal member-consent-agreement-modal member-consent-document-view-modal"
      >
        <FullscreenSpinner />
      </TealHeaderModal>
    )
  }

  if (showEmpty || displayDraft == null) {
    return (
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title=""
        size="full"
        hideHeader
        zIndex={MEMBER_CONSENT_VIEW_MODAL_Z_INDEX}
        className="full-page-modal member-consent-agreement-modal member-consent-document-view-modal"
      >
        <div className="full-page-modal__layout">
          <header className="full-page-modal__topbar member-consent-agreement-modal__topbar">
            <div className="full-page-modal__title member-consent-agreement-modal__title-wrap">
              <span className="full-page-modal__title-text">{modalTitle}</span>
            </div>
            <button
              type="button"
              className="full-page-modal__close"
              onClick={onClose}
              aria-label="닫기"
            >
              <ModalCloseIcon tone="white" />
            </button>
          </header>
          <div className="full-page-modal__body">
            <p className="member-consent-agreement-modal__error">{emptyMessage}</p>
          </div>
        </div>
      </TealHeaderModal>
    )
  }

  return (
    <TemplatePreviewModal
      open={open}
      onClose={onClose}
      headerTitle={modalTitle}
      draft={displayDraft}
      updateParagraph={() => {}}
      editorKind="agreement"
      zIndex={MEMBER_CONSENT_VIEW_MODAL_Z_INDEX}
      previewLayout="a4-document"
      a4RenderMode={agreementConfig?.a4RenderMode ?? 'contentOnly'}
      a4HiddenParagraphIds={agreementConfig?.a4HiddenParagraphIds}
      a4PageBreakBeforeParagraphIds={agreementConfig?.a4PageBreakBeforeParagraphIds}
      a4ParagraphGapPx={agreementConfig?.a4ParagraphGapPx}
      paragraphBodyOptions={paragraphBodyOptions}
      agreementClosingFooter={
        agreementConfig?.agreementClosingFooter ?? {
          showSubmitButton: false,
          showRecipient: false,
        }
      }
      hideParagraphRequiredChrome
      showDocumentDownload={
        templateId === 'agreement-notice' ? canDownloadFile && !isSyntheticPreview : true
      }
      onDocumentDownloadClick={
        templateId === 'agreement-notice' && canDownloadFile && !isSyntheticPreview
          ? onDownloadFile
          : undefined
      }
      // 제출본 보기는 미리보기가 아니므로 배지·안내 문구를 숨긴다(동의만 한 경우 합성 미리보기만 노출)
      showPreviewChrome={isSyntheticPreview}
    />
  )
}

/** 파일 문서 다운로드 안내 종류 — 파일 암호 모달의 포함 개인정보 문구에 쓴다 */
function resolveConsentFileDownloadKind(consentType: string | undefined): ProtectedFileDownloadKind {
  switch ((consentType ?? '').trim().toUpperCase()) {
    case 'CRIMINAL_HISTORY_CHECK_CONSENT':
      return 'SEX_OFFENSE_CONSENT'
    case 'ADMINISTRATIVE_INFO_CONSENT':
      return 'ADMINISTRATIVE_INFO_CONSENT'
    case 'PAYMENT_STATEMENT_CONSENT':
    case 'PAYMENT_STATEMENT_PRE_CONSENT':
    case 'RECEIPT_PRE_CONSENT':
      return 'PAYMENT_STATEMENT'
    default:
      return 'HOMEPAGE_PII_ATTACHMENT'
  }
}

/** 다운로드 파일명 — 암호 걸린 PDF, 이미지 원본은 AES ZIP */
function consentFileDownloadName(modalTitle: string, blob: Blob): string {
  const base = modalTitle.trim() || '동의서'
  const type = blob.type.toLowerCase()
  if (type.includes('zip')) return `${base}.zip`
  return `${base}.pdf`
}

export function MemberConsentDocumentViewModal({
  open,
  templateId,
  modalTitle,
  memberId,
  consentType,
  membersRemote = false,
  filledDocumentAvailable,
  formResponseId,
  consentRecordId,
  filledDocumentId,
  filledDocumentRevealEndpoint,
  signedPdfAvailable,
  signedPdfViewEndpoint,
  signedPdfDownloadEndpoint,
  originalAvailable,
  originalViewEndpoint,
  originalDownloadEndpoint,
  documentAgreed,
  memberUser,
  isProgramOwner,
  onClose,
}: MemberConsentDocumentViewModalProps) {
  const mutation = useConsentFilledDocumentMutation()
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const sessionUser = useAuthStore(state => state.user)
  const canDownloadSensitiveFile = canDownloadSensitiveConsentFile({
    roleCode: sessionUser?.roleCode,
    isProgramOwner,
  })
  const [filled, setFilled] = useState<FilledDocumentResponse | null>(null)
  /** 열람한 파일(서명 PDF·업로드 원본) object URL — 닫을 때 해제 */
  const [fileObjectUrl, setFileObjectUrl] = useState<string | null>(null)
  const [fileMimeType, setFileMimeType] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [signatureImageSrc, setSignatureImageSrc] = useState<string | null>(null)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [crimeLoading, setCrimeLoading] = useState(false)
  /** 서명본·작성본 메타 기준 성범죄 원본 파일 존재 여부 — 「문서 다운로드」 활성 조건 */
  const [crimeOriginalAvailable, setCrimeOriginalAvailable] = useState(false)
  const requestedDocumentKeyRef = useRef<string | null>(null)

  /**
   * 회원 상세(Summary) — 서명 PDF 우선, 없으면 업로드 원본. 작성본·서명본 메타는 쓰지 않는다.
   * 프로그램 상세(consent-records)는 이 값을 주지 않으므로 기존 작성본 경로를 쓴다.
   */
  const fileMode = typeof signedPdfAvailable === 'boolean' || typeof originalAvailable === 'boolean'
  const fileSource = useMemo(() => {
    if (signedPdfAvailable === true && signedPdfViewEndpoint?.trim()) {
      return {
        viewEndpoint: signedPdfViewEndpoint.trim(),
        downloadEndpoint: signedPdfDownloadEndpoint?.trim() || null,
      }
    }
    if (originalAvailable === true && originalViewEndpoint?.trim()) {
      return {
        viewEndpoint: originalViewEndpoint.trim(),
        downloadEndpoint: originalDownloadEndpoint?.trim() || null,
      }
    }
    return null
  }, [
    originalAvailable,
    originalDownloadEndpoint,
    originalViewEndpoint,
    signedPdfAvailable,
    signedPdfDownloadEndpoint,
    signedPdfViewEndpoint,
  ])

  const submissionMeta = useMemo(
    () => ({
      consentRecordId,
      filledDocumentAvailable,
      formResponseId,
      filledDocumentId,
      filledDocumentRevealEndpoint,
    }),
    [
      consentRecordId,
      filledDocumentAvailable,
      filledDocumentId,
      filledDocumentRevealEndpoint,
      formResponseId,
    ]
  )
  /** 작성본 열람 가능 — BE `filledDocumentAvailable` (프로그램 상세 경로) */
  const filledReady =
    !fileMode && shouldAttemptSubmittedConsentDocumentFetch(submissionMeta, { documentAgreed })
  const isCrime = templateId === AGREEMENT_CRIME_TEMPLATE_CODE
  const requiresPrivacyReveal = memberConsentViewRequiresPrivacyReveal(templateId)
  const canFetchFile = Boolean(fileMode && fileSource != null && membersRemote && open)
  const canFetchRemote = Boolean(
    filledReady && !isCrime && membersRemote && open && memberId != null && consentType?.trim()
  )
  const canFetchCrimeOriginal = Boolean(
    isCrime &&
    filledReady &&
    membersRemote &&
    open &&
    memberId != null &&
    Boolean(consentType?.trim())
  )

  const loadFile = useCallback(
    (reason: string) => {
      if (fileSource == null) return
      const requestKey = `file:${fileSource.viewEndpoint}:${reason}`
      if (requestedDocumentKeyRef.current === requestKey) return
      requestedDocumentKeyRef.current = requestKey
      setFileLoading(true)
      setLoadFailed(false)
      setFileMimeType(null)
      setFileObjectUrl(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      void fetchConsentDocumentViewBlobRemote(fileSource.viewEndpoint, { reason })
        .then(blob => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          setFileMimeType(blob.type || null)
          setFileObjectUrl(current => {
            if (current) URL.revokeObjectURL(current)
            return URL.createObjectURL(blob)
          })
        })
        .catch(error => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          setLoadFailed(true)
          handleError(error, {
            defaultMessage: getMemberApiErrorMessage(error, SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE),
          })
        })
        .finally(() => {
          if (requestedDocumentKeyRef.current === requestKey) setFileLoading(false)
        })
    },
    [fileSource]
  )
  const loadFileRef = useRef(loadFile)
  loadFileRef.current = loadFile

  const loadFilledDocument = useCallback(
    (reason: string) => {
      if (memberId == null || !consentType?.trim()) return
      const requestKey = `filled:${memberId}:${consentType.trim()}:${consentRecordId ?? 'current'}:${reason}`
      if (requestedDocumentKeyRef.current === requestKey) return
      requestedDocumentKeyRef.current = requestKey
      setFilled(null)
      setSignatureImageSrc(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setLoadFailed(false)
      void mutation
        .mutateAsync({
          memberId,
          consentType: consentType.trim(),
          consentRecordId,
          reason,
          filledDocumentRevealEndpoint,
        })
        .then(async response => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          setFilled(response)
          if (!isCrime) {
            try {
              const blob = await loadConsentSignedSignatureBlobRemote({
                memberId,
                consentType: consentType.trim(),
                reason,
                consentRecordId,
              })
              if (requestedDocumentKeyRef.current !== requestKey) return
              if (blob == null || blob.size < 1) return
              setSignatureImageSrc(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(blob)
              })
            } catch {
              /* 서명 이미지는 선택 — filled 본문 보기를 막지 않음 */
            }
            return
          }
          /**
           * 성범죄 첨부 원본은 BE 정책상 파일 암호가 필요하고 암호화 파일로만 내려온다.
           * 열람 단계에서는 원본을 받지 않고, 「문서 다운로드」(파일 암호 입력)에서만 받는다.
           */
          const hasOriginal = response.evidenceFileObjectId != null
          setCrimeOriginalAvailable(hasOriginal)
          if (!hasOriginal) setLoadFailed(true)
        })
        .catch(error => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          setLoadFailed(true)
          handleError(error, {
            defaultMessage: getMemberApiErrorMessage(error, SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE),
          })
        })
    },
    [consentRecordId, consentType, filledDocumentRevealEndpoint, isCrime, memberId, mutation]
  )
  const loadFilledDocumentRef = useRef(loadFilledDocument)
  loadFilledDocumentRef.current = loadFilledDocument

  const loadCrimeOriginal = useCallback(
    (reason: string) => {
      if (memberId == null || !consentType?.trim()) return
      const requestKey = `crime:${memberId}:${consentType.trim()}:${consentRecordId ?? 'current'}:${reason}`
      if (requestedDocumentKeyRef.current === requestKey) return
      requestedDocumentKeyRef.current = requestKey
      setCrimeLoading(true)
      setLoadFailed(false)
      setCrimeOriginalAvailable(false)
      void fetchConsentSignedDocumentRemote(memberId, consentType.trim(), { reason }, consentRecordId)
        .then(signed => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          /**
           * 서명본 메타만 조회한다. 원본 파일(sensitive-downloads)은 BE 정책상 파일 암호가 필수이고
           * 암호화 PDF/ZIP으로만 내려오므로, 「문서 다운로드」(파일 암호 입력)에서만 받는다.
           */
          const hasOriginal = signed.originalFileObjectId != null
          setCrimeOriginalAvailable(hasOriginal)
          if (!hasOriginal) setLoadFailed(true)
        })
        .catch(error => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          setLoadFailed(true)
          handleError(error, {
            defaultMessage: getMemberApiErrorMessage(error, SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE),
          })
        })
        .finally(() => {
          if (requestedDocumentKeyRef.current === requestKey) setCrimeLoading(false)
        })
    },
    [consentRecordId, consentType, memberId]
  )
  const loadCrimeOriginalRef = useRef(loadCrimeOriginal)
  loadCrimeOriginalRef.current = loadCrimeOriginal

  useEffect(() => {
    if (!open) {
      setFilled(null)
      setLoadFailed(false)
      setReasonOpen(false)
      setCrimeLoading(false)
      setFileLoading(false)
      setCrimeOriginalAvailable(false)
      setFileMimeType(null)
      setFileObjectUrl(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setSignatureImageSrc(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      requestedDocumentKeyRef.current = null
      mutation.reset()
      return
    }
    const load = canFetchFile
      ? loadFileRef
      : canFetchCrimeOriginal
        ? loadCrimeOriginalRef
        : canFetchRemote
          ? loadFilledDocumentRef
          : null
    if (load != null) {
      if (requiresPrivacyReveal) {
        setReasonOpen(true)
        return
      }
      setReasonOpen(false)
      load.current(MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON)
      return
    }
    /**
     * 열 수 있는 문서가 없음 — 조회하지 않는다.
     * 회원 기본정보로 채운 미리보기는 실제 제출 문서로 오인될 수 있어 쓰지 않는다(기획 결정 2-1).
     */
    if (fileMode || isCrime) setLoadFailed(true)
    // mutation.reset 의도적으로 deps 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation identity
  }, [
    open,
    canFetchFile,
    canFetchRemote,
    canFetchCrimeOriginal,
    fileMode,
    requiresPrivacyReveal,
    isCrime,
    memberId,
    consentRecordId,
    consentType,
  ])

  useEffect(() => {
    return () => {
      if (fileObjectUrl) URL.revokeObjectURL(fileObjectUrl)
    }
  }, [fileObjectUrl])

  useEffect(() => {
    return () => {
      if (signatureImageSrc) URL.revokeObjectURL(signatureImageSrc)
    }
  }, [signatureImageSrc])

  const handleClose = useCallback(() => {
    if (fileObjectUrl) {
      URL.revokeObjectURL(fileObjectUrl)
      setFileObjectUrl(null)
    }
    if (signatureImageSrc) {
      URL.revokeObjectURL(signatureImageSrc)
      setSignatureImageSrc(null)
    }
    setFileMimeType(null)
    setFilled(null)
    setLoadFailed(false)
    setReasonOpen(false)
    setCrimeLoading(false)
    setFileLoading(false)
    setCrimeOriginalAvailable(false)
    mutation.reset()
    requestedDocumentKeyRef.current = null
    onClose()
  }, [fileObjectUrl, mutation, onClose, signatureImageSrc])

  const handleRevealConfirm = useCallback(
    (reason: string) => {
      setReasonOpen(false)
      if (canFetchFile) {
        loadFile(reason)
        return
      }
      if (isCrime) {
        loadCrimeOriginal(reason)
        return
      }
      loadFilledDocument(reason)
    },
    [canFetchFile, isCrime, loadCrimeOriginal, loadFile, loadFilledDocument]
  )

  /** 회원 상세 — `*DownloadEndpoint`(sensitive-downloads) + 사유 + 파일 암호 */
  const handleFileProtectedDownload = useCallback(() => {
    const downloadEndpoint = fileSource?.downloadEndpoint
    if (!canDownloadSensitiveFile || !downloadEndpoint) return
    runProtectedDownload({
      kind: resolveConsentFileDownloadKind(consentType),
      zIndex: REVEAL_REASON_MODAL_Z_INDEX + 20,
      download: async password => {
        try {
          const blob = await fetchConsentDocumentDownloadBlobRemote({
            downloadEndpoint,
            reason: MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON,
            password,
          })
          await downloadBlob(blob, consentFileDownloadName(modalTitle, blob))
        } catch (error) {
          showAlert({
            title: '안내',
            content: getMemberApiErrorMessage(error, NO_SUBMITTED_CONSENT_MESSAGE),
          })
          throw error
        }
      },
    })
  }, [
    canDownloadSensitiveFile,
    consentType,
    fileSource?.downloadEndpoint,
    modalTitle,
    runProtectedDownload,
    showAlert,
  ])

  const handleCrimeProtectedDownload = useCallback(() => {
    if (!canDownloadSensitiveFile || memberId == null || !consentType?.trim()) return
    const filename = filled?.evidenceOriginalFileName?.trim() || DEFAULT_CRIME_DOWNLOAD_FILENAME
    runProtectedDownload({
      kind: 'SEX_OFFENSE_CONSENT',
      zIndex: REVEAL_REASON_MODAL_Z_INDEX + 20,
      download: async password => {
        try {
          const blob = await fetchConsentCrimeOriginalBlobRemote({
            memberId,
            consentType: consentType.trim(),
            reason: MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON,
            consentRecordId,
            filled,
            password,
          })
          if (blob == null || blob.size < 1) {
            throw new Error(CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE)
          }
          await downloadBlob(blob, filename)
        } catch (error) {
          showAlert({
            title: '안내',
            content: getMemberApiErrorMessage(error, CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE),
          })
          throw error
        }
      },
    })
  }, [
    canDownloadSensitiveFile,
    consentRecordId,
    consentType,
    filled,
    memberId,
    runProtectedDownload,
    showAlert,
  ])

  const handleNoticeProtectedDownload = useCallback(() => {
    if (!canDownloadSensitiveFile || filled == null) return
    const filename =
      filled.evidenceOriginalFileName?.trim() ||
      `${modalTitle.trim() || '행정정보_공동이용_동의서'}.pdf`
    runProtectedDownload({
      kind: 'ADMINISTRATIVE_INFO_CONSENT',
      zIndex: REVEAL_REASON_MODAL_Z_INDEX + 20,
      download: async password => {
        try {
          const blob = await fetchConsentEvidenceBlobRemote(
            filled,
            MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON,
            password
          )
          if (blob == null || blob.size < 1) {
            throw new Error(NO_SUBMITTED_CONSENT_MESSAGE)
          }
          await downloadBlob(blob, filename)
        } catch (error) {
          showAlert({
            title: '안내',
            content: getMemberApiErrorMessage(error, NO_SUBMITTED_CONSENT_MESSAGE),
          })
          throw error
        }
      },
    })
  }, [canDownloadSensitiveFile, filled, modalTitle, runProtectedDownload, showAlert])

  const reasonModal = reasonOpen ? (
    <UserPersonalInfoRevealConfirmModal
      onCancel={handleClose}
      onConfirm={handleRevealConfirm}
      zIndex={REVEAL_REASON_MODAL_Z_INDEX}
    />
  ) : null

  if (fileMode) {
    return (
      <>
        {filePasswordModal}
        <MemberConsentFileDocumentView
          open={open}
          modalTitle={modalTitle}
          objectUrl={fileObjectUrl}
          mimeType={fileMimeType}
          fileName={modalTitle}
          isLoading={canFetchFile && (reasonOpen || fileLoading)}
          loadFailed={loadFailed}
          emptyMessage={isCrime ? CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE : NO_SUBMITTED_CONSENT_MESSAGE}
          canDownloadFile={canDownloadSensitiveFile}
          downloadAvailable={fileSource?.downloadEndpoint != null}
          paintAnnotationOverlays={consentFileViewPaintsPdfAnnotations({
            signedPdfAvailable,
            signedPdfViewEndpoint,
            viewEndpoint: fileSource?.viewEndpoint,
          })}
          onDownloadFile={handleFileProtectedDownload}
          onClose={handleClose}
        />
        {reasonModal}
      </>
    )
  }

  const remoteRequestPending = mutation.isPending && filled == null && !loadFailed
  /** 성범죄 — 서명본 원본 조회, 또는 서명본 불가 시 작성본 첨부 조회 */
  const crimeRequestPending = crimeLoading || mutation.isPending
  const isLoading = canFetchCrimeOriginal
    ? requiresPrivacyReveal
      ? reasonOpen || crimeRequestPending
      : crimeRequestPending
    : canFetchRemote
      ? requiresPrivacyReveal
        ? reasonOpen || remoteRequestPending
        : remoteRequestPending
      : false
  const remoteUnavailable = canFetchCrimeOriginal
    ? requiresPrivacyReveal &&
      !reasonOpen &&
      !crimeRequestPending &&
      !crimeOriginalAvailable &&
      !loadFailed
    : canFetchRemote &&
      requiresPrivacyReveal &&
      !reasonOpen &&
      !mutation.isPending &&
      filled == null

  if (isCrime) {
    return (
      <>
        {filePasswordModal}
        <MemberConsentFileDocumentView
          open={open}
          modalTitle={modalTitle}
          objectUrl={null}
          mimeType={null}
          fileName={filled?.evidenceOriginalFileName?.trim() || DEFAULT_CRIME_DOWNLOAD_FILENAME}
          isLoading={isLoading}
          loadFailed={loadFailed || remoteUnavailable}
          emptyMessage={CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE}
          canDownloadFile={canDownloadSensitiveFile}
          downloadAvailable={crimeOriginalAvailable}
          onDownloadFile={handleCrimeProtectedDownload}
          onClose={handleClose}
        />
        {reasonModal}
      </>
    )
  }

  return (
    <>
      {filePasswordModal}
      <MemberConsentAgreementDocumentView
        open={open}
        templateId={templateId}
        modalTitle={modalTitle}
        filled={filled}
        synthetic={null}
        isSyntheticPreview={false}
        isLoading={isLoading}
        loadFailed={loadFailed || remoteUnavailable}
        memberUser={memberUser}
        signatureImageSrc={signatureImageSrc}
        canDownloadFile={canDownloadSensitiveFile}
        onDownloadFile={handleNoticeProtectedDownload}
        onClose={handleClose}
      />
      {reasonModal}
    </>
  )
}
