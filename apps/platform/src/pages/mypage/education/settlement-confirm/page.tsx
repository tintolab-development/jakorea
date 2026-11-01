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
} from '@/features/mypage/education/settlements'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import {
  useApplicationSettlementsQuery,
  useSubmitIndividualSettlementMutation,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { overlaySettlementBasicWithPaymentConsent } from '@/features/mypage/education/settlements/lib/map-payment-statement-basic-info'
import { usePaymentStatementConsentBasicInfo } from '@/features/mypage/education/settlements/hooks/use-payment-statement-consent-basic-info'
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
  shouldUseIndividualSettlementSchedulesApi,
} from '@/features/mypage/education/settlements/lib/individual-settlement-contract'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PFAlertModal, PFFormPage, PFText } from '@/shared/ui'
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
    remoteEnabled ? applicationId : null,
  )
  const application = remoteQuery.application
  const programType = application?.programConfig?.programType ?? null
  const useIndividualSettlementApi = shouldUseIndividualSettlementSchedulesApi(
    applicationType,
    programType,
  )
  const remoteSettlements = useApplicationSettlementsQuery(
    applicationType,
    applicationId,
    application?.programId ?? '',
    { programType },
  )
  const submitMutation = useSubmitIndividualSettlementMutation(applicationId)
  const consentBasicQuery = usePaymentStatementConsentBasicInfo(!viewMode)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const session = useMemo(() => {
    if (!remoteSettlements.enabled) return undefined
    return remoteSettlements.items.find(item => item.id === sessionId)
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
      basic: overlaySettlementBasicWithPaymentConsent(storedDraft.basic, consentBasicQuery.basic),
    }
  }, [consentBasicQuery.basic, storedDraft, viewMode])

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
    if (!draft) {
      navigate(
        buildSettlementWritePath({ applicationId, sessionId, area, applicationType }),
        { replace: true },
      )
    }
  }, [
    applicationId,
    area,
    draft,
    navigate,
    remoteSettlements.isLoading,
    session,
    sessionId,
    viewMode,
    applicationType,
  ])

  if (viewMode) {
    const handleClose = () =>
      navigate(buildSettlementTabPath(applicationId, area, applicationType))
    if (!session || documentId == null) {
      if (remoteSettlements.isLoading) {
        return (
          <EducationSettlementApplicationDocumentOverlay
            open
            document={null}
            programTitle={application?.title}
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
      ? '영수증 제출 전에 정보가 맞는지 확인해 주세요.'
      : '지급조서 신청 전에 정보가 맞는지 확인해 주세요.'
  const titleInnerClassName =
    documentKind === 'receipt' ? `${styles.inner} ${styles.titleCentered}` : styles.inner

  if (remoteSettlements.individualDisabled) {
    return (
      <PFFormPage aria-label={title} className={styles.page} innerClassName={titleInnerClassName} title={title}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE}
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
    if (!useIndividualSettlementApi) {
      setAlertMessage(
        documentKind === 'receipt'
          ? '이 신청 유형에서는 일정별 정산을 제출할 수 없습니다.'
          : '이 신청 유형에서는 지급조서를 제출할 수 없습니다.',
      )
      setAlertOpen(true)
      return
    }
    if (submitMutation.isPending) return
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
          setAlertMessage(
            individualSettlementApiErrorMessage(
              error,
              getProgramApplicationApiErrorMessage(error, submitFailedMessage),
            ),
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
        submitting={submitMutation.isPending}
        readOnly={false}
        onComplete={handleComplete}
        onBack={handleBack}
      />
      <PFAlertModal
        open={alertOpen}
        title="안내"
        description={alertMessage}
        onConfirm={() => setAlertOpen(false)}
      />
    </PFFormPage>
  )
}
