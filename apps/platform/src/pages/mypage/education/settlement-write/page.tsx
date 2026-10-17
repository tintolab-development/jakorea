import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProgramBackButton } from '@/features/program'
import {
  buildSettlementTabPath,
  EducationSettlementWriteForm,
} from '@/features/mypage/education/settlements'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import { useApplicationSettlementsQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import { educationApplicationDetailPath } from '@/features/mypage'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PFFormPage, PFText } from '@/shared/ui'

export function MypageEducationSettlementWritePage() {
  const navigate = useNavigate()
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

  const backPath = applicationId
    ? buildSettlementTabPath(applicationId)
    : educationApplicationDetailPath(applicationId)

  if (!remoteEnabled) {
    return (
      <PFFormPage aria-label="지급조서 작성하기" title="지급조서 작성하기">
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          API가 설정되지 않아 지급조서를 작성할 수 없습니다.
        </PFText>
      </PFFormPage>
    )
  }

  return (
    <PFFormPage
      aria-label="지급조서 작성하기"
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title="지급조서 작성하기"
    >
      <EducationSettlementWriteForm
        applicationId={applicationId}
        sessionId={sessionId}
        programTitle={application?.title}
        session={session}
      />
    </PFFormPage>
  )
}
