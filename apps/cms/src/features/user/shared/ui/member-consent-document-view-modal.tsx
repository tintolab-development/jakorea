import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  parseAgreementCrimeConsentSettings,
} from '@/features/template/lib/agreement-crime-consent-settings'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import {
  ensureAgreementNoticeConfirmationClosing,
  normalizeWritingFormDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { resolveAgreementWritingFormConfig } from '@/features/template/model/template-registry/agreement-template-config-registry'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import { useConsentFilledDocumentMutation } from '@/features/user/api/hooks/use-consent-filled-document-mutation'
import {
  fetchConsentEvidenceBlobRemote,
} from '@/features/user/api/members-api-client'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { UserPersonalInfoRevealConfirmModal } from '@/features/user/detail/ui/modal/user-personal-info-reveal-confirm-modal'
import type { FilledDocumentResponse } from '@/shared/api/generated/members/schemas/filledDocumentResponse'
import type { PaymentStatementBasicInfo } from '@/shared/api/generated/members/schemas/paymentStatementBasicInfo'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { downloadBlob } from '@/shared/utils/file-download'
import { handleError } from '@/shared/utils/error-handler'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal.css'
import './member-consent-agreement-modal.css'
import './member-consent-document-view-modal.css'

const MEMBER_CONSENT_VIEW_MODAL_Z_INDEX = 1200
const REVEAL_REASON_MODAL_Z_INDEX = 1300
const DEFAULT_CRIME_DOWNLOAD_FILENAME = '성범죄_경력조회_동의서.png'
const NO_SUBMITTED_CONSENT_MESSAGE = '제출된 동의서를 불러올 수 없습니다.'
const SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE =
  '제출된 동의서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

export interface MemberConsentDocumentViewModalProps {
  open: boolean
  templateId: string
  modalTitle: string
  memberId?: number
  consentType?: string
  membersRemote?: boolean
  onClose: () => void
}

function filledSchemaToDraft(schemaJson: unknown): WritingFormDraft | null {
  if (schemaJson == null || typeof schemaJson !== 'object') return null
  try {
    return normalizeWritingFormDraft(schemaJson as WritingFormDraft)
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
    paymentPurpose: info.paymentPurpose ?? '',
  }
}

function MemberConsentCrimeDocumentView({
  open,
  modalTitle,
  membersRemote,
  filled,
  evidenceObjectUrl,
  isLoading,
  loadFailed,
  onClose,
}: {
  open: boolean
  modalTitle: string
  membersRemote?: boolean
  filled: FilledDocumentResponse | null
  evidenceObjectUrl: string | null
  isLoading: boolean
  loadFailed: boolean
  onClose: () => void
}) {
  const [templateSrc, setTemplateSrc] = useState<string>(crimeConsentDefaultImage)

  useEffect(() => {
    if (!open || membersRemote) return
    let cancelled = false
    void loadWritingFormTemplateDraft(AGREEMENT_CRIME_TEMPLATE_CODE).then(saved => {
      if (cancelled) return
      const settings = parseAgreementCrimeConsentSettings(saved?.settingsJson)
      setTemplateSrc(settings.documentImageUrl ?? crimeConsentDefaultImage)
    })
    return () => {
      cancelled = true
    }
  }, [open, membersRemote])

  const displaySrc = membersRemote
    ? evidenceObjectUrl
    : templateSrc
  const showEmpty = membersRemote && !isLoading && (loadFailed || displaySrc == null)
  const filename =
    filled?.evidenceOriginalFileName?.trim() || DEFAULT_CRIME_DOWNLOAD_FILENAME

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
  isLoading,
  loadFailed,
  onClose,
}: {
  open: boolean
  templateId: string
  modalTitle: string
  filled: FilledDocumentResponse | null
  isLoading: boolean
  loadFailed: boolean
  onClose: () => void
}) {
  const agreementConfig = useMemo(() => resolveAgreementWritingFormConfig(templateId), [templateId])
  const submittedDraft = useMemo(
    () => filledSchemaToDraft(filled?.schemaJson),
    [filled?.schemaJson]
  )
  const paymentValues = useMemo(
    () => paymentInfoToAutofill(filled?.paymentBasicInfo),
    [filled?.paymentBasicInfo]
  )

  const paragraphBodyOptions = useMemo(() => {
    const base = agreementConfig?.paragraphBodyOptions
    return {
      ...(base ?? {}),
      paragraphInteractionMode: 'preview' as const,
      ...(paymentValues != null ? { paymentStatementBasicInfoValues: paymentValues } : {}),
    }
  }, [agreementConfig?.paragraphBodyOptions, paymentValues])

  const displayDraft = useMemo((): WritingFormDraft | null => {
    if (submittedDraft == null) return null
    let next = submittedDraft
    if (templateId === 'agreement-notice') {
      next = ensureAgreementNoticeConfirmationClosing(next)
      next = overlayAgreementNoticeSeedHorizontalTable(next)
    }
    return next
  }, [submittedDraft, templateId])

  const showEmpty = !isLoading && (loadFailed || displayDraft == null)
  const emptyMessage = loadFailed
    ? SUBMITTED_CONSENT_LOAD_FAILED_MESSAGE
    : NO_SUBMITTED_CONSENT_MESSAGE

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
          <div className="full-page-modal__body-header member-consent-agreement-modal__body-header member-consent-document-view-modal__body-header">
            <div className="full-page-modal__actions member-consent-agreement-modal__actions">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
            </div>
          </div>

          <div className="member-consent-agreement-modal__workspace">
            {isLoading ? (
              <div className="member-consent-agreement-modal__loading">
                <Spin tip="동의서를 불러오는 중입니다." />
              </div>
            ) : showEmpty ? (
              <p className="member-consent-agreement-modal__error">{emptyMessage}</p>
            ) : displayDraft != null ? (
              <div className="member-consent-agreement-modal__form-panel form-editor-left--paragraph-body-preview">
                <FormEditorLeftPanel
                  paragraphs={displayDraft.paragraphs}
                  titleNumbering={displayDraft.formSettings.titleNumbering}
                  selectedCardId={null}
                  onSelectCard={() => {}}
                  onReorderMiddle={() => {}}
                  updateParagraph={() => {}}
                  editorKind="agreement"
                  singleItemListActiveItemId={null}
                  paragraphInteractionMode="preview"
                  showEditorChrome={false}
                  structureLockedParagraphIds={agreementConfig?.structureLockedParagraphIds}
                  hideDragHandleForParagraphIds={agreementConfig?.hideDragHandleForParagraphIds}
                  hideParagraphRequiredChrome
                  paragraphBodyOptions={paragraphBodyOptions}
                />
              </div>
            ) : (
              <p className="member-consent-agreement-modal__error">{emptyMessage}</p>
            )}
          </div>
          <div className="full-page-modal__body-bottom" aria-hidden="true" />
        </div>
      </div>
    </TealHeaderModal>
  )
}

export function MemberConsentDocumentViewModal({
  open,
  templateId,
  modalTitle,
  memberId,
  consentType,
  membersRemote = false,
  onClose,
}: MemberConsentDocumentViewModalProps) {
  const mutation = useConsentFilledDocumentMutation()
  const [filled, setFilled] = useState<FilledDocumentResponse | null>(null)
  const [evidenceObjectUrl, setEvidenceObjectUrl] = useState<string | null>(null)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const canFetchRemote =
    Boolean(membersRemote && open && memberId != null && consentType?.trim())
  const isCrime = templateId === AGREEMENT_CRIME_TEMPLATE_CODE

  useEffect(() => {
    if (!open) {
      setFilled(null)
      setLoadFailed(false)
      setReasonOpen(false)
      mutation.reset()
      return
    }
    if (canFetchRemote) {
      setReasonOpen(true)
    }
    // open 시에만 사유 모달을 연다. mutation은 닫을 때 reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutation identity
  }, [open, canFetchRemote])

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
    mutation.reset()
    onClose()
  }, [evidenceObjectUrl, mutation, onClose])

  const handleRevealConfirm = useCallback(
    (reason: string) => {
      if (memberId == null || !consentType?.trim()) return
      setReasonOpen(false)
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

  const isLoading = canFetchRemote && (reasonOpen || mutation.isPending)
  const remoteUnavailable = canFetchRemote && !reasonOpen && !mutation.isPending && filled == null

  if (isCrime) {
    return (
      <>
        <MemberConsentCrimeDocumentView
          open={open}
          modalTitle={modalTitle}
          membersRemote={membersRemote}
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
