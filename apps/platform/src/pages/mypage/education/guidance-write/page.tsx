import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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
import { readEducationApplicationTypeFromRoute } from '@/features/mypage/education/applications/lib/education-application-route'
import { isOrganizationEducationApplication } from '@/features/mypage/education/applications/lib/organization-education-application'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { shouldUseUjatApplicationContent } from '@/features/mypage/education/applications/lib/ujat-portal-banner'
import { UjatRevisionNotice } from '@/features/mypage/education/applications/ui/ujat-revision-notice'
import {
  hasInstitutionGuidanceDraftContent,
  resolveEducationApplicationProgramFocus,
} from '@/features/mypage/education/applications/lib/teacher-institution-guidance'
import { resolveInstitutionPreEducationNoticeRequired } from '@/features/program/lib/portal-application-hidden-paragraph-ids'
import {
  hasUjatScheduleRevisionDrift,
  isValidUjatAcknowledgedScheduleForApplication,
  readUjatAcknowledgedScheduleFromLocationState,
  UJAT_SCHEDULE_RECONFIRM_REQUIRED_MESSAGE,
} from '@/features/mypage/education/applications/lib/ujat-acknowledged-schedule'
import { PFFormPage, PFLoadingSpinner, PFText } from '@/shared/ui'

export function MypageEducationInstitutionGuidanceWritePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '', applicationType: applicationTypeParam } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
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
  const programDetailFocus = useMemo(
    () => resolveEducationApplicationProgramFocus(application),
    [application],
  )
  const programQuery = useProgramDetail(programId, { focus: programDetailFocus })
  const program = programQuery.program

  const guidanceDetailCase = application?.detailCase ?? program?.detailCase

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
  const showRevisionNotice = isUjat && isEdit

  const isRemoteLoading =
    typeProbe.isProbing ||
    remoteQuery.isLoading ||
    Boolean(programId && programQuery.isLoading)

  if (!remoteEnabled) {
    return (
      <PFFormPage
        aria-label="안내사항"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          API가 설정되지 않아 안내사항을 불러올 수 없습니다.
        </PFText>
      </PFFormPage>
    )
  }

  if (isRemoteLoading) {
    return (
      <PFFormPage
        aria-label="안내사항"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항"
      >
        <PFLoadingSpinner centered label="안내사항을 불러오는 중" />
      </PFFormPage>
    )
  }

  if (remoteQuery.isError) {
    return (
      <PFFormPage
        aria-label="안내사항"
        back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
        title="안내사항"
      >
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          신청 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </PFText>
      </PFFormPage>
    )
  }

  if (resolveInstitutionPreEducationNoticeRequired(program) === false) {
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

  if (!application || !program || !isOrganizationEducationApplication(application, program)) {
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
  const acknowledgedSchedule = isUjat
    ? readUjatAcknowledgedScheduleFromLocationState(location.state)
    : null
  const hasValidAcknowledgedSchedule = isUjat
    ? isValidUjatAcknowledgedScheduleForApplication(acknowledgedSchedule, applicationId)
    : true
  const scheduleRevisionDrift =
    isUjat &&
    hasValidAcknowledgedSchedule &&
    hasUjatScheduleRevisionDrift(acknowledgedSchedule, application.ujatAssignmentRevision)

  return (
    <PFFormPage
      aria-label={pageTitle}
      back={<ProgramBackButton size="small" label="이전으로" onClick={() => navigate(backPath)} />}
      title={pageTitle}
      step={isUjat ? '2 / 2' : undefined}
      programSummary={
        showRevisionNotice || !program
          ? undefined
          : {
              title: program.title,
              period: program.applicationPeriodLabel,
            }
      }
    >
      {showRevisionNotice ? (
        <UjatRevisionNotice reason={application.ujatRevisionReason} />
      ) : null}
      {isUjat && !hasValidAcknowledgedSchedule ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          {UJAT_SCHEDULE_RECONFIRM_REQUIRED_MESSAGE}
        </PFText>
      ) : null}
      {scheduleRevisionDrift ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          관리자가 배정 일정을 변경했습니다. 1단계에서 변경된 일정을 확인한 후 다시 제출해 주세요.
        </PFText>
      ) : null}
      <EducationInstitutionGuidanceWriteForm
        applicationId={applicationId}
        applicationType={applicationType}
        detailCase={guidanceDetailCase}
        initialState={resolvedInitial}
        variant={isUjat ? 'ujat' : 'general'}
        isEdit={isUjat ? isEdit : hasDraft}
        submitPeriodLabel={program?.applicationPeriodLabel}
        ujatAcknowledgedSchedule={hasValidAcknowledgedSchedule ? acknowledgedSchedule : null}
        scheduleRevisionDrift={scheduleRevisionDrift}
        temporarySchedule={application.ujatTemporarySchedule}
        portalPatchContext={{
          formResponseId: application.formResponseId,
          formResponseStatus: application.formResponseStatus,
          applicationAnswers: application.applicationAnswers,
        }}
      />
    </PFFormPage>
  )
}
