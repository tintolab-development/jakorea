import {
  buildPlatformConsentFillOptions,
  createConsentTemplateSeedDraft,
  getMemberConsentInvalidNoticeSubjectContactAlertMessage,
  hasMemberConsentIncompleteRequiredFields,
  hasMemberConsentInvalidResidentNumberFormat,
  isCrimeConsentTemplate,
  normalizeMemberConsentWriteDraft,
  PAYMENT_STATEMENT_RESIDENT_NUMBER_INVALID_ALERT_MESSAGE,
  resolveInstructorApplyConsentTemplate,
  resolvePlatformConsentHiddenParagraphIds,
} from '@jakorea/form-schema/consent'
import {
  ensureAgreementNoticeConfirmationClosing,
  ensureAgreementNoticeInstitutionPurposeParagraphs,
  overlayAgreementNoticeSeedHorizontalTable,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { submitPortalConsentDocumentFromWriteState } from '../../settings/lib/submit-portal-consent-document'
import type { InstructorApplyConsentKey } from './catalog'
import { CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE } from './catalog'
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

function createInitialSchemaConsentState(consentKey: InstructorApplyConsentKey): SchemaConsentWriteState {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  const seed = createConsentTemplateSeedDraft(templateId)
  if (seed == null) {
    return {
      draft: { schemaVersion: 1, formSettings: { titleNumbering: 'numeric' }, paragraphs: [] },
      crimeDocumentUploaded: false,
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
    paymentBasicInfo: templateId === 'agreement-third-party' ? {} : undefined,
    signatures: {},
    crimeDocumentUploaded: false,
  }
}

function isSchemaConsentWriteIncomplete(
  consentKey: InstructorApplyConsentKey,
  state: SchemaConsentWriteState
): boolean {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  if (isCrimeConsentTemplate(templateId)) {
    return state.crimeDocumentUploaded !== true
  }
  return hasMemberConsentIncompleteRequiredFields(state.draft, {
    templateId,
    paymentStatementBasicInfo: state.paymentBasicInfo,
  })
}

export type ConsentWriteSubmitContext = 'instructorApply' | 'mypageSettings'

const PORTAL_SUBMIT_FAILED_MESSAGE =
  '동의서를 제출하지 못했어요. 입력 내용을 확인한 뒤 다시 시도해 주세요.'
const SIGNATURE_REQUIRED_ALERT_MESSAGE = '전자서명을 완료해 주세요'

function patchAgreementNoticeSubjectMemberName(
  draft: WritingFormDraft,
  memberName: string,
): WritingFormDraft {
  const name = memberName.trim()
  if (!name) return draft

  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (
      paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject ||
      paragraph.kind !== 'single_item' ||
      paragraph.variant !== 'short_essay'
    ) {
      return paragraph
    }
    let paragraphChanged = false
    const items = (paragraph.items ?? []).map(item => {
      if (item.id !== AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name || item.bodyText === name) {
        return item
      }
      paragraphChanged = true
      return { ...item, bodyText: name }
    })
    if (!paragraphChanged) return paragraph
    changed = true
    return { ...paragraph, items }
  })

  return changed ? { ...draft, paragraphs } : draft
}

export function SchemaConsentWriteForm({
  consentKey,
  onComplete,
  readOnly = false,
  submitContext = 'instructorApply',
  onTitleAside,
}: {
  consentKey: InstructorApplyConsentKey
  onComplete: () => void
  readOnly?: boolean
  submitContext?: ConsentWriteSubmitContext
  /** 페이지 제목 우측 — 전자서명 만들기/수정하기 */
  onTitleAside?: (aside: ReactNode | null) => void
}) {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  const { lockedBasic } = useInstructorApplyLockedBasic()
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState(CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const portalSubmitEnabled = isRemoteApiConfigured() && Boolean(getAccessToken())

  const [state, setState] = useState<SchemaConsentWriteState>(() => {
    const initial = createInitialSchemaConsentState(consentKey)
    const normalized: SchemaConsentWriteState = {
      ...initial,
      draft: normalizeMemberConsentWriteDraft(initial.draft, templateId),
      signatures: {},
      crimeDocumentUploaded: initial.crimeDocumentUploaded,
    }
    if (readOnly) {
      return loadSchemaConsentWriteState(consentKey, normalized)
    }
    clearSchemaConsentWriteState(consentKey)
    return normalized
  })

  useEffect(() => {
    if (readOnly) return
    saveSchemaConsentWriteState(consentKey, state)
  }, [consentKey, readOnly, state])

  useEffect(() => {
    if (readOnly || templateId !== 'agreement-notice') return
    const memberName = lockedBasic.name.trim()
    if (!memberName) return
    setState(prev => {
      const nextDraft = patchAgreementNoticeSubjectMemberName(prev.draft, memberName)
      if (nextDraft === prev.draft) return prev
      return { ...prev, draft: nextDraft }
    })
  }, [lockedBasic.name, readOnly, templateId])

  const signatureSlots = useMemo(() => resolveConsentSignatureSlots(templateId), [templateId])
  const incomplete = isSchemaConsentWriteIncomplete(consentKey, state)

  const handleSubmit = () => {
    if (isSubmitting) return
    if (incomplete) {
      setAlertMessage(CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE)
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
          if (submitContext === 'instructorApply') {
            markInstructorApplyConsentAgreed(consentKey)
          }
          onComplete()
        })
        .catch(() => {
          setAlertMessage(PORTAL_SUBMIT_FAILED_MESSAGE)
          setAlertOpen(true)
        })
        .finally(() => setIsSubmitting(false))
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
      if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord) {
        return (
          <PaymentBasicInfoFields
            values={state.paymentBasicInfo ?? {}}
            onChange={paymentBasicInfo =>
              setState(prev => ({ ...prev, paymentBasicInfo }))
            }
          />
        )
      }

      if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine) {
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

      if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) {
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

  if (isCrimeConsentTemplate(templateId)) {
    return (
      <CrimeConsentDocumentForm
        consentKey={consentKey}
        uploaded={state.crimeDocumentUploaded === true}
        onUploadedChange={crimeDocumentUploaded =>
          setState(prev => ({ ...prev, crimeDocumentUploaded }))
        }
        onComplete={onComplete}
        incomplete={incomplete}
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
            <PFButton size="xlarge" width={240} type="submit" disabled={isSubmitting}>
              {isSubmitting ? '제출 중…' : '작성 완료'}
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
  consentKey: InstructorApplyConsentKey
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
