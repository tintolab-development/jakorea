import {
  collectMemberConsentUnagreedRequiredLabels,
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
import { getLoginApiErrorMessage } from '@/features/auth/sign-in/lib/get-login-api-error-message'
import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'
import { resolvePlatformErrorAlert } from '@/shared/lib/platform-error-alert'
import {
  buildRequiredMissingAlertCopy,
  type RequiredMissingAlertCopy,
} from '@/shared/lib/required-missing-alert'
import {
  PFAlertModal,
  PFButton,
  PFRequiredMissingAlert,
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
/** 전자서명 누락 — 「필수 항목 미입력(항목명 노출)」의 항목명 */
const SIGNATURE_REQUIRED_FIELD_LABEL = '전자서명'

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
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState<ReactNode>(null)
  const [requiredMissingCopy, setRequiredMissingCopy] = useState<RequiredMissingAlertCopy | null>(
    null,
  )
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
    // 시안 「공통 제한 안내 / 처리 실패」
    setAlertTitle(PLATFORM_ALERT_COPY.requestFailed.title)
    setAlertMessage(PLATFORM_ALERT_COPY.requestFailed.description)
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
      if (serverDraftUnavailable) {
        setAlertTitle(PLATFORM_ALERT_COPY.requestFailed.title)
        setAlertMessage(PLATFORM_ALERT_COPY.requestFailed.description)
      } else {
        setAlertTitle('안내')
        setAlertMessage('동의서 양식을 불러오는 중입니다.')
      }
      setAlertOpen(true)
      return
    }
    if (incomplete) {
      const unagreedLabels = collectMemberConsentUnagreedRequiredLabels(state.draft)
      if (unagreedLabels.length > 0) {
        // 시안 「필수 항목 미동의」 — 제목·설명 모두 시안 고정 문구
        setAlertTitle(PLATFORM_ALERT_COPY.requiredNotAgreed.title)
        setAlertMessage(PLATFORM_ALERT_COPY.requiredNotAgreed.description)
        setAlertOpen(true)
      } else {
        // 시안 「필수 항목 미입력(항목명 노출)」 — 빠진 항목명을 그대로 보여 준다
        setRequiredMissingCopy(
          buildRequiredMissingAlertCopy({
            kind: 'field',
            labels: incompleteFields.map(field => field.label),
          }),
        )
      }
      return
    }
    if (!hasPortraitSignature(state.signatures?.final)) {
      setRequiredMissingCopy(
        buildRequiredMissingAlertCopy({ kind: 'field', labels: [SIGNATURE_REQUIRED_FIELD_LABEL] }),
      )
      return
    }
    if (onSubmitAsync) {
      setIsSubmitting(true)
      void onSubmitAsync(state)
        .then(() => onComplete())
        .catch((error: unknown) => {
          // 시안 「네트워크 오류 / 처리 제한 / 처리 실패」 — 서버 업무 메시지는 설명에 그대로
          const copy = resolvePlatformErrorAlert(error, {
            serverMessage: e => getLoginApiErrorMessage(e, '', { overrideApprovalPending: false }),
          })
          setAlertTitle(copy.title)
          setAlertMessage(copy.description)
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
      <PFRequiredMissingAlert
        copy={requiredMissingCopy}
        onConfirm={() => setRequiredMissingCopy(null)}
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
