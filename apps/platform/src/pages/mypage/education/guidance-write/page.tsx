import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProgramBackButton, useProgramDetail } from '@/features/program'
import {
  EducationInstitutionGuidanceWriteForm,
  resolveTeacherInstitutionGuidanceInitialState,
} from '@/features/mypage/education/applications/ui/institution-guidance-write-form'
import {
  educationInstitutionGuidanceApplicationTabPath,
  educationUjatProgressConfirmPath,
} from '@/features/mypage/education/applications/lib/guidance-path'
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
import {
  resolveUjatScheduleBannerFromState,
  shouldUseUjatApplicationContent,
} from '@/features/mypage/education/applications/lib/ujat-portal-banner'
import { hasInstitutionGuidanceDraftContent } from '@/features/mypage/education/applications/lib/teacher-institution-guidance'
import { PFFormPage, PFText } from '@/shared/ui'
import writeFormStyles from '@/features/mypage/education/applications/ui/institution-guidance-write-form.module.css'

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

  const isUjat = shouldUseUjatApplicationContent(guidanceDetailCase)
  const backPath = isUjat
    ? educationUjatProgressConfirmPath(
        applicationId,
        application?.applicationType ?? applicationType,
      )
    : educationInstitutionGuidanceApplicationTabPath(
        applicationId,
        application?.applicationType ?? applicationType,
      )
  const hasDraft = hasInstitutionGuidanceDraftContent(initialState.guidance)
  const isEdit = isUjat
    ? application?.ujatPortalBannerState === 'REVISION_REQUIRED'
    : true
  const pageTitle = isUjat
    ? isEdit
      ? '안내사항 수정하기'
      : '안내사항 작성하기'
    : '안내사항 수정하기'
  const revisionCopy =
    isUjat && application?.ujatPortalBannerState === 'REVISION_REQUIRED'
      ? resolveUjatScheduleBannerFromState(application.ujatPortalBannerState)
      : null

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

  if (program?.preEducationNoticeRequired === false) {
    return (
      <PFFormPage
        aria-label="안내사항"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          사전 안내 사항 작성이 해당없는 프로그램입니다.
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
      step={isUjat ? '2 / 2' : undefined}
      programSummary={
        program
          ? {
              title: program.title,
              period: program.applicationPeriodLabel,
            }
          : undefined
      }
    >
      {revisionCopy ? (
        <div className={writeFormStyles.revisionNotice}>
          <PFText as="p" typo="hl-sm" color="primary-500" className={writeFormStyles.revisionTitle}>
            {revisionCopy.title}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="black" className={writeFormStyles.revisionBody}>
            {revisionCopy.body}
          </PFText>
        </div>
      ) : null}
      <EducationInstitutionGuidanceWriteForm
        applicationId={applicationId}
        applicationType={applicationType}
        detailCase={guidanceDetailCase}
        initialState={resolvedInitial}
        variant={isUjat ? 'ujat' : 'general'}
        isEdit={isUjat ? isEdit : hasDraft}
        submitPeriodLabel={program?.applicationPeriodLabel}
        portalPatchContext={{
          formResponseId: application.formResponseId,
          formResponseStatus: application.formResponseStatus,
          applicationAnswers: application.applicationAnswers,
        }}
      />
    </PFFormPage>
  )
}
