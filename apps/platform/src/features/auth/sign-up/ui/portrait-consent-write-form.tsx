import {
  collectMemberConsentUnagreedRequiredLabels,
  formatMemberConsentDisagreedRequiredAlertMessage,
  formatMemberConsentIncompleteRequiredAlertMessage,
  listMemberConsentIncompleteRequiredFields,
  MEMBER_CONSENT_TEMPLATE_MAP,
  normalizeMemberConsentWriteDraft,
  portraitPersonalConsentNameValue,
  resolvePlatformConsentHiddenParagraphIds,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { type FormUpdateParagraph, patchVerticalTableCell } from '@jakorea/form-template-runtime'
import { restoreCompatibleConsentDraftValues } from '@/features/mypage/settings/lib/restore-compatible-consent-draft'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PlatformConsentFormBody } from '@/features/mypage/instructor-apply/consent/platform-consent-form-body'
import { ConsentSignatureStatement } from '@/features/mypage/instructor-apply/consent/signature-statement'
import consentStyles from '@/features/mypage/instructor-apply/consent/consent-form.module.css'
import { PLATFORM_ALERT_COPY, PLATFORM_REQUIRED_NOT_FILLED_TITLE } from '@/shared/lib/platform-alert-copy'
import {
  PFAlertModal,
  PFRequiredFieldsIncompleteDescription,
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
const SIGNATURE_REQUIRED_ALERT_MESSAGE = '전자서명을 완료해 주세요'

type PortraitConsentWriteState = {
  draft: WritingFormDraft
  signatures?: {
    final?: FormSignatureValue | string
  }
}

function createPortraitConsentDraft(): WritingFormDraft {
  return { schemaVersion: 1, formSettings: { titleNumbering: 'numeric' }, paragraphs: [] }
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
const SERVER_DRAFT_UNAVAILABLE_ALERT_MESSAGE =
  '초상권 동의 양식을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
export function PortraitConsentWriteForm({
  onComplete,
  verifiedName: verifiedNameProp,
  lockPrefilledName = false,
  saveDraftState,
  onSubmitAsync,
  onTitleAside,
  serverDraft,
  serverDraftPending = false,
  serverDraftUnavailable = false,
}: {
  /** 서버 양식 수신 대기 중 — 입력·제출 잠금(수신 후 양식 교체로 입력값이 사라지는 것 방지) */
  serverDraftPending?: boolean
  /** 게시본 조회 실패·스키마 없음 — 고정 시드로 대체하지 않음 */
  serverDraftUnavailable?: boolean
  /**
   * 서버(CMS) 현재 양식 schema — 있으면 로컬 seed 대신 사용(응답 값은 비우고 성명 prefill).
   */
  serverDraft?: WritingFormDraft | null
  onComplete: () => void
  /** 가입 bridge 없을 때(마이페이지) 성명 prefill */
  verifiedName?: string
  /** true면 회원정보로 채운 성명을 비활성으로 고정한다(마이페이지). 기본 false — 가입 화면 동작 유지 */
  lockPrefilledName?: boolean
  saveDraftState?: (state: PortraitConsentWriteState) => void
  onSubmitAsync?: (state: PortraitConsentWriteState) => Promise<void>
  onTitleAside?: (aside: ReactNode | null) => void
}) {
  const bridge = peekPortraitConsentBridge()
  const verifiedName = verifiedNameProp?.trim() ?? bridge?.verifiedName?.trim() ?? ''
  const draftScope = portraitConsentDraftScope(bridge)

  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('안내')
  const [alertMessage, setAlertMessage] = useState<ReactNode>(null)
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

  const verifiedNameRef = useRef(verifiedName)
  verifiedNameRef.current = verifiedName
  useEffect(() => {
    if (serverDraft == null || !Array.isArray(serverDraft.paragraphs)) return
    if (serverDraft.paragraphs.length === 0) return
    const normalized = normalizeMemberConsentWriteDraft(serverDraft, TEMPLATE_ID)
    setState(prev => ({
      ...prev,
      draft: prefillPortraitName(
        restoreCompatibleConsentDraftValues(prev.draft, normalized),
        verifiedNameRef.current,
      ),
    }))
  }, [serverDraft])

  // 양식을 불러오지 못하면 [작성완료]가 잠기므로, 누르기 전에도 기존 안내를 바로 보여 준다
  useEffect(() => {
    if (!serverDraftUnavailable) return
    setAlertTitle('안내')
    setAlertMessage(SERVER_DRAFT_UNAVAILABLE_ALERT_MESSAGE)
    setAlertOpen(true)
  }, [serverDraftUnavailable])

  useEffect(() => {
    if (saveDraftState) {
      saveDraftState(state)
      return
    }
    savePortraitConsentDraftState(state, draftScope)
  }, [draftScope, saveDraftState, state])

  const incompleteFields = useMemo(
    () =>
      listMemberConsentIncompleteRequiredFields(state.draft, {
        templateId: TEMPLATE_ID,
      }),
    [state.draft],
  )

  const incomplete = incompleteFields.length > 0

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
    if (serverDraftPending || serverDraftUnavailable) {
      setAlertTitle('안내')
      setAlertMessage(
        serverDraftUnavailable
          ? SERVER_DRAFT_UNAVAILABLE_ALERT_MESSAGE
          : '동의서 양식을 불러오는 중입니다.',
      )
      setAlertOpen(true)
      return
    }
    if (incomplete) {
      const unagreedLabels = collectMemberConsentUnagreedRequiredLabels(state.draft)
      if (unagreedLabels.length > 0) {
        // 시안 「필수 항목 미동의」 제목 — 본문은 미동의 항목명을 그대로 안내한다
        setAlertTitle(PLATFORM_ALERT_COPY.requiredNotAgreed.title)
        setAlertMessage(formatMemberConsentDisagreedRequiredAlertMessage(unagreedLabels))
      } else {
        // 시안 「필수 항목 미입력」 제목 — 빠진 항목명을 알 수 있으면 그대로, 없으면 시안 설명
        setAlertTitle(PLATFORM_REQUIRED_NOT_FILLED_TITLE)
        setAlertMessage(
          formatMemberConsentIncompleteRequiredAlertMessage(incompleteFields) || (
            <PFRequiredFieldsIncompleteDescription />
          ),
        )
      }
      setAlertOpen(true)
      return
    }
    if (!hasPortraitSignature(state.signatures?.final)) {
      setAlertTitle('안내')
      setAlertMessage(SIGNATURE_REQUIRED_ALERT_MESSAGE)
      setAlertOpen(true)
      return
    }
    if (onSubmitAsync) {
      setIsSubmitting(true)
      void onSubmitAsync(state)
        .then(() => onComplete())
        .catch(() => {
          setAlertTitle('안내')
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
        <fieldset
          className={consentStyles.fieldset}
          disabled={serverDraftPending || serverDraftUnavailable}
          aria-busy={serverDraftPending || undefined}
        >
          <PlatformConsentFormBody
            draft={state.draft}
            hiddenParagraphIds={hiddenParagraphIds}
            onUpdateParagraph={updateParagraph}
            fillOptions={{ consentFillReadOnlyBody: true }}
            portraitPrefillLock={
              lockPrefilledName && verifiedName ? { name: true } : undefined
            }
            renderParagraphSlot={renderParagraphSlot}
          />
        </fieldset>
        <div className={consentStyles.actions}>
          <PFButton
            size="xlarge"
            width={240}
            type="submit"
            disabled={isSubmitting || serverDraftPending || serverDraftUnavailable}
          >
            작성완료
          </PFButton>
        </div>
      </form>
      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
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
