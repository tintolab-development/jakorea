import {
  hasMemberConsentIncompleteRequiredFields,
  MEMBER_CONSENT_TEMPLATE_MAP,
  normalizeMemberConsentWriteDraft,
  portraitPersonalConsentNameValue,
  resolvePlatformConsentHiddenParagraphIds,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  createAgreementPortraitDraft,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { type FormUpdateParagraph, patchVerticalTableCell } from '@jakorea/form-template-runtime'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlatformConsentFormBody } from '@/features/mypage/instructor-apply/consent/platform-consent-form-body'
import { ConsentSignatureStatement } from '@/features/mypage/instructor-apply/consent/signature-statement'
import consentStyles from '@/features/mypage/instructor-apply/consent/consent-form.module.css'
import { PFAlertModal, PFButton, type FormSignatureValue } from '@/shared/ui'
import {
  loadPortraitConsentDraftState,
  peekPortraitConsentBridge,
  portraitConsentDraftScope,
  savePortraitConsentDraftState,
} from '../lib/portrait-consent-bridge'

const TEMPLATE_ID = MEMBER_CONSENT_TEMPLATE_MAP.consentPortrait.templateId
const INCOMPLETE_ALERT_MESSAGE = '필수 항목을 모두 작성해주세요'
const SIGNATURE_REQUIRED_ALERT_MESSAGE = '전자서명을 완료해 주세요'

type PortraitConsentWriteState = {
  draft: WritingFormDraft
  signatures?: {
    final?: FormSignatureValue | string
  }
}

function createPortraitConsentDraft(): WritingFormDraft {
  return normalizeMemberConsentWriteDraft(createAgreementPortraitDraft(), TEMPLATE_ID)
}

function createInitialPortraitConsentState(): PortraitConsentWriteState {
  return { draft: createPortraitConsentDraft(), signatures: {} }
}

function prefillPortraitName(draft: WritingFormDraft, verifiedName: string): WritingFormDraft {
  const trimmed = verifiedName.trim()
  if (!trimmed) return draft

  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable) {
        return paragraph
      }
      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'vertical_table') {
        return paragraph
      }
      const current = portraitPersonalConsentNameValue(paragraph.rows[0]?.cells[0] ?? '')
      if (current.trim() !== '') return paragraph
      return patchVerticalTableCell(paragraph, 0, 0, trimmed)
    }),
  }
}

function resolveSignerName(draft: WritingFormDraft, fallbackName: string): string {
  const table = draft.paragraphs.find(
    paragraph => paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable
  )
  if (table != null && table.kind === 'single_item' && table.variant === 'vertical_table') {
    const name = portraitPersonalConsentNameValue(table.rows[0]?.cells[0] ?? '').trim()
    if (name) return name
  }
  return fallbackName.trim() || '회원'
}

function hasPortraitSignature(signature: FormSignatureValue | string | undefined): boolean {
  if (signature == null) return false
  if (typeof signature === 'string') return signature.trim() !== ''
  return signature.dataUrl.trim() !== ''
}

export function PortraitConsentWriteForm({
  onComplete,
}: {
  onComplete: () => void
}) {
  const bridge = peekPortraitConsentBridge()
  const verifiedName = bridge?.verifiedName?.trim() ?? ''
  const draftScope = portraitConsentDraftScope(bridge)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState(INCOMPLETE_ALERT_MESSAGE)
  const [state, setState] = useState<PortraitConsentWriteState>(() => {
    const initial = createInitialPortraitConsentState()
    const loaded = loadPortraitConsentDraftState(initial, draftScope)
    const normalized = normalizeMemberConsentWriteDraft(loaded.draft as WritingFormDraft, TEMPLATE_ID)
    return {
      ...loaded,
      draft: prefillPortraitName(normalized, verifiedName),
      signatures: loaded.signatures as PortraitConsentWriteState['signatures'],
    }
  })

  useEffect(() => {
    savePortraitConsentDraftState(state, draftScope)
  }, [draftScope, state])

  const incomplete = hasMemberConsentIncompleteRequiredFields(state.draft, {
    templateId: TEMPLATE_ID,
  })

  const hiddenParagraphIds = useMemo(
    () => resolvePlatformConsentHiddenParagraphIds(TEMPLATE_ID),
    []
  )

  const signerName = useMemo(
    () => resolveSignerName(state.draft, verifiedName),
    [state.draft, verifiedName]
  )

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

  const handleSubmit = () => {
    if (incomplete) {
      setAlertMessage(INCOMPLETE_ALERT_MESSAGE)
      setAlertOpen(true)
      return
    }
    if (!hasPortraitSignature(state.signatures?.final)) {
      setAlertMessage(SIGNATURE_REQUIRED_ALERT_MESSAGE)
      setAlertOpen(true)
      return
    }
    onComplete()
  }

  const renderParagraphSlot = useCallback(
    (paragraph: WritingFormParagraph) => {
      if (paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing) {
        const statement =
          paragraph.kind === 'description' && paragraph.variant === 'closing'
            ? paragraph.body.trim()
            : ''
        return (
          <ConsentSignatureStatement
            statement={statement}
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

      if (paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature) {
        return (
          <div className={consentStyles.closingRecipient}>
            <p className={consentStyles.closingRecipientText}>JA KOREA 귀하</p>
          </div>
        )
      }

      return undefined
    },
    [signerName, state.signatures?.final]
  )

  return (
    <>
      <form
        className={consentStyles.form}
        onSubmit={event => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <fieldset className={consentStyles.fieldset}>
          <PlatformConsentFormBody
            draft={state.draft}
            hiddenParagraphIds={hiddenParagraphIds}
            onUpdateParagraph={updateParagraph}
            fillOptions={{ consentFillReadOnlyBody: true }}
            renderParagraphSlot={renderParagraphSlot}
          />
        </fieldset>
        <div className={consentStyles.actions}>
          <PFButton size="xlarge" width={240} type="submit">
            작성완료
          </PFButton>
        </div>
      </form>
      <PFAlertModal
        open={alertOpen}
        title="안내"
        description={alertMessage}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}
