import {
  buildPlatformConsentFillOptions,
  createConsentTemplateSeedDraft,
  hasMemberConsentIncompleteRequiredFields,
  isCrimeConsentTemplate,
  normalizeMemberConsentWriteDraft,
  resolveInstructorApplyConsentTemplate,
  resolvePlatformConsentHiddenParagraphIds,
} from '@jakorea/form-schema/consent'
import {
  ensureAgreementNoticeConfirmationClosing,
  overlayAgreementNoticeSeedHorizontalTable,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFAlertModal, PFButton } from '@/shared/ui'
import type { InstructorApplyConsentKey } from './catalog'
import { CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE } from './catalog'
import { CrimeConsentDocumentForm } from './crime-document-form'
import { markInstructorApplyConsentAgreed } from './form-persist'
import {
  loadSchemaConsentWriteState,
  saveSchemaConsentWriteState,
  type SchemaConsentWriteState,
} from './schema-draft-persist'
import {
  PaymentBasicInfoFields,
  resolvePaymentConsentSignerName,
} from './payment-basic-info-fields'
import { ConsentSignatureStatement } from './signature-statement'
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
    draft = overlayAgreementNoticeSeedHorizontalTable(draft)
  }
  draft = normalizeMemberConsentWriteDraft(draft, templateId)

  return {
    draft,
    paymentBasicInfo: templateId === 'agreement-third-party' ? {} : undefined,
    signatures: templateId === 'agreement-third-party' ? {} : undefined,
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

export function SchemaConsentWriteForm({
  consentKey,
  onComplete,
}: {
  consentKey: InstructorApplyConsentKey
  onComplete: () => void
}) {
  const { templateId } = resolveInstructorApplyConsentTemplate(consentKey)
  const { lockedBasic } = useInstructorApplyLockedBasic()
  const [alertOpen, setAlertOpen] = useState(false)

  const [state, setState] = useState<SchemaConsentWriteState>(() =>
    loadSchemaConsentWriteState(consentKey, createInitialSchemaConsentState(consentKey))
  )

  useEffect(() => {
    saveSchemaConsentWriteState(consentKey, state)
  }, [consentKey, state])

  const incomplete = isSchemaConsentWriteIncomplete(consentKey, state)

  const handleSubmit = () => {
    if (incomplete) {
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
    [templateId]
  )

  const fillOptions = useMemo(() => buildPlatformConsentFillOptions(templateId), [templateId])

  const signerName = useMemo(
    () => resolvePaymentConsentSignerName(state.paymentBasicInfo, lockedBasic.name),
    [lockedBasic.name, state.paymentBasicInfo]
  )

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
          <>
            {body ? <div className="form-template-preview-text">{body}</div> : null}
            <ConsentSignatureStatement
              statement={body}
              signerName={signerName}
              signatureDataUrl={state.signatures?.mid ?? ''}
              onSignatureChange={mid =>
                setState(prev => ({
                  ...prev,
                  signatures: { ...prev.signatures, mid },
                }))
              }
            />
          </>
        )
      }

      if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) {
        const body =
          paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text'
            ? paragraph.bodyText.trim()
            : ''
        return (
          <>
            {body ? <div className="form-template-preview-text">{body}</div> : null}
            <ConsentSignatureStatement
              statement={body}
              signerName={signerName}
              signatureDataUrl={state.signatures?.final ?? ''}
              onSignatureChange={finalSig =>
                setState(prev => ({
                  ...prev,
                  signatures: { ...prev.signatures, final: finalSig },
                }))
              }
            />
          </>
        )
      }

      return undefined
    },
    [signerName, state.paymentBasicInfo, state.signatures?.final, state.signatures?.mid]
  )

  if (isCrimeConsentTemplate(templateId)) {
    return (
      <CrimeConsentDocumentForm
        uploaded={state.crimeDocumentUploaded === true}
        onUploadedChange={crimeDocumentUploaded =>
          setState(prev => ({ ...prev, crimeDocumentUploaded }))
        }
        onComplete={onComplete}
        incomplete={incomplete}
      />
    )
  }

  return (
    <>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <FormTemplateHost surface="platformUser">
          <FormTemplateRenderer
            className={styles.schemaForm}
            draft={state.draft}
            interactionMode="user"
            surface="platformUser"
            hiddenParagraphIds={hiddenParagraphIds}
            onUpdateParagraph={updateParagraph}
            fillOptions={fillOptions}
            renderParagraphSlot={renderParagraphSlot}
          />
        </FormTemplateHost>
        <div className={styles.actions}>
          <PFButton size="xlarge" width={240} type="submit">
            작성 완료
          </PFButton>
        </div>
      </form>
      <PFAlertModal
        open={alertOpen}
        title="안내"
        description={CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}

export function InstructorApplyConsentWriteForm({
  consentKey,
  onComplete,
}: {
  consentKey: InstructorApplyConsentKey
  onComplete: () => void
}) {
  return <SchemaConsentWriteForm consentKey={consentKey} onComplete={onComplete} />
}
