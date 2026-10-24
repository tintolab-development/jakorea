import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  buildSettlementTabPath,
  buildSettlementWritePath,
  clearSettlementWriteDraft,
  EducationSettlementConfirmView,
  loadSettlementWriteDraft,
  resolveSettlementAreaFromPathname,
  resolveSettlementDocumentKind,
  type SettlementWriteDraftLocationState,
} from '@/features/mypage/education/settlements'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import {
  useApplicationSettlementsQuery,
  useIndividualSettlementDetailQuery,
  useSubmitIndividualSettlementMutation,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { mapIndividualSettlementDetailToDraft } from '@/features/mypage/education/settlements/lib/map-individual-settlement-detail'
import { overlaySettlementBasicWithPaymentConsent } from '@/features/mypage/education/settlements/lib/map-payment-statement-basic-info'
import { usePaymentStatementConsentBasicInfo } from '@/features/mypage/education/settlements/hooks/use-payment-statement-consent-basic-info'
import { useInstructorApplyLockedBasic } from '@/features/mypage/instructor-apply'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import {
  buildIndividualSettlementResubmitRequest,
  buildIndividualSettlementSubmitRequest,
} from '@/features/mypage/education/settlements/lib/build-individual-settlement-submit'
import {
  INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE,
  individualSettlementApiErrorMessage,
  isIndividualScheduleSettlementAudience,
} from '@/features/mypage/education/settlements/lib/individual-settlement-contract'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PFAlertModal, PFFormPage, PFText } from '@/shared/ui'
import styles from './page.module.css'

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
  const remoteEnabled = isRemoteApiConfigured()
  const routeApplicationType = readEducationApplicationTypeFromRoute(applicationTypeParam)
  const typeProbe = useProbeEducationApplicationType(applicationId, routeApplicationType)
  const applicationType = routeApplicationType ?? typeProbe.applicationType ?? 'INDIVIDUAL'
  const documentKind = resolveSettlementDocumentKind(applicationType)
  const area = resolveSettlementAreaFromPathname(location.pathname)
  const remoteQuery = useMyProgramApplicationDetail(
    remoteEnabled ? applicationType : null,
    remoteEnabled ? applicationId : null,
  )
  const application = remoteQuery.application
  const remoteSettlements = useApplicationSettlementsQuery(
    applicationType,
    applicationId,
    application?.programId ?? '',
  )
  const submitMutation = useSubmitIndividualSettlementMutation(applicationId)
  const { lockedBasic } = useInstructorApplyLockedBasic()
  const consentBasicQuery = usePaymentStatementConsentBasicInfo(documentKind === 'receipt')
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const session = useMemo(() => {
    if (!remoteSettlements.enabled) return undefined
    return remoteSettlements.items.find(item => item.id === sessionId)
  }, [remoteSettlements.enabled, remoteSettlements.items, sessionId])

  const storedDraft = useMemo(() => {
    const state = location.state as SettlementWriteDraftLocationState | null
    if (state?.draft && state.draft.meta.applicationId === applicationId) {
      return state.draft
    }
    if (!applicationId || !sessionId) return null
    return loadSettlementWriteDraft(applicationId, sessionId)
  }, [applicationId, location.state, sessionId])
  const detailQuery = useIndividualSettlementDetailQuery(
    viewMode || storedDraft == null ? session?.settlementApplicationId : null,
  )
  const draft = useMemo(() => {
    const mapped =
      storedDraft ??
      (viewMode && detailQuery.detail
        ? mapIndividualSettlementDetailToDraft({
            detail: detailQuery.detail,
            applicationId,
            name: lockedBasic.name,
            homeAddress: lockedBasic.homeAddress,
            homeAddressDetail: lockedBasic.homeAddressDetail,
          })
        : null)
    if (!mapped || documentKind !== 'receipt') return mapped
    return {
      ...mapped,
      basic: overlaySettlementBasicWithPaymentConsent(mapped.basic, consentBasicQuery.basic),
    }
  }, [
    applicationId,
    consentBasicQuery.basic,
    detailQuery.detail,
    documentKind,
    lockedBasic.homeAddress,
    lockedBasic.homeAddressDetail,
    lockedBasic.name,
    storedDraft,
    viewMode,
  ])

  useEffect(() => {
    if (!applicationId || !sessionId) {
      navigate(buildSettlementTabPath(applicationId, area), { replace: true })
      return
    }
    if (!draft && !viewMode) {
      navigate(buildSettlementWritePath({ applicationId, sessionId, area }), { replace: true })
      return
    }
    if (
      viewMode &&
      !storedDraft &&
      !remoteSettlements.isLoading &&
      session?.settlementApplicationId == null
    ) {
      navigate(buildSettlementTabPath(applicationId, area), { replace: true })
    }
  }, [
    applicationId,
    area,
    draft,
    navigate,
    remoteSettlements.isLoading,
    session?.settlementApplicationId,
    sessionId,
    storedDraft,
    viewMode,
  ])

  if (!draft) {
    return null
  }

  const title =
    documentKind === 'receipt'
      ? '영수증 제출 전에 정보가 맞는지 확인해 주세요.'
      : '지급조서 신청 전에 정보가 맞는지 확인해 주세요.'

  if (remoteSettlements.individualDisabled) {
    return (
      <PFFormPage aria-label={title} className={styles.page} innerClassName={styles.inner} title={title}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE}
        </PFText>
      </PFFormPage>
    )
  }

  const handleComplete = () => {
    if (documentKind !== 'receipt') {
      clearSettlementWriteDraft(applicationId, sessionId)
      navigate(buildSettlementTabPath(applicationId, area))
      return
    }
    if (remoteSettlements.individualDisabled) {
      setAlertMessage(INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE)
      setAlertOpen(true)
      return
    }
    if (!isIndividualScheduleSettlementAudience(applicationType)) {
      setAlertMessage('이 신청 유형에서는 일정별 정산을 제출할 수 없습니다.')
      setAlertOpen(true)
      return
    }
    if (submitMutation.isPending) return
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
          navigate(buildSettlementTabPath(applicationId, area))
        })
        .catch(error => {
          setAlertMessage(
            individualSettlementApiErrorMessage(
              error,
              getProgramApplicationApiErrorMessage(
                error,
                '영수증 제출에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
              ),
            ),
          )
          setAlertOpen(true)
        })
    } catch {
      setAlertMessage('영수증 제출에 필요한 일정 정보가 없습니다. 작성 화면으로 돌아가 다시 시도해 주세요.')
      setAlertOpen(true)
    }
  }

  const handleBack = () => {
    if (viewMode) {
      navigate(buildSettlementTabPath(applicationId, area))
      return
    }
    navigate(buildSettlementWritePath({ applicationId, sessionId, area }), {
      state: { draft },
    })
  }

  return (
    <PFFormPage
      aria-label={documentKind === 'receipt' ? '영수증 신청 내용 확인' : '지급조서 신청 내용 확인'}
      className={styles.page}
      innerClassName={styles.inner}
      title={title}
    >
      <EducationSettlementConfirmView
        draft={draft}
        programTitle={application?.title}
        session={session}
        submitting={submitMutation.isPending}
        readOnly={viewMode}
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
