import { useMemo } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  buildSettlementTabPath,
  EducationSettlementWriteForm,
  resolveSettlementAreaFromPathname,
  resolveSettlementDocumentKind,
} from '@/features/mypage/education/settlements'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import { useApplicationSettlementsQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import { educationApplicationDetailPath } from '@/features/mypage'
import { INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE } from '@/features/mypage/education/settlements/lib/individual-settlement-contract'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
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

  const session = useMemo(() => {
    if (!remoteSettlements.enabled) return undefined
    return remoteSettlements.items.find(item => item.id === sessionId)
  }, [remoteSettlements.enabled, remoteSettlements.items, sessionId])

  const title = documentKind === 'receipt' ? '영수증 제출하기' : '지급조서 작성하기'
  const backPath = applicationId
    ? buildSettlementTabPath(applicationId, area)
    : educationApplicationDetailPath(applicationId)

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
      />
    </PFFormPage>
  )
}
