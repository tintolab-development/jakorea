import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  buildSettlementTabPath,
  buildSettlementWritePath,
  clearSettlementWriteDraft,
  EducationSettlementApplicationDocumentOverlay,
  EducationSettlementConfirmView,
  loadSettlementWriteDraft,
  readSettlementRouteApplicationType,
  resolveSettlementAreaFromPathname,
  resolveSettlementDocumentKind,
  useSettlementApplicationDocumentQuery,
  type SettlementWriteDraftLocationState,
  buildSettlementConfirmPath,
} from '@/features/mypage/education/settlements'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import {
  useApplicationSettlementsQuery,
  useSubmitIndividualSettlementMutation,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { useSubmitInstructorSettlementMutation } from '@/features/mypage/education/settlements/api/use-submit-instructor-settlement-mutation'
import { useInstructorSettlementPreviewQuery } from '@/features/mypage/education/settlements/api/use-instructor-settlement-preview-query'
import { findAssignedSettlementItem } from '@/features/mypage/education/settlements/lib/assigned-settlement-items'
import { normalizeSettlementNamedExpense } from '@/features/mypage/education/settlements/lib/build-write-draft'
import {
  buildInstructorSettlementCreateRequest,
  buildInstructorSettlementResubmitRequest,
} from '@/features/mypage/education/settlements/lib/build-instructor-settlement-submit'
import {
  collectSettlementWriteRequiredMissingLabels,
  resolveSettlementWriteValidationAlert,
  validateSettlementWriteDraft,
} from '@/features/mypage/education/settlements/lib/validate-write-draft'
import {
  instructorSettlementApiErrorMessage,
  isInstructorPaymentStatementSubmit,
  isPaymentStatementConsentRequiredError,
  PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE,
  readInstructorSettlementErrorCode,
} from '@/features/mypage/education/settlements/lib/instructor-settlement-contract'
import {
  findExceededInstructorExpenseLimit,
  instructorPaymentItemLimitExceededAlert,
  instructorPaymentItemLimitMessage,
} from '@/features/mypage/education/settlements/lib/instructor-expense-items'
import {
  composeSettlementWriteBasic,
  readSettlementMemberProfileBasic,
} from '@/features/mypage/education/settlements/lib/map-payment-statement-basic-info'
import { useSettlementConsentSidecar } from '@/features/mypage/education/settlements/hooks/use-payment-statement-consent-basic-info'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { useReceiptPaymentStatementConsent } from '@/features/mypage/education/settlements/hooks/use-receipt-payment-statement-consent'
import {
  buildSettlementPaymentConsentPath,
} from '@/features/mypage/education/settlements/lib/consent-path'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import {
  buildIndividualSettlementResubmitRequest,
  buildIndividualSettlementSubmitRequest,
} from '@/features/mypage/education/settlements/lib/build-individual-settlement-submit'
import {
  INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE,
  individualSettlementApiErrorMessage,
  isReceiptPreConsentRequiredError,
  readIndividualSettlementErrorCode,
  resolveScheduleSettlementAudience,
} from '@/features/mypage/education/settlements/lib/individual-settlement-contract'
import {
  PAYMENT_ITEM_LIMIT_EXCEEDED_CODE,
  findExceededReceiptItemLimit,
  paymentItemLimitExceededMessage,
} from '@/features/mypage/education/settlements/lib/payment-item-limit'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  PFAlertModal,
  PFFormPage,
  PFRequiredFieldsIncompleteDescription,
  PFRequiredMissingAlert,
  PFText,
} from '@/shared/ui'
import {
  PLATFORM_ALERT_COPY,
  PLATFORM_REQUIRED_NOT_FILLED_TITLE,
} from '@/shared/lib/platform-alert-copy'
import {
  buildRequiredMissingAlertCopy,
  type RequiredMissingAlertCopy,
} from '@/shared/lib/required-missing-alert'
import {
  resolveEducationErrorAlert,
  resolveEducationPreviewErrorAlert,
} from '@/features/mypage/education/shared/lib/education-error-alert'
import { PaymentStatementPreConsentModal } from '@/features/mypage/education/settlements/ui/payment-statement-pre-consent-modal'
import { ReceiptGuardianGateModals } from '@/features/mypage/education/settlements/ui/receipt-guardian-gate-modals'
import { FeeCorrectionRequestModal } from '@/features/mypage/education/settlements/ui/fee-correction-request-modal'
import { RECEIPT_PRE_CONSENT_SUBMIT_BLOCKED_DESCRIPTION } from '@/features/mypage/education/settlements/lib/settlement-pre-consent-copy'
import styles from './page.module.css'

/** 화면이 준비된 뒤 한 번만 onSubmit을 부른다(StrictMode 이중 실행 방지) */
function SubmitOnMount({ onSubmit }: { onSubmit: () => void }) {
  const firedRef = useRef(false)
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  })
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    onSubmitRef.current()
  }, [])
  return null
}

function readRevisionNoParam(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function MypageEducationSettlementConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '', applicationType: applicationTypeParam } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId') ?? ''
  const viewMode = searchParams.get('mode') === 'view'
  const revisionNo = readRevisionNoParam(searchParams.get('revisionNo'))
  const remoteEnabled = isRemoteApiConfigured()
  const routeApplicationType =
    readSettlementRouteApplicationType(applicationTypeParam) ??
    readEducationApplicationTypeFromRoute(applicationTypeParam)
  const typeProbe = useProbeEducationApplicationType(applicationId, routeApplicationType)
  const applicationType = routeApplicationType ?? typeProbe.applicationType ?? 'INDIVIDUAL'
  const documentKind = resolveSettlementDocumentKind(applicationType)
  const area = resolveSettlementAreaFromPathname(location.pathname)
  const remoteQuery = useMyProgramApplicationDetail(
    remoteEnabled ? applicationType : null,
    remoteEnabled ? applicationId : null
  )
  const application = remoteQuery.application
  const programType = application?.programConfig?.programType ?? null
  /** 개인(INDIVIDUAL)·봉사자(VOLUNTEER) 일정별 영수증 정산. 대상이 아니면 null */
  const scheduleSettlementAudience = resolveScheduleSettlementAudience(applicationType, programType)
  const useIndividualSettlementApi = scheduleSettlementAudience != null
  const remoteSettlements = useApplicationSettlementsQuery(
    applicationType,
    applicationId,
    application?.programId ?? '',
    { programType }
  )
  const submitMutation = useSubmitIndividualSettlementMutation(
    applicationId,
    scheduleSettlementAudience ?? 'individual'
  )
  const instructorSubmitMutation = useSubmitInstructorSettlementMutation()
  const isInstructorSubmit = isInstructorPaymentStatementSubmit({
    applicationType,
    documentKind,
  })
  const profileQuery = usePortalProfileQuery({ enabled: !viewMode })
  const consentSidecarQuery = useSettlementConsentSidecar(viewMode ? null : documentKind)
  const receiptConsent = useReceiptPaymentStatementConsent({
    applicationId,
    area,
    applicationType,
    // 기획 B: 동의서 작성을 마치면 제출 화면으로 돌아온다(입력값은 sessionStorage draft로 유지)
    returnTo: buildSettlementConfirmPath({ applicationId, sessionId, area, applicationType }),
  })
  /** 영수증 사전 동의서 미작성 안내 팝업 (사전 가드·서버 RECEIPT_PRE_CONSENT_REQUIRED 공용) */
  const [receiptConsentModalOpen, setReceiptConsentModalOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('안내')
  const [alertMessage, setAlertMessage] = useState<ReactNode>('')
  const [requiredMissing, setRequiredMissing] = useState<RequiredMissingAlertCopy | null>(null)
  const [feeCorrectionOpen, setFeeCorrectionOpen] = useState(false)
  /** 작성 화면 [강사비 정정 요청하기] 팝업에서 넘어온 사유 — 준비되면 한 번만 제출한다 */
  const [pendingFeeCorrectionReason, setPendingFeeCorrectionReason] = useState<string | null>(() =>
    viewMode
      ? null
      : ((location.state as SettlementWriteDraftLocationState | null)?.feeCorrectionReason?.trim() || null),
  )
  /** 업무 안내 — 제목 「안내」, 시안 팝업 문구는 그 제목 */
  const openAlert = (message: ReactNode, title = '안내') => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertOpen(true)
  }
  /** 시안 「오류 제한 팝업」 — 네트워크·처리 제한·처리 실패(서버·코드별 안내는 설명에) */
  const openErrorAlert = (alert: { title: string; description: string }) => {
    openAlert(alert.description, alert.title)
  }

  const session = useMemo(() => {
    if (!remoteSettlements.enabled) return undefined
    return findAssignedSettlementItem(remoteSettlements.items, sessionId)
  }, [remoteSettlements.enabled, remoteSettlements.items, sessionId])

  const storedDraft = useMemo(() => {
    if (viewMode) return null
    const state = location.state as SettlementWriteDraftLocationState | null
    if (state?.draft && state.draft.meta.applicationId === applicationId) {
      return state.draft
    }
    if (!applicationId || !sessionId) return null
    return loadSettlementWriteDraft(applicationId, sessionId)
  }, [applicationId, location.state, sessionId, viewMode])

  const documentApiKind =
    documentKind === 'receipt' ? ('individual' as const) : ('instructor' as const)
  const documentId = session?.settlementApplicationId ?? null
  const documentQuery = useSettlementApplicationDocumentQuery({
    kind: documentApiKind,
    documentId,
    revisionNo,
    enabled: viewMode,
  })
  const refreshDocument = useCallback(() => documentQuery.refetch(), [documentQuery.refetch])

  const draft = useMemo(() => {
    if (viewMode) return null
    if (!storedDraft) return null
    return {
      ...storedDraft,
      basic: composeSettlementWriteBasic({
        kind: documentKind,
        member: readSettlementMemberProfileBasic(profileQuery.data),
        consent: consentSidecarQuery.sidecar,
      }),
      transport: {
        ...storedDraft.transport,
        autoPreview:
          documentKind === 'receipt'
            ? storedDraft.transport.autoPreview
            : (session?.instructorTransportPreview ?? storedDraft.transport.autoPreview ?? null),
      },
      meal: normalizeSettlementNamedExpense(storedDraft.meal),
      activity: normalizeSettlementNamedExpense(storedDraft.activity),
    }
  }, [
    consentSidecarQuery.sidecar,
    documentKind,
    profileQuery.data,
    session?.instructorTransportPreview,
    storedDraft,
    viewMode,
  ])

  /** 강사 최초 제출 전 — 작성 화면과 같은 미리보기(캐시 공유)의 canSubmit=false면 제출을 호출하지 않는다 */
  const instructorSettlementPreview = useInstructorSettlementPreviewQuery(
    isInstructorSubmit && !viewMode ? storedDraft?.meta.assignmentId : null
  )

  useEffect(() => {
    if (!applicationId || !sessionId) {
      navigate(buildSettlementTabPath(applicationId, area, applicationType), { replace: true })
      return
    }
    if (viewMode) {
      if (!remoteSettlements.isLoading && !session) {
        navigate(buildSettlementTabPath(applicationId, area, applicationType), { replace: true })
      }
      return
    }
    if (!storedDraft) {
      navigate(buildSettlementWritePath({ applicationId, sessionId, area, applicationType }), {
        replace: true,
      })
    }
  }, [
    applicationId,
    area,
    storedDraft,
    navigate,
    remoteSettlements.isLoading,
    session,
    sessionId,
    viewMode,
    applicationType,
  ])

  if (viewMode) {
    const handleClose = () => navigate(buildSettlementTabPath(applicationId, area, applicationType))
    if (!session || documentId == null) {
      if (remoteSettlements.isLoading) {
        return (
          <EducationSettlementApplicationDocumentOverlay
            open
            document={null}
            programTitle={application?.title}
            programType={programType}
            loading
            onClose={handleClose}
            onRefreshDocument={refreshDocument}
          />
        )
      }
      return null
    }

    // 시안 「미리보기 실패 시」 — 신청서를 못 불러오면 미리보기 대신 팝업, [확인] 시 목록으로
    if (!documentQuery.isLoading && !documentQuery.document) {
      const previewAlert = documentQuery.isError
        ? resolveEducationPreviewErrorAlert(documentQuery.error)
        : PLATFORM_ALERT_COPY.previewFailed
      return (
        <PFAlertModal
          open
          title={previewAlert.title}
          description={previewAlert.description}
          onConfirm={handleClose}
        />
      )
    }

    return (
      <EducationSettlementApplicationDocumentOverlay
        open
        document={documentQuery.document}
        programTitle={application?.title}
        programType={programType}
        loading={documentQuery.isLoading}
        refreshing={documentQuery.isFetching}
        onClose={handleClose}
        onRefreshDocument={refreshDocument}
      />
    )
  }

  if (!draft) {
    return null
  }

  const title =
    documentKind === 'receipt'
      ? '영수증 제출 전에\n정보가 맞는지 확인해 주세요.'
      : '지급조서 제출 전에\n정보가 맞는지 확인해 주세요.'
  const titleInnerClassName = `${styles.inner} ${styles.titleCentered}`

  if (remoteSettlements.individualDisabled) {
    return (
      <PFFormPage
        aria-label={title}
        className={styles.page}
        innerClassName={titleInnerClassName}
        title={title}
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE}
        </PFText>
      </PFFormPage>
    )
  }

  if (consentSidecarQuery.isLoading || profileQuery.isPending) {
    return (
      <PFFormPage
        aria-label={title}
        className={styles.page}
        innerClassName={titleInnerClassName}
        title={title}
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          기본 정보를 불러오는 중입니다.
        </PFText>
      </PFFormPage>
    )
  }

  const handleComplete = (feeCorrectionReason?: string) => {
    if (remoteSettlements.individualDisabled) {
      openAlert(INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE)
      return
    }
    if (consentSidecarQuery.isLoading || profileQuery.isPending) {
      return
    }
    if (documentKind === 'receipt' && receiptConsent.isConsentLoading) {
      return
    }
    if (documentKind === 'receipt' && !receiptConsent.isConsentSubmitted) {
      setReceiptConsentModalOpen(true)
      return
    }
    if (!isInstructorSubmit && !useIndividualSettlementApi) {
      openAlert(
        documentKind === 'receipt'
          ? '이 신청 유형에서는 일정별 정산을 제출할 수 없습니다.'
          : '이 신청 유형에서는 지급조서를 제출할 수 없습니다.'
      )
      return
    }
    if (submitMutation.isPending || instructorSubmitMutation.isPending) return
    const missingScheduleMessage =
      documentKind === 'receipt'
        ? '영수증 제출에 필요한 일정 정보가 없습니다. 작성 화면으로 돌아가 다시 시도해 주세요.'
        : '지급조서 제출에 필요한 일정 정보가 없습니다. 작성 화면으로 돌아가 다시 시도해 주세요.'
    try {
      const settlementApplicationId = draft.meta.settlementApplicationId
      const writeValidationError = validateSettlementWriteDraft(draft)
      if (writeValidationError === 'required_incomplete') {
        // 시안 「필수 항목 미입력 (항목명 노출)」 — 항목명을 모르면 시안 기본 설명
        const missingLabels = collectSettlementWriteRequiredMissingLabels(draft)
        if (missingLabels.length > 0) {
          setRequiredMissing(buildRequiredMissingAlertCopy({ kind: 'field', labels: missingLabels }))
        } else {
          openAlert(<PFRequiredFieldsIncompleteDescription />, PLATFORM_REQUIRED_NOT_FILLED_TITLE)
        }
        return
      }
      if (writeValidationError) {
        const validationAlert = resolveSettlementWriteValidationAlert(writeValidationError, documentKind)
        openAlert(validationAlert.description, validationAlert.title)
        return
      }
      const exceededInstructorLimit = isInstructorSubmit
        ? findExceededInstructorExpenseLimit(draft)
        : null
      if (exceededInstructorLimit != null) {
        openAlert(instructorPaymentItemLimitMessage(exceededInstructorLimit))
        return
      }
      const exceededLimitWon = findExceededReceiptItemLimit(draft)
      if (exceededLimitWon != null) {
        openAlert(paymentItemLimitExceededMessage(exceededLimitWon))
        return
      }
      if (isInstructorSubmit) {
        const resubmit =
          draft.meta.resubmit === true && settlementApplicationId != null
            ? {
                ...buildInstructorSettlementResubmitRequest(draft),
                ...(feeCorrectionReason ? { correctionRequestReason: feeCorrectionReason } : {}),
              }
            : undefined
        // 지급 항목 0건 등 미리보기 차단 — 빈 항목 제출은 서버 오류가 날 수 있어 FE에서 막는다(BE 409 작업 전)
        if (!resubmit && instructorSettlementPreview.submitBlock) {
          openAlert(instructorSettlementPreview.submitBlock.message)
          return
        }
        const create = resubmit
          ? undefined
          : {
              ...buildInstructorSettlementCreateRequest(draft),
              ...(feeCorrectionReason ? { correctionRequestReason: feeCorrectionReason } : {}),
            }
        void instructorSubmitMutation
          .mutateAsync({
            settlementApplicationId,
            create,
            resubmit,
          })
          .then(() => {
            clearSettlementWriteDraft(applicationId, sessionId)
            navigate(buildSettlementTabPath(applicationId, area, applicationType))
          })
          .catch(error => {
            if (isPaymentStatementConsentRequiredError(error)) {
              openAlert(PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE)
              return
            }
            // 강사 식사비·활동비 한도 초과(400) — 강사 문구 "신청은 최대 N원까지만 가능합니다." (K14)
            if (readInstructorSettlementErrorCode(error) === PAYMENT_ITEM_LIMIT_EXCEEDED_CODE) {
              const limitMessage = instructorPaymentItemLimitExceededAlert(draft)
              if (limitMessage) {
                openAlert(limitMessage)
                return
              }
            }
            openErrorAlert(
              resolveEducationErrorAlert(error, (target, fallback) =>
                instructorSettlementApiErrorMessage(
                  target,
                  getProgramApplicationApiErrorMessage(target, fallback),
                ),
              ),
            )
          })
        return
      }
      const resubmit =
        draft.meta.resubmit === true &&
        settlementApplicationId != null &&
        draft.meta.currentRevisionNo != null
          ? buildIndividualSettlementResubmitRequest(draft)
          : undefined
      const submit = resubmit ? undefined : buildIndividualSettlementSubmitRequest(draft)
      void submitMutation
        .mutateAsync({
          settlementApplicationId,
          submit,
          resubmit,
        })
        .then(() => {
          clearSettlementWriteDraft(applicationId, sessionId)
          navigate(buildSettlementTabPath(applicationId, area, applicationType))
        })
        .catch(error => {
          if (documentKind === 'receipt' && isReceiptPreConsentRequiredError(error)) {
            setReceiptConsentModalOpen(true)
            return
          }
          if (readIndividualSettlementErrorCode(error) === PAYMENT_ITEM_LIMIT_EXCEEDED_CODE) {
            const limitWon = findExceededReceiptItemLimit(draft)
            if (limitWon != null) {
              openAlert(paymentItemLimitExceededMessage(limitWon))
              return
            }
          }
          openErrorAlert(
            resolveEducationErrorAlert(error, (target, fallback) =>
              individualSettlementApiErrorMessage(
                target,
                getProgramApplicationApiErrorMessage(target, fallback),
                scheduleSettlementAudience ?? 'individual',
              ),
            ),
          )
        })
    } catch {
      openAlert(missingScheduleMessage)
    }
  }

  const handleBack = () => {
    navigate(buildSettlementWritePath({ applicationId, sessionId, area, applicationType }), {
      state: { draft },
    })
  }

  /** 강사 지급조서 — 최초 제출·반려 후 재제출 모두 정정 요청을 함께 보낼 수 있다 */
  const feeCorrectionAvailable = isInstructorSubmit

  return (
    <PFFormPage
      aria-label={documentKind === 'receipt' ? '영수증 신청 내용 확인' : '지급조서 신청 내용 확인'}
      className={styles.page}
      innerClassName={titleInnerClassName}
      title={title}
    >
      <EducationSettlementConfirmView
        draft={draft}
        programTitle={application?.title}
        session={session}
        submitting={submitMutation.isPending || instructorSubmitMutation.isPending}
        readOnly={false}
        onComplete={() => handleComplete()}
        onRequestFeeCorrection={feeCorrectionAvailable ? () => setFeeCorrectionOpen(true) : undefined}
        onBack={handleBack}
      />
      {pendingFeeCorrectionReason && !remoteSettlements.isLoading ? (
        <SubmitOnMount
          onSubmit={() => {
            const reason = pendingFeeCorrectionReason
            setPendingFeeCorrectionReason(null)
            // 새로고침·뒤로가기로 다시 제출되지 않게 사유를 기록에서 지운다
            navigate(`${location.pathname}${location.search}`, {
              replace: true,
              state: { draft: storedDraft },
            })
            handleComplete(reason)
          }}
        />
      ) : null}
      <FeeCorrectionRequestModal
        open={feeCorrectionOpen}
        onCancel={() => setFeeCorrectionOpen(false)}
        onSubmit={reason => {
          setFeeCorrectionOpen(false)
          handleComplete(reason)
        }}
      />
      {documentKind === 'receipt' ? (
        <>
          <PaymentStatementPreConsentModal
            open={receiptConsentModalOpen && receiptConsent.minorGuardian.step == null}
            variant="receipt"
            description={RECEIPT_PRE_CONSENT_SUBMIT_BLOCKED_DESCRIPTION}
            onCancel={() => setReceiptConsentModalOpen(false)}
            onWriteConsent={() => {
              setReceiptConsentModalOpen(false)
              receiptConsent.goToConsents()
            }}
          />
          <ReceiptGuardianGateModals flow={receiptConsent.minorGuardian} />
        </>
      ) : null}
      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
        description={alertMessage}
        onConfirm={() => {
          setAlertOpen(false)
          if (alertMessage === PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE) {
            navigate(
              buildSettlementPaymentConsentPath({
                applicationId,
                mode: 'write',
                area,
                applicationType,
              }),
            )
          }
        }}
      />
      <PFRequiredMissingAlert copy={requiredMissing} onConfirm={() => setRequiredMissing(null)} />
    </PFFormPage>
  )
}
