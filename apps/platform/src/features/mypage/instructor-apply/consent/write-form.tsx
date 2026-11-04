import {
  applyAgreementNoticeSubjectMemberName,
  buildPlatformConsentFillOptions,
  createConsentTemplateSeedDraft,
  formatMemberConsentIncompleteRequiredAlertMessage,
  getMemberConsentInvalidNoticeSubjectContactAlertMessage,
  hasMemberConsentIncompleteRequiredFields,
  hasMemberConsentInvalidResidentNumberFormat,
  isCrimeConsentTemplate,
  listMemberConsentIncompleteRequiredFields,
  normalizeMemberConsentWriteDraft,
  PAYMENT_STATEMENT_RESIDENT_NUMBER_INVALID_ALERT_MESSAGE,
  resolveDocumentConsentTemplate,
  resolvePlatformConsentHiddenParagraphIds,
} from '@jakorea/form-schema/consent'
import {
  ensureAgreementNoticeConfirmationClosing,
  ensureAgreementNoticeInstitutionPurposeParagraphs,
  overlayAgreementNoticeSeedHorizontalTable,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/receipt-pre-consent-draft'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import {
  PFAlertModal,
  PFButton,
  PFFormDraftSignatureProvider,
  PFFormDraftSignatureTitleAsideBridge,
  PFFormSignatureBlock,
} from '@/shared/ui'
import {
  clearConsentSignatureSlotKeys,
  isConsentSignaturesComplete,
  resolveConsentSignatureSlots,
} from './resolve-consent-signature-slots'
import {
  createPortalConsentDocument,
  fetchPortalConsentDocumentDetail,
} from '../../settings/api/portal-consent-documents'
import { restoreCompatibleConsentDraftValues } from '../../settings/lib/restore-compatible-consent-draft'
import { submitPortalConsentDocumentFromWriteState } from '../../settings/lib/submit-portal-consent-document'
import { resolvePortalConsentCreateType } from '../../settings/lib/settings-consent-key'
import type { PortalConsentDocumentDetail } from '../../settings/api/portal-consent-documents.types'
import type { DocumentConsentWriteKey } from './catalog'
import {
  CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE,
  isInstructorApplyConsentKey,
  RECEIPT_PRE_CONSENT_WRITE_KEY,
} from './catalog'
import { CrimeConsentDocumentForm } from './crime-document-form'
import { markInstructorApplyConsentAgreed } from './form-persist'
import {
  clearSchemaConsentWriteState,
  loadSchemaConsentWriteState,
  saveSchemaConsentWriteState,
  type SchemaConsentWriteState,
} from './schema-draft-persist'
import {
  PaymentBasicInfoFields,
  resolvePaymentConsentSignerName,
} from './payment-basic-info-fields'
import { ConsentSignatureStatement } from './signature-statement'
import { PlatformConsentFormBody } from './platform-consent-form-body'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { useInstructorApplyLockedBasic } from '../use-instructor-apply-locked-basic'
import styles from './consent-form.module.css'

function createInitialSchemaConsentState(consentKey: DocumentConsentWriteKey): SchemaConsentWriteState {
  const { templateId } = resolveDocumentConsentTemplate(consentKey)
  const seed = createConsentTemplateSeedDraft(templateId)
  if (seed == null) {
    return {
      draft: { schemaVersion: 1, formSettings: { titleNumbering: 'numeric' }, paragraphs: [] },
    }
  }

  let draft = seed
  if (templateId === 'agreement-notice') {
    draft = ensureAgreementNoticeConfirmationClosing(draft)
    draft = ensureAgreementNoticeInstitutionPurposeParagraphs(draft)
    draft = overlayAgreementNoticeSeedHorizontalTable(draft)
  }
  draft = normalizeMemberConsentWriteDraft(draft, templateId)

  return {
    draft,
    paymentBasicInfo:
      templateId === 'agreement-third-party' || templateId === 'agreement-receipt-pre-consent'
        ? {}
        : undefined,
    signatures: {},
  }
}

function isSchemaConsentWriteIncomplete(
  consentKey: DocumentConsentWriteKey,
  state: SchemaConsentWriteState
): boolean {
  const { templateId } = resolveDocumentConsentTemplate(consentKey)
  return hasMemberConsentIncompleteRequiredFields(state.draft, {
    templateId,
    paymentStatementBasicInfo: state.paymentBasicInfo,
    receiptPreConsentBasicInfo: state.paymentBasicInfo,
  })
}

export type ConsentWriteSubmitContext = 'instructorApply' | 'mypageSettings'

const PORTAL_SUBMIT_FAILED_MESSAGE =
  '동의서를 제출하지 못했어요. 입력 내용을 확인한 뒤 다시 시도해 주세요.'
const SIGNATURE_REQUIRED_ALERT_MESSAGE = '전자서명을 완료해 주세요'
const SERVER_DRAFT_LOADING_MESSAGE = '동의서 양식을 불러오는 중입니다.'
const PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE =
  '동의서 양식이 변경되었습니다. 최신 양식을 다시 확인해 주세요.'
const MEMBER_PROFILE_LOADING_MESSAGE = '회원 정보를 불러오는 중입니다.'

function readPortalConsentTemplateErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null
  const body = data as { code?: unknown; error?: { code?: unknown } }
  const nested = body.error?.code
  if (typeof nested === 'string' && nested.trim()) return nested.trim().toUpperCase()
  if (typeof body.code === 'string' && body.code.trim()) return body.code.trim().toUpperCase()
  return null
}

function applyLockedNoticeSubjectName(
  draft: WritingFormDraft,
  templateId: string,
  memberName: string,
): WritingFormDraft {
  if (templateId !== 'agreement-notice') return draft
  return applyAgreementNoticeSubjectMemberName(draft, memberName)
}

export function SchemaConsentWriteForm({
  consentKey,
  onComplete,
  readOnly = false,
  submitContext = 'instructorApply',
  onTitleAside,
}: {
  consentKey: DocumentConsentWriteKey
  onComplete: () => void
  readOnly?: boolean
  submitContext?: ConsentWriteSubmitContext
  /** 페이지 제목 우측 — 전자서명 만들기/수정하기 */
  onTitleAside?: (aside: ReactNode | null) => void
}) {
  const { templateId } = resolveDocumentConsentTemplate(consentKey)
  const { lockedBasic, isLoading: isLockedBasicLoading } = useInstructorApplyLockedBasic()
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState(CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const portalSubmitEnabled = isRemoteApiConfigured() && Boolean(getAccessToken())
  const serverDraftInitializedRef = useRef(false)
  const [isServerDraftLoading, setIsServerDraftLoading] = useState(false)

  const [state, setState] = useState<SchemaConsentWriteState>(() => {
    const initial = createInitialSchemaConsentState(consentKey)
    const normalized: SchemaConsentWriteState = {
      ...initial,
      draft: normalizeMemberConsentWriteDraft(initial.draft, templateId),
      signatures: {},
    }
    if (readOnly) {
      return loadSchemaConsentWriteState(consentKey, normalized)
    }
    clearSchemaConsentWriteState(consentKey)
    return normalized
  })

  const applyServerDraftDocument = useCallback(
    (document: PortalConsentDocumentDetail, restoreFromDraft?: WritingFormDraft) => {
      const formTemplateVersion = document.formTemplateVersion
      const documentId = document.documentId
      const serverTemplateCode = formTemplateVersion?.templateCode?.trim() || templateId
      const normalizedServerDraft =
        formTemplateVersion?.schemaJson != null
          ? normalizeMemberConsentWriteDraft(
              formTemplateVersion.schemaJson as WritingFormDraft,
              serverTemplateCode,
            )
          : null
      if (documentId == null || normalizedServerDraft == null) return
      const restoredDraft =
        restoreFromDraft == null
          ? normalizedServerDraft
          : restoreCompatibleConsentDraftValues(restoreFromDraft, normalizedServerDraft)
      const serverDraft = applyLockedNoticeSubjectName(
        restoredDraft,
        serverTemplateCode,
        lockedBasic.name,
      )
      setState(prev => ({
        ...prev,
        draft: serverDraft,
        paymentBasicInfo:
          serverTemplateCode === 'agreement-third-party' ||
          serverTemplateCode === 'agreement-receipt-pre-consent'
            ? prev.paymentBasicInfo ?? {}
            : undefined,
        portalDocument: {
          documentId,
          templateVersionId: formTemplateVersion?.templateVersionId ?? null,
          templateCode: serverTemplateCode,
        },
      }))
    },
    [lockedBasic.name, templateId],
  )

  useEffect(() => {
    if (readOnly || !portalSubmitEnabled || isCrimeConsentTemplate(templateId)) return
    if (serverDraftInitializedRef.current) return
    serverDraftInitializedRef.current = true
    setIsServerDraftLoading(true)
    const consentType = resolvePortalConsentCreateType(consentKey)
    void createPortalConsentDocument({ consentType })
      .then(applyServerDraftDocument)
      .catch(error => {
        console.debug('portal consent draft create failed', error)
        setAlertMessage(PORTAL_SUBMIT_FAILED_MESSAGE)
        setAlertOpen(true)
      })
      .finally(() => setIsServerDraftLoading(false))
  }, [applyServerDraftDocument, consentKey, portalSubmitEnabled, readOnly, templateId])

  const recoverPortalDraftVersion = useCallback(async () => {
    const consentType = resolvePortalConsentCreateType(consentKey)
    const previousDraft = state.draft
    const document = await createPortalConsentDocument({ consentType })
    applyServerDraftDocument(document, previousDraft)
  }, [applyServerDraftDocument, consentKey, state.draft])

  useEffect(() => {
    if (readOnly) return
    saveSchemaConsentWriteState(consentKey, state)
  }, [consentKey, readOnly, state])

  useEffect(() => {
    if (readOnly || templateId !== 'agreement-notice') return
    const memberName = lockedBasic.name.trim()
    if (!memberName) return
    setState(prev => {
      const nextDraft = applyAgreementNoticeSubjectMemberName(prev.draft, memberName)
      if (nextDraft === prev.draft) return prev
      return { ...prev, draft: nextDraft }
    })
  }, [lockedBasic.name, readOnly, state.draft, templateId])

  const signatureSlots = useMemo(() => resolveConsentSignatureSlots(templateId), [templateId])
  const incompleteRequiredFields = useMemo(
    () =>
      listMemberConsentIncompleteRequiredFields(state.draft, {
        templateId,
        paymentStatementBasicInfo: state.paymentBasicInfo,
        receiptPreConsentBasicInfo: state.paymentBasicInfo,
      }),
    [state.draft, state.paymentBasicInfo, templateId],
  )
  const incomplete = isSchemaConsentWriteIncomplete(consentKey, state)

  const handleSubmit = () => {
    if (isSubmitting) return
    if (isServerDraftLoading) {
      setAlertMessage(SERVER_DRAFT_LOADING_MESSAGE)
      setAlertOpen(true)
      return
    }
    if (templateId === 'agreement-notice' && isLockedBasicLoading && !lockedBasic.name.trim()) {
      setAlertMessage(MEMBER_PROFILE_LOADING_MESSAGE)
      setAlertOpen(true)
      return
    }
    if (incomplete) {
      setAlertMessage(
        formatMemberConsentIncompleteRequiredAlertMessage(incompleteRequiredFields) ||
          CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE,
      )
      setAlertOpen(true)
      return
    }
    const contactFormatMessage = getMemberConsentInvalidNoticeSubjectContactAlertMessage(state.draft)
    if (contactFormatMessage != null) {
      setAlertMessage(contactFormatMessage)
      setAlertOpen(true)
      return
    }
    if (
      hasMemberConsentInvalidResidentNumberFormat(state.draft, {
        templateId,
        paymentStatementBasicInfo: state.paymentBasicInfo,
      })
    ) {
      setAlertMessage(PAYMENT_STATEMENT_RESIDENT_NUMBER_INVALID_ALERT_MESSAGE)
      setAlertOpen(true)
      return
    }

    if (
      signatureSlots.length > 0 &&
      !isConsentSignaturesComplete(state.signatures, signatureSlots)
    ) {
      setAlertMessage(SIGNATURE_REQUIRED_ALERT_MESSAGE)
      setAlertOpen(true)
      return
    }

    if (portalSubmitEnabled) {
      setIsSubmitting(true)
      void submitPortalConsentDocumentFromWriteState(consentKey, state)
        .then(() => {
          if (submitContext === 'instructorApply' && isInstructorApplyConsentKey(consentKey)) {
            markInstructorApplyConsentAgreed(consentKey)
          }
          onComplete()
        })
        .catch(error => {
          const code = readPortalConsentTemplateErrorCode(error)
          if (code === 'PORTAL_CONSENT_TEMPLATE_VERSION_CHANGED') {
            void recoverPortalDraftVersion().finally(() => {
              setAlertMessage(PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE)
              setAlertOpen(true)
            })
            return
          }
          if (code === 'PORTAL_CONSENT_TEMPLATE_VERSION_MISMATCH') {
            const documentId = state.portalDocument?.documentId
            void (
              documentId == null
                ? recoverPortalDraftVersion()
                : fetchPortalConsentDocumentDetail(documentId).then(document => {
                    applyServerDraftDocument(document, state.draft)
                  })
            )
              .catch(() => recoverPortalDraftVersion())
              .finally(() => {
                setAlertMessage(PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE)
                setAlertOpen(true)
              })
            return
          }
          setAlertMessage(PORTAL_SUBMIT_FAILED_MESSAGE)
          setAlertOpen(true)
        })
        .finally(() => setIsSubmitting(false))
      return
    }

    if (consentKey === RECEIPT_PRE_CONSENT_WRITE_KEY) {
      setAlertMessage(PORTAL_SUBMIT_FAILED_MESSAGE)
      setAlertOpen(true)
      return
    }
    markInstructorApplyConsentAgreed(consentKey)
    onComplete()
  }

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setState(prev => ({
      ...prev,
      draft: {
        ...prev.draft,
        paragraphs: prev.draft.paragraphs.map(paragraph =>
          paragraph.id === id ? updater(paragraph) : paragraph
        ),
      },
    }))
  }, [])

  const hiddenParagraphIds = useMemo(
    () => resolvePlatformConsentHiddenParagraphIds(templateId),
    [templateId],
  )

  const fillOptions = useMemo(() => buildPlatformConsentFillOptions(templateId), [templateId])

  const signerName = useMemo(() => {
    if (templateId === 'agreement-notice') {
      return lockedBasic.name.trim() || '회원'
    }
    return resolvePaymentConsentSignerName(state.paymentBasicInfo, lockedBasic.name)
  }, [lockedBasic.name, state.paymentBasicInfo, templateId])

  const lockedNoticeSubjectMemberName =
    templateId === 'agreement-notice' ? lockedBasic.name.trim() : undefined

  const showDraftSignature = signatureSlots.length > 0 && !readOnly

  const handleClearAllSignatureSlots = useCallback(() => {
    setState(prev => ({
      ...prev,
      signatures: clearConsentSignatureSlotKeys(prev.signatures, signatureSlots),
    }))
  }, [signatureSlots])

  useEffect(() => {
    if (!showDraftSignature) {
      onTitleAside?.(null)
    }
  }, [onTitleAside, showDraftSignature])

  const renderParagraphSlot = useCallback(
    (paragraph: WritingFormParagraph) => {
      if (
        paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord ||
        paragraph.id === RECEIPT_PRE_CONSENT_IDS.paymentRecord
      ) {
        return (
          <PaymentBasicInfoFields
            variant={
              paragraph.id === RECEIPT_PRE_CONSENT_IDS.paymentRecord ? 'receipt' : 'payment'
            }
            values={state.paymentBasicInfo ?? {}}
            onChange={paymentBasicInfo =>
              setState(prev => ({ ...prev, paymentBasicInfo }))
            }
          />
        )
      }

      if (
        paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine ||
        paragraph.id === RECEIPT_PRE_CONSENT_IDS.midConsentLine
      ) {
        const body =
          paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text'
            ? paragraph.bodyText.trim()
            : ''
        return (
          <ConsentSignatureStatement
            statement={body}
            signerName={signerName}
            signature={state.signatures?.mid}
            onSignatureChange={mid =>
              setState(prev => ({
                ...prev,
                signatures: { ...prev.signatures, mid },
              }))
            }
          />
        )
      }

      if (
        paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm ||
        paragraph.id === RECEIPT_PRE_CONSENT_IDS.finalConfirm
      ) {
        const body =
          paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text'
            ? paragraph.bodyText.trim()
            : ''
        return (
          <ConsentSignatureStatement
            statement={body}
            signerName={signerName}
            signature={state.signatures?.final}
            onSignatureChange={finalSig =>
              setState(prev => ({
                ...prev,
                signatures: { ...prev.signatures, final: finalSig },
              }))
            }
          />
        )
      }

      if (paragraph.id === EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing) {
        const body =
          paragraph.kind === 'description' && paragraph.variant === 'closing'
            ? paragraph.body.trim()
            : ''
        return (
          <ConsentSignatureStatement
            statement={body}
            signerName={signerName}
            signature={state.signatures?.final}
            onSignatureChange={finalSig =>
              setState(prev => ({
                ...prev,
                signatures: { ...prev.signatures, final: finalSig },
              }))
            }
          />
        )
      }

      if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature) {
        return (
          <div className={styles.closingRecipient}>
            <p className={styles.closingRecipientText}>JA KOREA 귀하</p>
          </div>
        )
      }

      return undefined
    },
    [
      signerName,
      state.draft.paragraphs,
      state.paymentBasicInfo,
      state.signatures?.final,
      state.signatures?.mid,
      updateParagraph,
    ]
  )

  const renderAfterParagraphSlot = useCallback(
    (paragraph: WritingFormParagraph) => {
      if (templateId !== 'agreement-notice') return undefined
      if (
        paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject ||
        paragraph.kind !== 'single_item' ||
        paragraph.variant !== 'short_essay'
      ) {
        return undefined
      }
      return (
        <PFFormSignatureBlock
          className={styles.noticeSubjectSignatureCard}
          contentAlign="end"
          signerName={signerName}
          signature={state.signatures?.final}
          onSignatureChange={finalSig =>
            setState(prev => ({
              ...prev,
              signatures: { ...prev.signatures, final: finalSig },
            }))
          }
        />
      )
    },
    [signerName, state.signatures?.final, templateId],
  )

  if (isCrimeConsentTemplate(templateId) && isInstructorApplyConsentKey(consentKey)) {
    return (
      <CrimeConsentDocumentForm
        consentKey={consentKey}
        onComplete={onComplete}
        submitContext={submitContext}
        portalSubmitEnabled={portalSubmitEnabled}
      />
    )
  }

  const formBody = (
    <>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault()
          if (readOnly) return
          handleSubmit()
        }}
      >
        <fieldset disabled={readOnly} className={styles.fieldset}>
          <PlatformConsentFormBody
            draft={state.draft}
            hiddenParagraphIds={hiddenParagraphIds}
            onUpdateParagraph={readOnly ? () => undefined : updateParagraph}
            fillOptions={fillOptions}
            lockedNoticeSubjectMemberName={lockedNoticeSubjectMemberName}
            renderParagraphSlot={renderParagraphSlot}
            renderAfterParagraphSlot={renderAfterParagraphSlot}
          />
        </fieldset>
        {readOnly ? null : (
          <div className={styles.actions}>
            <PFButton
              size="xlarge"
              width={240}
              type="submit"
              disabled={isSubmitting || isServerDraftLoading}
            >
              {isSubmitting ? '제출 중…' : isServerDraftLoading ? '불러오는 중…' : '작성완료'}
            </PFButton>
          </div>
        )}
      </form>
      <PFAlertModal
        open={alertOpen}
        title="안내"
        description={alertMessage}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )

  if (!showDraftSignature) {
    return formBody
  }

  return (
    <PFFormDraftSignatureProvider onClearAllSignatureSlots={handleClearAllSignatureSlots}>
      <PFFormDraftSignatureTitleAsideBridge onTitleAside={onTitleAside} />
      {formBody}
    </PFFormDraftSignatureProvider>
  )
}

export function InstructorApplyConsentWriteForm({
  consentKey,
  onComplete,
  readOnly = false,
  submitContext = 'instructorApply',
  onTitleAside,
}: {
  consentKey: DocumentConsentWriteKey
  onComplete: () => void
  readOnly?: boolean
  submitContext?: ConsentWriteSubmitContext
  onTitleAside?: (aside: ReactNode | null) => void
}) {
  return (
    <SchemaConsentWriteForm
      consentKey={consentKey}
      onComplete={onComplete}
      readOnly={readOnly}
      submitContext={submitContext}
      onTitleAside={onTitleAside}
    />
  )
}
