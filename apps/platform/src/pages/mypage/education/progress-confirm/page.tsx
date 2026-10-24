import { useNavigate, useParams } from 'react-router-dom'
import { ProgramBackButton, useProgramDetail } from '@/features/program'
import { educationInstitutionGuidanceApplicationTabPath } from '@/features/mypage/education/applications/lib/guidance-path'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { hasTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import { shouldUseUjatApplicationContent } from '@/features/mypage/education/applications/lib/ujat-portal-banner'
import { UjatProgressConfirmForm } from '@/features/mypage/education/applications/ui/ujat-progress-confirm-form'
import { UjatRevisionNotice } from '@/features/mypage/education/applications/ui/ujat-revision-notice'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PFFormPage, PFLoadingSpinner, PFText } from '@/shared/ui'

export function MypageEducationUjatProgressConfirmPage() {
  const navigate = useNavigate()
  const { applicationId = '', applicationType: applicationTypeParam } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const member = useMypageMember()
  const isTeacher = hasTeacherMypageProfile(member.profile)
  const remoteEnabled = isRemoteApiConfigured()
  const routeApplicationType = readEducationApplicationTypeFromRoute(applicationTypeParam)
  const typeProbe = useProbeEducationApplicationType(applicationId, routeApplicationType)
  const applicationType =
    routeApplicationType ?? typeProbe.applicationType ?? 'ORGANIZATION'
  const remoteQuery = useMyProgramApplicationDetail(
    remoteEnabled ? applicationType : null,
    remoteEnabled ? applicationId : null,
  )
  const application = remoteEnabled ? remoteQuery.application : undefined
  const program = useProgramDetail(application?.programId ?? '').program
  const detailCase = application?.detailCase ?? program?.detailCase
  const isUjat = shouldUseUjatApplicationContent(detailCase)
  const isRevision = application?.ujatPortalBannerState === 'REVISION_REQUIRED'
  const pageTitle = isRevision ? '교육 진행 정보 수정하기' : '교육 진행 정보 확인하기'
  const backPath = educationInstitutionGuidanceApplicationTabPath(
    applicationId,
    application?.applicationType ?? applicationType,
  )

  if (member.isLoading || remoteQuery.isLoading || typeProbe.isProbing) {
    return (
      <PFFormPage
        aria-label={pageTitle}
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title={pageTitle}
      >
        <PFLoadingSpinner centered label="교육 진행 정보를 불러오는 중" />
      </PFFormPage>
    )
  }

  if (!isTeacher || !isUjat || !application) {
    return (
      <PFFormPage
        aria-label={pageTitle}
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title={pageTitle}
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          교육 진행 정보를 확인할 수 없습니다.
        </PFText>
      </PFFormPage>
    )
  }

  return (
    <PFFormPage
      aria-label={pageTitle}
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title={pageTitle}
      step="1 / 2"
      programSummary={
        isRevision
          ? undefined
          : {
              title: program?.title ?? '',
              period: program?.applicationPeriodLabel,
            }
      }
    >
      {isRevision ? <UjatRevisionNotice reason={application.ujatRevisionReason} /> : null}
      <UjatProgressConfirmForm
        applicationId={applicationId}
        applicationType={applicationType}
        programId={application.programId}
        formBindingId={application.formBindingId}
        answers={application.applicationAnswers}
        isRevision={isRevision}
        temporarySchedule={application.ujatTemporarySchedule}
        assignmentRevision={application.ujatAssignmentRevision}
      />
    </PFFormPage>
  )
}
