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
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PlatformConsentFormBody } from '@/features/mypage/instructor-apply/consent/platform-consent-form-body'
import { ConsentSignatureStatement } from '@/features/mypage/instructor-apply/consent/signature-statement'
import consentStyles from '@/features/mypage/instructor-apply/consent/consent-form.module.css'
import {
  PFAlertModal,
  PFButton,
  PFFormDraftSignatureProvider,
  PFFormDraftSignatureTitleAsideBridge,
  type FormSignatureValue,
} from '@/shared/ui'
import {
  clearPortraitConsentDraftStorage,
  peekPortraitConsentBridge,
  portraitConsentDraftScope,
  savePortraitConsentDraftState,
} from '../lib/portrait-consent-bridge'
import { clearMypagePortraitConsentDraftState } from '@/features/mypage/settings/lib/mypage-portrait-consent-draft'

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

const SUBMIT_FAILED_ALERT_MESSAGE = '동의서 제출에 실패했어요. 잠시 후 다시 시도해 주세요.'
export function PortraitConsentWriteForm({
  onComplete,
  verifiedName: verifiedNameProp,
  saveDraftState,
  onSubmitAsync,
  onTitleAside,
}: {
  onComplete: () => void
  /** 가입 bridge 없을 때(마이페이지) 성명 prefill */
  verifiedName?: string
  saveDraftState?: (state: PortraitConsentWriteState) => void
  onSubmitAsync?: (state: PortraitConsentWriteState) => Promise<void>
  onTitleAside?: (aside: ReactNode | null) => void
}) {
  const bridge = peekPortraitConsentBridge()
  const verifiedName = verifiedNameProp?.trim() ?? bridge?.verifiedName?.trim() ?? ''
  const draftScope = portraitConsentDraftScope(bridge)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState(INCOMPLETE_ALERT_MESSAGE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<PortraitConsentWriteState>(() => {
    if (saveDraftState != null) {
      clearMypagePortraitConsentDraftState()
    } else {
      clearPortraitConsentDraftStorage()
    }
    const initial = createInitialPortraitConsentState()
    const normalized = normalizeMemberConsentWriteDraft(initial.draft, TEMPLATE_ID)
    return {
      draft: prefillPortraitName(normalized, verifiedName),
      signatures: {},
    }
  })

  useEffect(() => {
    if (saveDraftState) {
      saveDraftState(state)
      return
    }
    savePortraitConsentDraftState(state, draftScope)
  }, [draftScope, saveDraftState, state])

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
    if (isSubmitting) return
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
    if (onSubmitAsync) {
      setIsSubmitting(true)
      void onSubmitAsync(state)
        .then(() => onComplete())
        .catch(() => {
          setAlertMessage(SUBMIT_FAILED_ALERT_MESSAGE)
          setAlertOpen(true)
        })
        .finally(() => setIsSubmitting(false))
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

  const handleClearAllSignatureSlots = useCallback(() => {
    setState(prev => ({ ...prev, signatures: {} }))
  }, [])

  const formBody = (
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
          <PFButton size="xlarge" width={240} type="submit" disabled={isSubmitting}>
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

  return (
    <PFFormDraftSignatureProvider onClearAllSignatureSlots={handleClearAllSignatureSlots}>
      <PFFormDraftSignatureTitleAsideBridge onTitleAside={onTitleAside} />
      {formBody}
    </PFFormDraftSignatureProvider>
  )
}
