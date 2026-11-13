import { useCallback, useEffect, useMemo, useState } from 'react'
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
  getSettlementApplicationDocumentErrorMessage,
  SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE,
} from '@/features/mypage/education/settlements/lib/application-document-errors'
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
import { PFAlertModal, PFFormPage, PFText } from '@/shared/ui'
import { PaymentStatementPreConsentModal } from '@/features/mypage/education/settlements/ui/payment-statement-pre-consent-modal'
import { ReceiptGuardianGateModals } from '@/features/mypage/education/settlements/ui/receipt-guardian-gate-modals'
import { RECEIPT_PRE_CONSENT_SUBMIT_BLOCKED_DESCRIPTION } from '@/features/mypage/education/settlements/lib/settlement-pre-consent-copy'
import styles from './page.module.css'

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
  const [alertMessage, setAlertMessage] = useState('')

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

    const documentError = documentQuery.isLoading
      ? ''
      : documentQuery.document
        ? ''
        : documentQuery.isError
          ? getSettlementApplicationDocumentErrorMessage(documentQuery.error)
          : SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE

    return (
      <EducationSettlementApplicationDocumentOverlay
        open
        document={documentQuery.document}
        programTitle={application?.title}
        programType={programType}
        loading={documentQuery.isLoading}
        error={documentError}
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

  const handleComplete = () => {
    if (remoteSettlements.individualDisabled) {
      setAlertMessage(INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE)
      setAlertOpen(true)
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
      setAlertMessage(
        documentKind === 'receipt'
          ? '이 신청 유형에서는 일정별 정산을 제출할 수 없습니다.'
          : '이 신청 유형에서는 지급조서를 제출할 수 없습니다.'
      )
      setAlertOpen(true)
      return
    }
    if (submitMutation.isPending || instructorSubmitMutation.isPending) return
    const submitFailedMessage =
      documentKind === 'receipt'
        ? '영수증 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.'
        : '지급조서 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.'
    const missingScheduleMessage =
      documentKind === 'receipt'
        ? '영수증 제출에 필요한 일정 정보가 없습니다. 작성 화면으로 돌아가 다시 시도해 주세요.'
        : '지급조서 제출에 필요한 일정 정보가 없습니다. 작성 화면으로 돌아가 다시 시도해 주세요.'
    try {
      const settlementApplicationId = draft.meta.settlementApplicationId
      const writeValidationError = validateSettlementWriteDraft(draft)
      if (writeValidationError) {
        setAlertMessage(
          resolveSettlementWriteValidationAlert(writeValidationError, documentKind).description
        )
        setAlertOpen(true)
        return
      }
      const exceededInstructorLimit = isInstructorSubmit
        ? findExceededInstructorExpenseLimit(draft)
        : null
      if (exceededInstructorLimit != null) {
        setAlertMessage(instructorPaymentItemLimitMessage(exceededInstructorLimit))
        setAlertOpen(true)
        return
      }
      const exceededLimitWon = findExceededReceiptItemLimit(draft)
      if (exceededLimitWon != null) {
        setAlertMessage(paymentItemLimitExceededMessage(exceededLimitWon))
        setAlertOpen(true)
        return
      }
      if (isInstructorSubmit) {
        const resubmit =
          draft.meta.resubmit === true && settlementApplicationId != null
            ? buildInstructorSettlementResubmitRequest(draft)
            : undefined
        // 지급 항목 0건 등 미리보기 차단 — 빈 항목 제출은 서버 오류가 날 수 있어 FE에서 막는다(BE 409 작업 전)
        if (!resubmit && instructorSettlementPreview.submitBlock) {
          setAlertMessage(instructorSettlementPreview.submitBlock.message)
          setAlertOpen(true)
          return
        }
        const create = resubmit ? undefined : buildInstructorSettlementCreateRequest(draft)
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
              setAlertMessage(PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE)
              setAlertOpen(true)
              return
            }
            // 강사 식사비·활동비 한도 초과(400) — 강사 문구 "신청은 최대 N원까지만 가능합니다." (K14)
            if (readInstructorSettlementErrorCode(error) === PAYMENT_ITEM_LIMIT_EXCEEDED_CODE) {
              const limitMessage = instructorPaymentItemLimitExceededAlert(draft)
              if (limitMessage) {
                setAlertMessage(limitMessage)
                setAlertOpen(true)
                return
              }
            }
            setAlertMessage(
              instructorSettlementApiErrorMessage(
                error,
                getProgramApplicationApiErrorMessage(error, submitFailedMessage)
              )
            )
            setAlertOpen(true)
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
              setAlertMessage(paymentItemLimitExceededMessage(limitWon))
              setAlertOpen(true)
              return
            }
          }
          setAlertMessage(
            individualSettlementApiErrorMessage(
              error,
              getProgramApplicationApiErrorMessage(error, submitFailedMessage),
              scheduleSettlementAudience ?? 'individual'
            )
          )
          setAlertOpen(true)
        })
    } catch {
      setAlertMessage(missingScheduleMessage)
      setAlertOpen(true)
    }
  }

  const handleBack = () => {
    navigate(buildSettlementWritePath({ applicationId, sessionId, area, applicationType }), {
      state: { draft },
    })
  }

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
        onComplete={handleComplete}
        onBack={handleBack}
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
        title="안내"
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
    </PFFormPage>
  )
}
