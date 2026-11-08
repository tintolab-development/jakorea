import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  buildSettlementTabPath,
  EducationSettlementWriteForm,
  readSettlementRouteApplicationType,
  resolveSettlementAreaFromPathname,
  resolveSettlementDocumentKind,
} from '@/features/mypage/education/settlements'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import { useApplicationSettlementsQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import { findAssignedSettlementItem } from '@/features/mypage/education/settlements/lib/assigned-settlement-items'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import { educationApplicationDetailPath } from '@/features/mypage'
import { INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE } from '@/features/mypage/education/settlements/lib/individual-settlement-contract'
import {
  isLectureReportSettlementReturn,
  lectureReportCompleteTabPath,
} from '@/features/mypage/education/schedules/lib/lecture-report-complete-navigation'
import { useSettlementPreConsent } from '@/features/mypage/education/settlements/hooks/use-receipt-payment-statement-consent'
import { PaymentStatementPreConsentModal } from '@/features/mypage/education/settlements/ui/payment-statement-pre-consent-modal'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { isGeminiSettlementProgram } from '@/features/mypage/education/settlements/lib/payment-statement-status'
import { PFFormPage, PFText } from '@/shared/ui'

export function MypageEducationSettlementWritePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '', applicationType: applicationTypeParam } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId') ?? ''
  const returnToLectureReport = isLectureReportSettlementReturn(searchParams.get('returnTo'))
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
  const hideGeminiPaymentStatementWrite =
    documentKind === 'payment_statement' &&
    isGeminiSettlementProgram({
      programType,
      detailCase: application?.detailCase,
    })
  const remoteSettlements = useApplicationSettlementsQuery(
    applicationType,
    applicationId,
    application?.programId ?? '',
    { programType },
  )

  const session = useMemo(() => {
    if (!remoteSettlements.enabled) return undefined
    return findAssignedSettlementItem(remoteSettlements.items, sessionId)
  }, [remoteSettlements.enabled, remoteSettlements.items, sessionId])

  const title = documentKind === 'receipt' ? '영수증 제출하기' : '지급조서 작성하기'
  const preConsent = useSettlementPreConsent({
    documentKind,
    applicationId,
    area,
    applicationType,
  })
  const blockedPreConsentWrite =
    !preConsent.isConsentLoading && !preConsent.isConsentSubmitted
  const lectureReportListPath = applicationId
    ? lectureReportCompleteTabPath(applicationId)
    : ''
  const backPath = returnToLectureReport && lectureReportListPath
    ? lectureReportListPath
    : applicationId
      ? buildSettlementTabPath(applicationId, area, applicationType)
      : educationApplicationDetailPath(applicationId)

  useEffect(() => {
    if (!hideGeminiPaymentStatementWrite) return
    navigate(backPath, { replace: true })
  }, [backPath, hideGeminiPaymentStatementWrite, navigate])

  if (hideGeminiPaymentStatementWrite) {
    return null
  }

  if (!remoteEnabled) {
    return (
      <PFFormPage aria-label={title} title={title}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          API가 설정되지 않아 {documentKind === 'receipt' ? '영수증을' : '지급조서를'} 작성할 수 없습니다.
        </PFText>
      </PFFormPage>
    )
  }

  if (remoteSettlements.individualDisabled) {
    return (
      <PFFormPage aria-label={title} title={title}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE}
        </PFText>
      </PFFormPage>
    )
  }

  if (preConsent.isConsentLoading) {
    return (
      <PFFormPage
        aria-label={title}
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title={title}
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          동의 정보를 확인하는 중입니다.
        </PFText>
      </PFFormPage>
    )
  }

  if (blockedPreConsentWrite) {
    return (
      <>
        <PFFormPage
          aria-label={title}
          back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
          title={title}
        >
          {null}
        </PFFormPage>
        <PaymentStatementPreConsentModal
          open
          variant={documentKind}
          cancelLabel={returnToLectureReport ? '나중에 하기' : '취소'}
          onCancel={() =>
            navigate(backPath, returnToLectureReport ? { replace: true } : undefined)
          }
          onWriteConsent={preConsent.goToConsents}
        />
      </>
    )
  }

  return (
    <PFFormPage
      aria-label={title}
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title={title}
    >
      <EducationSettlementWriteForm
        applicationId={applicationId}
        sessionId={sessionId}
        programTitle={application?.title}
        session={session}
        documentKind={documentKind}
        applicationType={applicationType}
        programType={programType}
      />
    </PFFormPage>
  )
}
