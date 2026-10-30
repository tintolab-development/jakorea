import { ModalCloseIcon } from '@/shared/ui/icons'
import { Spin } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveAgreementA4DocumentHiddenParagraphIds } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { AGREEMENT_CRIME_TEMPLATE_CODE } from '@/features/template/lib/agreement-crime-consent-settings'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
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
  loadConsentSignedSignatureBlobRemote,
} from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal'
import {
  buildMemberConsentAgreeOnlyPreviewDraft,
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
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal.css'
import '@/features/template/ui/modal/template-preview-modal.css'
import './member-consent-agreement-modal.css'
import './member-consent-document-view-modal.css'

const MEMBER_CONSENT_VIEW_MODAL_Z_INDEX = 1200
const REVEAL_REASON_MODAL_Z_INDEX = 1300
const DEFAULT_CRIME_DOWNLOAD_FILENAME = '성범죄_경력조회_동의서.png'
const NO_SUBMITTED_CONSENT_MESSAGE = '제출된 동의서를 불러올 수 없습니다.'
const CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE =
  '서버에는 동의 당시 스냅샷이 보관되어 있지만 이 화면에서는 업로드 원본을 제공하지 않습니다. 원본 열람 방식은 별도 확인이 필요합니다.'
const SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE =
  '제출된 동의서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
const SYNTHETIC_PREVIEW_NOTICE = '현재 화면은 미리보기 화면입니다.'

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
  /** consent-records 메타 없을 때 filled-document API 시도 여부 */
  documentAgreed?: boolean
  /** 동의-only 미리보기 PII 주입용 */
  memberUser?: Omit<User, 'password'>
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

function MemberConsentCrimeDocumentView({
  open,
  modalTitle,
  useSubmittedRemote,
  isSyntheticPreview,
  filled,
  evidenceObjectUrl,
  evidenceMimeType,
  isLoading,
  loadFailed,
  onClose,
}: {
  open: boolean
  modalTitle: string
  useSubmittedRemote: boolean
  isSyntheticPreview: boolean
  filled: FilledDocumentResponse | null
  evidenceObjectUrl: string | null
  evidenceMimeType: string | null
  isLoading: boolean
  loadFailed: boolean
  onClose: () => void
}) {
  const displaySrc = useSubmittedRemote ? evidenceObjectUrl : null
  const showEmpty = !isLoading && (loadFailed || displaySrc == null)
  const filename = filled?.evidenceOriginalFileName?.trim() || DEFAULT_CRIME_DOWNLOAD_FILENAME

  const handleDownload = useCallback(async () => {
    if (!displaySrc) return
    try {
      const res = await fetch(displaySrc)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      await downloadBlob(blob, filename)
    } catch (error) {
      console.debug('memberConsentCrimeView download failed', error)
    }
  }, [displaySrc, filename])

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
            {isSyntheticPreview ? (
              <span className="template-preview-modal__badge">미리보기</span>
            ) : null}
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
          {isSyntheticPreview ? (
            <div className="member-consent-document-view-modal__notice-wrap">
              <div className="member-consent-document-view-modal__notice">
                <span className="template-preview-modal__notice-text">
                  {SYNTHETIC_PREVIEW_NOTICE}
                </span>
                <CmsButton variant="secondary" size="medium" width={120} onClick={onClose}>
                  닫기
                </CmsButton>
              </div>
            </div>
          ) : (
            <div className="crime-consent-doc-modal__toolbar member-consent-document-view-modal__toolbar">
              <div className="crime-consent-doc-modal__actions member-consent-document-view-modal__actions">
                <CmsButton variant="secondary" size="medium" onClick={onClose}>
                  닫기
                </CmsButton>
                <CmsButton
                  variant="secondary"
                  icon={<ButtonDownloadIcon />}
                  onClick={() => void handleDownload()}
                  size="medium"
                  disabled={!displaySrc}
                >
                  문서 다운로드
                </CmsButton>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="member-consent-agreement-modal__loading">
              <Spin tip="동의서를 불러오는 중입니다." />
            </div>
          ) : showEmpty ? (
            <p className="member-consent-agreement-modal__error">
              {CRIME_SNAPSHOT_UNAVAILABLE_MESSAGE}
            </p>
          ) : displaySrc != null ? (
            <div className="crime-consent-doc-modal__a4-outer">
              <CrimeConsentDocumentPreview
                src={displaySrc}
                fileName={filename}
                mimeType={useSubmittedRemote ? evidenceMimeType : undefined}
                alt={modalTitle}
              />
            </div>
          ) : (
            <p className="member-consent-agreement-modal__error">{NO_SUBMITTED_CONSENT_MESSAGE}</p>
          )}
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
      hiddenParagraphIds: resolveAgreementA4DocumentHiddenParagraphIds(withCommon.hiddenParagraphIds),
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
        <div className="member-consent-agreement-modal__loading">
          <Spin tip="동의서를 불러오는 중입니다." />
        </div>
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
    />
  )
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
  documentAgreed,
  memberUser,
  onClose,
}: MemberConsentDocumentViewModalProps) {
  const mutation = useConsentFilledDocumentMutation()
  const [filled, setFilled] = useState<FilledDocumentResponse | null>(null)
  const [evidenceObjectUrl, setEvidenceObjectUrl] = useState<string | null>(null)
  const [evidenceMimeType, setEvidenceMimeType] = useState<string | null>(null)
  const [signatureImageSrc, setSignatureImageSrc] = useState<string | null>(null)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [synthetic, setSynthetic] = useState<MemberConsentAgreeOnlyPreviewResult | null>(null)
  const [syntheticLoading, setSyntheticLoading] = useState(false)
  const requestedDocumentKeyRef = useRef<string | null>(null)

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
  const useSubmittedPath = shouldAttemptSubmittedConsentDocumentFetch(submissionMeta, {
    documentAgreed,
  })
  const isSyntheticPreview = !useSubmittedPath
  const isCrime = templateId === AGREEMENT_CRIME_TEMPLATE_CODE
  const requiresPrivacyReveal = memberConsentViewRequiresPrivacyReveal(templateId)
  const canFetchRemote = Boolean(
    useSubmittedPath && !isCrime && membersRemote && open && memberId != null && consentType?.trim()
  )

  const loadFilledDocument = useCallback(
    (reason: string) => {
      if (memberId == null || !consentType?.trim()) return
      const requestKey = `${memberId}:${consentType.trim()}:${consentRecordId ?? 'current'}:${reason}`
      if (requestedDocumentKeyRef.current === requestKey) return
      requestedDocumentKeyRef.current = requestKey
      setFilled(null)
      setEvidenceMimeType(null)
      setEvidenceObjectUrl(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setSignatureImageSrc(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setLoadFailed(false)
      void mutation
        .mutateAsync({ memberId, consentType: consentType.trim(), consentRecordId, reason })
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
          try {
            const blob = await fetchConsentCrimeOriginalBlobRemote({
              memberId,
              consentType: consentType.trim(),
              reason,
              consentRecordId,
              filled: response,
            })
            if (blob == null || blob.size < 1) {
              setLoadFailed(true)
              return
            }
            setEvidenceMimeType(blob.type.trim() || null)
            setEvidenceObjectUrl(prev => {
              if (prev) URL.revokeObjectURL(prev)
              return URL.createObjectURL(blob)
            })
          } catch (error) {
            if (requestedDocumentKeyRef.current !== requestKey) return
            setLoadFailed(true)
            handleError(error, {
              defaultMessage: getMemberApiErrorMessage(
                error,
                SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE
              ),
            })
          }
        })
        .catch(error => {
          if (requestedDocumentKeyRef.current !== requestKey) return
          setLoadFailed(true)
          handleError(error, {
            defaultMessage: getMemberApiErrorMessage(error, SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE),
          })
        })
    },
    [consentRecordId, consentType, isCrime, memberId, mutation]
  )
  const loadFilledDocumentRef = useRef(loadFilledDocument)
  loadFilledDocumentRef.current = loadFilledDocument

  useEffect(() => {
    if (!open) {
      setFilled(null)
      setLoadFailed(false)
      setReasonOpen(false)
      setSynthetic(null)
      setSyntheticLoading(false)
      setEvidenceMimeType(null)
      setSignatureImageSrc(current => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      requestedDocumentKeyRef.current = null
      mutation.reset()
      return
    }
    if (canFetchRemote) {
      if (requiresPrivacyReveal) {
        setReasonOpen(true)
        return
      }
      setReasonOpen(false)
      loadFilledDocumentRef.current(MEMBER_CONSENT_VIEW_AUTO_PRIVACY_REASON)
      return
    }
    if (!isSyntheticPreview || isCrime || memberUser == null) {
      setSynthetic(null)
      setSyntheticLoading(false)
      if (isCrime) setLoadFailed(true)
      return
    }

    let cancelled = false
    setSyntheticLoading(true)
    void loadWritingFormTemplateDraft(templateId)
      .then(saved => {
        if (cancelled) return
        const built = buildMemberConsentAgreeOnlyPreviewDraft(
          templateId,
          memberUser,
          saved?.draft ?? null
        )
        setSynthetic(built)
      })
      .catch(() => {
        if (cancelled) return
        setSynthetic(buildMemberConsentAgreeOnlyPreviewDraft(templateId, memberUser, null))
      })
      .finally(() => {
        if (!cancelled) setSyntheticLoading(false)
      })

    return () => {
      cancelled = true
    }
    // mutation.reset 의도적으로 deps 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation identity
  }, [
    open,
    canFetchRemote,
    requiresPrivacyReveal,
    isSyntheticPreview,
    isCrime,
    templateId,
    memberUser,
    memberId,
    consentRecordId,
    consentType,
  ])

  useEffect(() => {
    return () => {
      if (evidenceObjectUrl) URL.revokeObjectURL(evidenceObjectUrl)
    }
  }, [evidenceObjectUrl])

  useEffect(() => {
    return () => {
      if (signatureImageSrc) URL.revokeObjectURL(signatureImageSrc)
    }
  }, [signatureImageSrc])

  const handleClose = useCallback(() => {
    if (evidenceObjectUrl) {
      URL.revokeObjectURL(evidenceObjectUrl)
      setEvidenceObjectUrl(null)
    }
    if (signatureImageSrc) {
      URL.revokeObjectURL(signatureImageSrc)
      setSignatureImageSrc(null)
    }
    setEvidenceMimeType(null)
    setFilled(null)
    setLoadFailed(false)
    setReasonOpen(false)
    setSynthetic(null)
    setSyntheticLoading(false)
    mutation.reset()
    requestedDocumentKeyRef.current = null
    onClose()
  }, [evidenceObjectUrl, mutation, onClose, signatureImageSrc])

  const handleRevealConfirm = useCallback(
    (reason: string) => {
      setReasonOpen(false)
      loadFilledDocument(reason)
    },
    [loadFilledDocument]
  )

  const remoteRequestPending = mutation.isPending && filled == null && !loadFailed
  const isLoading = canFetchRemote
    ? requiresPrivacyReveal
      ? reasonOpen || remoteRequestPending
      : remoteRequestPending
    : isSyntheticPreview && !isCrime
      ? syntheticLoading
      : false
  const remoteUnavailable =
    canFetchRemote && requiresPrivacyReveal && !reasonOpen && !mutation.isPending && filled == null

  if (isCrime) {
    return (
      <>
        <MemberConsentCrimeDocumentView
          open={open}
          modalTitle={modalTitle}
          useSubmittedRemote={canFetchRemote}
          isSyntheticPreview={false}
          filled={filled}
          evidenceObjectUrl={evidenceObjectUrl}
          evidenceMimeType={evidenceMimeType}
          isLoading={isLoading}
          loadFailed={loadFailed || remoteUnavailable}
          onClose={handleClose}
        />
        {reasonOpen ? (
          <UserPersonalInfoRevealConfirmModal
            onCancel={handleClose}
            onConfirm={handleRevealConfirm}
            zIndex={REVEAL_REASON_MODAL_Z_INDEX}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <MemberConsentAgreementDocumentView
        open={open}
        templateId={templateId}
        modalTitle={modalTitle}
        filled={filled}
        synthetic={synthetic}
        isSyntheticPreview={isSyntheticPreview}
        isLoading={isLoading}
        loadFailed={
          isSyntheticPreview
            ? !syntheticLoading && synthetic == null
            : loadFailed || remoteUnavailable
        }
        memberUser={memberUser}
        signatureImageSrc={signatureImageSrc}
        onClose={handleClose}
      />
      {reasonOpen ? (
        <UserPersonalInfoRevealConfirmModal
          onCancel={handleClose}
          onConfirm={handleRevealConfirm}
          zIndex={REVEAL_REASON_MODAL_Z_INDEX}
        />
      ) : null}
    </>
  )
}
