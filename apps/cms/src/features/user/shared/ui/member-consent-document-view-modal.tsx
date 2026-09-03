import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  parseAgreementCrimeConsentSettings,
} from '@/features/template/lib/agreement-crime-consent-settings'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import {
  ensureAgreementNoticeConfirmationClosing,
  normalizeNoticeIdTypeResidentInputInDraft,
  normalizeWritingFormDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import { TemplatePreviewModal } from '@/features/template/ui/modal/template-preview-modal'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import { useConsentFilledDocumentMutation } from '@/features/user/api/hooks/use-consent-filled-document-mutation'
import { fetchConsentEvidenceBlobRemote } from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal'
import {
  buildMemberConsentAgreeOnlyPreviewDraft,
  shouldFetchSubmittedConsentDocument,
  type MemberConsentAgreeOnlyPreviewResult,
} from '@/features/user/shared/lib/build-member-consent-agree-only-preview-draft'
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
  /** true면 제출 filled-document 경로. false/undefined면 동의-only 합성 미리보기 */
  filledDocumentAvailable?: boolean
  /** 동의-only 미리보기 PII 주입용 */
  memberUser?: Omit<User, 'password'>
  onClose: () => void
}

function filledSchemaToDraft(schemaJson: unknown): WritingFormDraft | null {
  if (schemaJson == null || typeof schemaJson !== 'object') return null
  try {
    return normalizeNoticeIdTypeResidentInputInDraft(
      normalizeWritingFormDraft(schemaJson as WritingFormDraft)
    )
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
  isLoading: boolean
  loadFailed: boolean
  onClose: () => void
}) {
  const [templateSrc, setTemplateSrc] = useState<string>(crimeConsentDefaultImage)

  useEffect(() => {
    if (!open || useSubmittedRemote) return
    let cancelled = false
    void loadWritingFormTemplateDraft(AGREEMENT_CRIME_TEMPLATE_CODE).then(saved => {
      if (cancelled) return
      const settings = parseAgreementCrimeConsentSettings(saved?.settingsJson)
      setTemplateSrc(settings.documentImageUrl ?? crimeConsentDefaultImage)
    })
    return () => {
      cancelled = true
    }
  }, [open, useSubmittedRemote])

  const displaySrc = useSubmittedRemote ? evidenceObjectUrl : templateSrc
  const showEmpty = useSubmittedRemote && !isLoading && (loadFailed || displaySrc == null)
  const filename = filled?.evidenceOriginalFileName?.trim() || DEFAULT_CRIME_DOWNLOAD_FILENAME

  const handleDownload = useCallback(async () => {
    if (!displaySrc) return
    try {
      const res = await fetch(displaySrc)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      downloadBlob(blob, filename)
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
            <CloseOutlined />
          </button>
        </header>

        <div className="crime-consent-doc-modal__body">
          {isSyntheticPreview ? (
            <div className="member-consent-document-view-modal__notice-wrap">
              <div className="member-consent-document-view-modal__notice">
                <span className="template-preview-modal__notice-text">{SYNTHETIC_PREVIEW_NOTICE}</span>
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
                  icon={<DownloadOutlined />}
                  onClick={() => void handleDownload()}
                  className="crime-consent-doc-modal__download-btn"
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
            <p className="member-consent-agreement-modal__error">{NO_SUBMITTED_CONSENT_MESSAGE}</p>
          ) : displaySrc != null ? (
            <div className="crime-consent-doc-modal__a4-outer">
              <img
                className="crime-consent-doc-modal__a4-img"
                src={displaySrc}
                alt={modalTitle}
                width={1146}
                height={1618}
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
    return {
      ...(base ?? {}),
      paragraphInteractionMode: 'preview' as const,
      paymentStatementDisplayMode: 'document' as const,
      /** A4 보기: 대리작성 카드(shadow) 대신 날짜·서명 플랫 스택 — FormDocumentPreviewBody contentOnly에서도 처리 */
      ...(paymentValues != null ? { paymentStatementBasicInfoValues: paymentValues } : {}),
      ...(participantName != null && participantName !== ''
        ? { agreementSystemParticipantName: participantName }
        : {}),
    }
  }, [agreementConfig?.paragraphBodyOptions, paymentValues, participantName])

  const displayDraft = useMemo((): WritingFormDraft | null => {
    if (isSyntheticPreview) return synthetic?.draft ?? null
    if (submittedDraft == null) return null
    let next = submittedDraft
    if (templateId === 'agreement-notice') {
      next = ensureAgreementNoticeConfirmationClosing(next)
      next = overlayAgreementNoticeSeedHorizontalTable(next)
    }
    return next
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
              <CloseOutlined />
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
  memberUser,
  onClose,
}: MemberConsentDocumentViewModalProps) {
  const mutation = useConsentFilledDocumentMutation()
  const [filled, setFilled] = useState<FilledDocumentResponse | null>(null)
  const [evidenceObjectUrl, setEvidenceObjectUrl] = useState<string | null>(null)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [synthetic, setSynthetic] = useState<MemberConsentAgreeOnlyPreviewResult | null>(null)
  const [syntheticLoading, setSyntheticLoading] = useState(false)

  const useSubmittedPath = shouldFetchSubmittedConsentDocument(filledDocumentAvailable)
  const isSyntheticPreview = !useSubmittedPath
  const isCrime = templateId === AGREEMENT_CRIME_TEMPLATE_CODE
  const requiresPrivacyReveal = memberConsentViewRequiresPrivacyReveal(templateId)
  const canFetchRemote = Boolean(
    useSubmittedPath && membersRemote && open && memberId != null && consentType?.trim()
  )

  const loadFilledDocument = useCallback(
    (reason: string) => {
      if (memberId == null || !consentType?.trim()) return
      setLoadFailed(false)
      void mutation
        .mutateAsync({ memberId, consentType: consentType.trim(), reason })
        .then(async response => {
          setFilled(response)
          if (!isCrime) return
          try {
            const blob = await fetchConsentEvidenceBlobRemote(response, reason)
            if (blob == null || blob.size < 1) {
              setLoadFailed(true)
              return
            }
            setEvidenceObjectUrl(prev => {
              if (prev) URL.revokeObjectURL(prev)
              return URL.createObjectURL(blob)
            })
          } catch (error) {
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
          setLoadFailed(true)
          handleError(error, {
            defaultMessage: getMemberApiErrorMessage(error, SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE),
          })
        })
    },
    [consentType, isCrime, memberId, mutation]
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
  ])

  useEffect(() => {
    return () => {
      if (evidenceObjectUrl) URL.revokeObjectURL(evidenceObjectUrl)
    }
  }, [evidenceObjectUrl])

  const handleClose = useCallback(() => {
    if (evidenceObjectUrl) {
      URL.revokeObjectURL(evidenceObjectUrl)
      setEvidenceObjectUrl(null)
    }
    setFilled(null)
    setLoadFailed(false)
    setReasonOpen(false)
    setSynthetic(null)
    setSyntheticLoading(false)
    mutation.reset()
    onClose()
  }, [evidenceObjectUrl, mutation, onClose])

  const handleRevealConfirm = useCallback(
    (reason: string) => {
      setReasonOpen(false)
      loadFilledDocument(reason)
    },
    [loadFilledDocument]
  )

  const isLoading = canFetchRemote
    ? requiresPrivacyReveal
      ? reasonOpen || mutation.isPending
      : mutation.isPending || (filled == null && !loadFailed)
    : isSyntheticPreview && !isCrime
      ? syntheticLoading
      : false
  const remoteUnavailable =
    canFetchRemote &&
    requiresPrivacyReveal &&
    !reasonOpen &&
    !mutation.isPending &&
    filled == null

  if (isCrime) {
    return (
      <>
        <MemberConsentCrimeDocumentView
          open={open}
          modalTitle={modalTitle}
          useSubmittedRemote={canFetchRemote}
          isSyntheticPreview={isSyntheticPreview}
          filled={filled}
          evidenceObjectUrl={evidenceObjectUrl}
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
