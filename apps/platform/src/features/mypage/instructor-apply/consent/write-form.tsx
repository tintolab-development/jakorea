import {
  applyAgreementNoticeSubjectMemberName,
  buildPlatformConsentFillOptions,
  collectMemberConsentUnagreedRequiredLabels,
  createConsentTemplateSeedDraft,
  formatMemberConsentDisagreedRequiredAlertMessage,
  formatMemberConsentIncompleteRequiredAlertMessage,
  getMemberConsentInvalidNoticeSubjectContactAlertMessage,
  MEMBER_CONSENT_DISAGREED_REQUIRED_ALERT_TITLE,
  hasMemberConsentIncompleteRequiredFields,
  hasMemberConsentInvalidResidentNumberFormat,
  isCrimeConsentTemplate,
  listMemberConsentIncompleteRequiredFields,
  normalizeMemberConsentWriteDraft,
  overlayPaymentStatementProfileLinkedValues,
  buildPaymentStatementProfileLinkedValues,
  mergeReceiptPreConsentBasicInfo,
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
  type FormSignatureValue,
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
import { parseWritingFormDraftFromUnknown } from '../../settings/lib/parse-consent-document-draft'
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
import { loadInstructorApplyFormDraft, markInstructorApplyConsentAgreed } from './form-persist'
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
import {
  overlayReceiptLockedMemberValues,
  type ReceiptLockedMemberFields,
} from './overlay-receipt-locked-member'
import { ConsentSignatureStatement } from './signature-statement'
import { PlatformConsentFormBody } from './platform-consent-form-body'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { useInstructorApplyLockedBasic } from '../use-instructor-apply-locked-basic'
import { isInstructorApplyHomeAddressLocked } from '../map-locked-basic-info'
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
      templateId === 'agreement-third-party'
        ? {}
        : templateId === 'agreement-receipt-pre-consent'
          ? mergeReceiptPreConsentBasicInfo()
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
    receiptPreConsentBasicInfo:
      templateId === 'agreement-receipt-pre-consent' ? state.paymentBasicInfo : undefined,
  })
}

export type ConsentWriteSubmitContext = 'instructorApply' | 'mypageSettings'

const PORTAL_SUBMIT_FAILED_MESSAGE =
  '동의서를 제출하지 못했어요. 입력 내용을 확인한 뒤 다시 시도해 주세요.'
const SIGNATURE_REQUIRED_ALERT_MESSAGE = '전자서명을 완료해 주세요'
const SERVER_DRAFT_LOADING_MESSAGE = '동의서 양식을 불러오는 중입니다.'
const SERVER_DRAFT_UNAVAILABLE_MESSAGE =
  '동의서 양식을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
const PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE =
  '동의서 양식이 변경되었습니다. 최신 양식을 다시 확인해 주세요.'
const MEMBER_PROFILE_LOADING_MESSAGE = '회원 정보를 불러오는 중입니다.'
const PORTAL_CONSENT_TERMS_NOT_PUBLISHED_MESSAGE =
  '영수증 발급 사전 동의 약관이 아직 게시되지 않았습니다. 잠시 후 다시 시도해 주세요.'
const CONSENT_RECEIPT_RRN_NOT_ALLOWED_MESSAGE =
  '주민등록번호는 영수증 발급 사전 동의에 포함할 수 없습니다.'
const CONSENT_PAYMENT_BASIC_INFO_NOT_ALLOWED_MESSAGE =
  '이 동의서에는 지급조서 전용 항목(주민등록번호·소속)을 넣을 수 없습니다.'
const RECEIPT_CONSENT_BASIC_INFO_REQUIRED_MESSAGE =
  '영수증 사전 동의서의 지급조서 정보를 입력해 주세요.'
const RECEIPT_CONSENT_PURPOSE_INVALID_MESSAGE =
  '영수증 발급 사전 동의서의 지급 목적을 확인해 주세요.'

const PORTAL_CONSENT_SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  PORTAL_CONSENT_TERMS_NOT_PUBLISHED: PORTAL_CONSENT_TERMS_NOT_PUBLISHED_MESSAGE,
  CONSENT_RECEIPT_RRN_NOT_ALLOWED: CONSENT_RECEIPT_RRN_NOT_ALLOWED_MESSAGE,
  CONSENT_PAYMENT_BASIC_INFO_NOT_ALLOWED: CONSENT_PAYMENT_BASIC_INFO_NOT_ALLOWED_MESSAGE,
  RECEIPT_CONSENT_BASIC_INFO_REQUIRED: RECEIPT_CONSENT_BASIC_INFO_REQUIRED_MESSAGE,
  RECEIPT_CONSENT_PURPOSE_INVALID: RECEIPT_CONSENT_PURPOSE_INVALID_MESSAGE,
  PORTAL_CONSENT_REQUIRED_SIGNATURE_MISSING: SIGNATURE_REQUIRED_ALERT_MESSAGE,
  PORTAL_CONSENT_TEMPLATE_VERSION_CHANGED: PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE,
}

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
  const receiptLockedMember = useMemo((): ReceiptLockedMemberFields | null => {
    if (templateId !== 'agreement-receipt-pre-consent') return null
    const lockAddress = isInstructorApplyHomeAddressLocked(lockedBasic)
    return {
      nameKo: lockedBasic.name.trim(),
      addressRoad: lockAddress ? lockedBasic.homeAddress : '',
      addressDetail: lockAddress ? lockedBasic.homeAddressDetail : '',
      lockAddress,
    }
  }, [lockedBasic, templateId])
  const paymentStatementProfileValues = useMemo(() => {
    if (submitContext !== 'instructorApply' || templateId !== 'agreement-third-party') {
      return null
    }
    const draft = loadInstructorApplyFormDraft()
    const memberType = lockedBasic.memberType || draft?.memberType
    return buildPaymentStatementProfileLinkedValues({
      name: lockedBasic.name || draft?.name,
      memberType,
      schoolName: lockedBasic.schoolName || draft?.schoolName,
      affiliationName: lockedBasic.affiliationName || draft?.affiliationName,
      affiliationNone:
        memberType === 'school_teacher'
          ? false
          : Boolean(lockedBasic.affiliationNone || draft?.affiliationNone),
      homeAddress: draft?.homeAddress || lockedBasic.homeAddress,
      homeAddressDetail: draft?.homeAddressDetail || lockedBasic.homeAddressDetail,
    })
  }, [lockedBasic, submitContext, templateId])
  /** 영수증 지급조서 `소속` — 회원정보 표시 전용(제출 payload에는 넣지 않음: 영수증은 소속 미수집) */
  const receiptAffiliationDisplay = useMemo(() => {
    if (templateId !== 'agreement-receipt-pre-consent') return ''
    const linked = buildPaymentStatementProfileLinkedValues({
      name: lockedBasic.name,
      memberType: lockedBasic.memberType,
      schoolName: lockedBasic.schoolName,
      affiliationName: lockedBasic.affiliationName,
      affiliationNone:
        lockedBasic.memberType === 'school_teacher' ? false : Boolean(lockedBasic.affiliationNone),
    })
    return linked.affiliation
  }, [lockedBasic, templateId])
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('안내')
  const [alertMessage, setAlertMessage] = useState(CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE)
  const openAlert = useCallback((message: string, title = '안내') => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertOpen(true)
  }, [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const portalSubmitEnabled = isRemoteApiConfigured() && Boolean(getAccessToken())
  const serverDraftInitializedRef = useRef(false)
  const [isServerDraftLoading, setIsServerDraftLoading] = useState(false)
  const [serverDraftUnavailable, setServerDraftUnavailable] = useState(false)

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

  const paymentBasicInfo = useMemo(() => {
    if (templateId === 'agreement-receipt-pre-consent') {
      return overlayReceiptLockedMemberValues(state.paymentBasicInfo, receiptLockedMember)
    }
    if (templateId !== 'agreement-third-party') return undefined
    return overlayPaymentStatementProfileLinkedValues(
      state.paymentBasicInfo ?? {},
      paymentStatementProfileValues
    )
  }, [paymentStatementProfileValues, receiptLockedMember, state.paymentBasicInfo, templateId])
  const writeState = useMemo(
    () => ({ ...state, paymentBasicInfo }),
    [paymentBasicInfo, state]
  )

  const applyServerDraftDocument = useCallback(
    (document: PortalConsentDocumentDetail, restoreFromDraft?: WritingFormDraft) => {
      const formTemplateVersion = document.formTemplateVersion
      const documentId = document.documentId
      const serverTemplateCode = formTemplateVersion?.templateCode?.trim() || templateId
      const versionDraft =
        formTemplateVersion?.schemaJson != null
          ? parseWritingFormDraftFromUnknown(formTemplateVersion.schemaJson)
          : null
      if (documentId == null || versionDraft == null) return
      const normalizedServerDraft = normalizeMemberConsentWriteDraft(
        versionDraft,
        serverTemplateCode,
      )
      const filledDraft = parseWritingFormDraftFromUnknown(document.filledDocument?.schemaJson)
      const answersToRestore = restoreFromDraft ?? filledDraft
      const restoredDraft =
        answersToRestore == null
          ? normalizedServerDraft
          : restoreCompatibleConsentDraftValues(answersToRestore, normalizedServerDraft)
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
            ? serverTemplateCode === 'agreement-receipt-pre-consent'
              ? overlayReceiptLockedMemberValues(prev.paymentBasicInfo, receiptLockedMember)
              : overlayPaymentStatementProfileLinkedValues(
                  prev.paymentBasicInfo ?? {},
                  paymentStatementProfileValues
                )
            : undefined,
        portalDocument: {
          documentId,
          templateVersionId: formTemplateVersion?.templateVersionId ?? null,
          templateCode: serverTemplateCode,
        },
      }))
    },
    [lockedBasic.name, paymentStatementProfileValues, receiptLockedMember, templateId],
  )

  useEffect(() => {
    if (readOnly || !portalSubmitEnabled || isCrimeConsentTemplate(templateId)) return
    if (serverDraftInitializedRef.current) return
    serverDraftInitializedRef.current = true
    setIsServerDraftLoading(true)
    const consentType = resolvePortalConsentCreateType(consentKey)
    void createPortalConsentDocument({ consentType })
      .then(document => {
        applyServerDraftDocument(document)
        if (document.documentId == null || document.formTemplateVersion?.schemaJson == null) {
          setServerDraftUnavailable(true)
          openAlert(SERVER_DRAFT_UNAVAILABLE_MESSAGE)
          return
        }
        setServerDraftUnavailable(false)
      })
      .catch(error => {
        setServerDraftUnavailable(true)
        console.debug('portal consent draft create failed', error)
        openAlert(SERVER_DRAFT_UNAVAILABLE_MESSAGE)
      })
      .finally(() => setIsServerDraftLoading(false))
  }, [applyServerDraftDocument, consentKey, openAlert, portalSubmitEnabled, readOnly, templateId])

  const recoverPortalDraftVersion = useCallback(async () => {
    const consentType = resolvePortalConsentCreateType(consentKey)
    const previousDraft = state.draft
    const document = await createPortalConsentDocument({ consentType })
    applyServerDraftDocument(document, previousDraft)
  }, [applyServerDraftDocument, consentKey, state.draft])

  useEffect(() => {
    if (readOnly) return
    saveSchemaConsentWriteState(consentKey, writeState)
  }, [consentKey, readOnly, writeState])

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
        paymentStatementBasicInfo: paymentBasicInfo,
        receiptPreConsentBasicInfo:
          templateId === 'agreement-receipt-pre-consent' ? paymentBasicInfo : undefined,
      }),
    [paymentBasicInfo, state.draft, templateId],
  )
  const incomplete = isSchemaConsentWriteIncomplete(consentKey, writeState)

  const handleSubmit = () => {
    if (isSubmitting) return
    if (isServerDraftLoading) {
      openAlert(SERVER_DRAFT_LOADING_MESSAGE)
      return
    }
    if (serverDraftUnavailable) {
      openAlert(SERVER_DRAFT_UNAVAILABLE_MESSAGE)
      return
    }
    if (templateId === 'agreement-notice' && isLockedBasicLoading && !lockedBasic.name.trim()) {
      openAlert(MEMBER_PROFILE_LOADING_MESSAGE)
      return
    }
    if (incomplete) {
      const unagreedLabels = collectMemberConsentUnagreedRequiredLabels(state.draft)
      if (unagreedLabels.length > 0) {
        openAlert(
          formatMemberConsentDisagreedRequiredAlertMessage(unagreedLabels),
          MEMBER_CONSENT_DISAGREED_REQUIRED_ALERT_TITLE,
        )
      } else {
        openAlert(
          formatMemberConsentIncompleteRequiredAlertMessage(incompleteRequiredFields) ||
            CONSENT_WRITE_INCOMPLETE_ALERT_MESSAGE,
        )
      }
      return
    }
    const contactFormatMessage = getMemberConsentInvalidNoticeSubjectContactAlertMessage(state.draft)
    if (contactFormatMessage != null) {
      openAlert(contactFormatMessage)
      return
    }
    if (
      hasMemberConsentInvalidResidentNumberFormat(state.draft, {
        templateId,
        paymentStatementBasicInfo: paymentBasicInfo,
      })
    ) {
      openAlert(PAYMENT_STATEMENT_RESIDENT_NUMBER_INVALID_ALERT_MESSAGE)
      return
    }

    if (
      signatureSlots.length > 0 &&
      !isConsentSignaturesComplete(state.signatures, signatureSlots)
    ) {
      openAlert(SIGNATURE_REQUIRED_ALERT_MESSAGE)
      return
    }

    if (portalSubmitEnabled) {
      setIsSubmitting(true)
      void submitPortalConsentDocumentFromWriteState(consentKey, writeState)
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
              openAlert(PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE)
            })
            return
          }
          if (code && PORTAL_CONSENT_SUBMIT_ERROR_MESSAGES[code]) {
            openAlert(PORTAL_CONSENT_SUBMIT_ERROR_MESSAGES[code])
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
                openAlert(PORTAL_CONSENT_TEMPLATE_CHANGED_MESSAGE)
              })
            return
          }
          openAlert(PORTAL_SUBMIT_FAILED_MESSAGE)
        })
        .finally(() => setIsSubmitting(false))
      return
    }

    if (consentKey === RECEIPT_PRE_CONSENT_WRITE_KEY) {
      openAlert(PORTAL_SUBMIT_FAILED_MESSAGE)
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
    return resolvePaymentConsentSignerName(paymentBasicInfo, lockedBasic.name)
  }, [lockedBasic.name, paymentBasicInfo, templateId])

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
        const isReceipt = paragraph.id === RECEIPT_PRE_CONSENT_IDS.paymentRecord
        return (
          <PaymentBasicInfoFields
            variant={isReceipt ? 'receipt' : 'payment'}
            values={paymentBasicInfo ?? {}}
            lockProfileFields={!isReceipt && paymentStatementProfileValues != null}
            profileValues={isReceipt ? null : paymentStatementProfileValues}
            receiptLockedMember={isReceipt ? receiptLockedMember : null}
            receiptAffiliationDisplay={isReceipt ? receiptAffiliationDisplay : undefined}
            onChange={next =>
              setState(prev => ({
                ...prev,
                paymentBasicInfo: isReceipt
                  ? overlayReceiptLockedMemberValues(next, receiptLockedMember)
                  : overlayPaymentStatementProfileLinkedValues(
                      next,
                      paymentStatementProfileValues
                    ),
              }))
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
        // 1행 = 확인문(S58), 2행 이후 = 회색 안내(S72 — 유효·보관 기간). CMS 마무리글 본문 그대로
        const [statementLine = '', ...noteLines] = body.split('\n')
        return (
          <ConsentSignatureStatement
            statement={statementLine.trim()}
            note={noteLines.join('\n')}
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
      paymentBasicInfo,
      paymentStatementProfileValues,
      receiptLockedMember,
      state.draft.paragraphs,
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
      const confirmationClosing = state.draft.paragraphs.find(
        p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
      )
      const confirmationText =
        confirmationClosing?.kind === 'description' && confirmationClosing.variant === 'closing'
          ? confirmationClosing.body.trim()
          : ''
      const onSignatureChange = (finalSig: FormSignatureValue) =>
        setState(prev => ({
          ...prev,
          signatures: { ...prev.signatures, final: finalSig },
        }))
      if (confirmationText) {
        // 서명 카드 확인문 — CMS 저장 `confirmationClosing` 본문
        return (
          <ConsentSignatureStatement
            statement={confirmationText}
            signerName={signerName}
            signature={state.signatures?.final}
            onSignatureChange={onSignatureChange}
          />
        )
      }
      return (
        <PFFormSignatureBlock
          className={styles.noticeSubjectSignatureCard}
          contentAlign="end"
          signerName={signerName}
          signature={state.signatures?.final}
          onSignatureChange={onSignatureChange}
        />
      )
    },
    [signerName, state.draft.paragraphs, state.signatures?.final, templateId],
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
        <fieldset
          disabled={readOnly || isServerDraftLoading || serverDraftUnavailable}
          className={styles.fieldset}
          aria-busy={isServerDraftLoading || undefined}
        >
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
              disabled={isSubmitting || isServerDraftLoading || serverDraftUnavailable}
            >
              {isSubmitting ? '제출 중…' : isServerDraftLoading ? '불러오는 중…' : '작성완료'}
            </PFButton>
          </div>
        )}
      </form>
      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
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
