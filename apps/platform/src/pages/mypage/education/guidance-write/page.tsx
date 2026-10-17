import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgramBackButton, useProgramDetail } from '@/features/program'
import {
  EducationInstitutionGuidanceWriteForm,
  resolveTeacherInstitutionGuidanceInitialState,
} from '@/features/mypage/education/applications/ui/institution-guidance-write-form'
import { educationInstitutionGuidanceApplicationTabPath } from '@/features/mypage/education/applications/lib/guidance-path'
import {
  mapInstitutionGuidanceFromApplicationAnswers,
  teacherInstitutionGuidanceFormStateFromTeacherContent,
} from '@/features/mypage/education/applications/lib/institution-guidance-from-answers'
import {
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
} from '@/features/mypage/education/applications'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { hasTeacherMypageProfile } from '@/features/mypage/lib/member-profile'
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { PFFormPage, PFText } from '@/shared/ui'

export function MypageEducationInstitutionGuidanceWritePage() {
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
  const programId = application?.programId ?? ''
  const programQuery = useProgramDetail(programId)
  const program = programQuery.program

  const guidanceDetailCase = program?.detailCase ?? application?.detailCase

  const initialState = useMemo(() => {
    if (!application) {
      return mapInstitutionGuidanceFromApplicationAnswers(undefined, guidanceDetailCase)
    }
    const answers = application.applicationAnswers
    if (answers && Object.keys(answers).length > 0) {
      return mapInstitutionGuidanceFromApplicationAnswers(answers, guidanceDetailCase)
    }
    if (application.teacherApplicationContent) {
      return teacherInstitutionGuidanceFormStateFromTeacherContent(
        application.teacherApplicationContent.guidance,
      )
    }
    return mapInstitutionGuidanceFromApplicationAnswers(undefined, guidanceDetailCase)
  }, [application, guidanceDetailCase])

  const backPath = educationInstitutionGuidanceApplicationTabPath(
    applicationId,
    application?.applicationType ?? applicationType,
  )
  const pageTitle = '안내사항 수정하기'

  if (!isTeacher) {
    return (
      <PFFormPage
        aria-label="안내사항"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          교사 회원만 안내사항을 작성할 수 있습니다.
        </PFText>
      </PFFormPage>
    )
  }

  if (!application || program?.programAudience !== 'organization') {
    return (
      <PFFormPage
        aria-label="안내사항"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          신청 정보를 찾을 수 없거나 기관 프로그램이 아닙니다.
        </PFText>
      </PFFormPage>
    )
  }

  const resolvedInitial = resolveTeacherInstitutionGuidanceInitialState(applicationId, initialState)

  return (
    <PFFormPage
      aria-label={pageTitle}
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title={pageTitle}
    >
      <EducationInstitutionGuidanceWriteForm
        applicationId={applicationId}
        applicationType={applicationType}
        detailCase={guidanceDetailCase}
        initialState={resolvedInitial}
        portalPatchContext={{
          formResponseId: application.formResponseId,
          formResponseStatus: application.formResponseStatus,
          applicationAnswers: application.applicationAnswers,
        }}
      />
    </PFFormPage>
  )
}
