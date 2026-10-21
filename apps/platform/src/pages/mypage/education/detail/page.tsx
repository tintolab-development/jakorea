import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildInProgressDetailTabItems,
  buildTeacherInProgressDetailTabItems,
  buildTeacherWithdrawnDuringDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  canCancelEducationApplication,
  canShowEducationApplicationContent,
  educationApplicationDetailPath,
  EducationApplicationContent,
  resolvePreferredEducationScheduleDisplayLabel,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  EducationDetailHeaderLayout,
  EducationInProgressNoticePanel,
  EducationSchedulePanel,
  EducationJournalPanel,
  EducationSettlementPanel,
  EducationStudentsPanel,
  EducationSurveyEmptyPanel,
  EducationSurveyFillPanel,
  DocumentPassBanner,
  getEducationSurveyTabAvailability,
  hasTeacherMypageProfile,
  hasTeacherAssignmentAsideContent,
  isInstructorRoleApplication,
  isParticipantRoleApplication,
  isVolunteerRoleApplication,
  isWithdrawnBeforeEducation,
  isWithdrawnDuringEducation,
  lectureApplicationDetailPath,
  MYPAGE_EDUCATION_PATH,
  resolveEducationListBackPath,
  volunteerApplicationDetailPath,
  EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL,
  shouldShowDocumentPassBanner,
  TeacherApplicationContent,
  UjatApplicationContent,
  UjatScheduleBanner,
  TeacherEducationAssignmentAside,
  useCancelMyProgramApplicationMutation,
  useMyProgramApplicationDetail,
  useProbeEducationApplicationType,
  useMypageMember,
  EducationApplicationDetailLoading,
  type EducationActivitySection,
  type EducationDisplayStatus,
  type ProgramApplicationType,
} from '@/features/mypage'
import { ProgramInfoBody, useProgramDetail } from '@/features/program'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import {
  resolveEducationApplicationProgramFocus,
  shouldShowTeacherInstitutionGuidanceEditLink,
  shouldShowTeacherInstitutionGuidanceOnApplicationTab,
  shouldShowTeacherInstitutionGuidanceWrite,
} from '@/features/mypage/education/applications/lib/teacher-institution-guidance'
import { buildTeacherApplicationContentFromPortal } from '@/features/mypage/education/applications/lib/teacher-application-content-from-portal'
import {
  isOrganizationEducationApplication,
  isTrainedTeachersEducationProgram,
  resolveOrganizationApplicationTypeForContent,
  resolveTeacherApplicationProgramGroup,
} from '@/features/mypage/education/applications/lib/organization-education-application'
import { useOrganizationStudentDocumentPolicyQuery } from '@/features/mypage/education/applications/api/student-documents-hooks'
import { shouldShowTeacherStudentDocumentDependentTabs } from '@/features/mypage/education/applications/lib/student-documents-policy'
import {
  resolveUjatScheduleBannerFromState,
  sanitizeUjatParticipantBasicInfoFields,
  shouldShowUjatScheduleBanner,
  shouldUseUjatApplicationContent,
} from '@/features/mypage/education/applications/lib/ujat-portal-banner'
import { educationUjatProgressConfirmPath } from '@/features/mypage/education/applications/lib/guidance-path'
import type { EducationApplicationListItem } from '@/features/mypage/education/applications/model/types'
import { PFButton, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

type AppliedSection = 'program' | 'application'
type DetailSection = AppliedSection | EducationActivitySection

const PROGRAM_APPLICATION_STATUSES = new Set<EducationDisplayStatus>([
  'waiting_result',
  'document_passed',
  'rejected',
])

const ACTIVITY_STATUSES = new Set<EducationDisplayStatus>(['in_progress', 'completed'])

const APPLIED_SECTION_TAB_ITEMS = [
  { key: 'program', label: '프로그램 정보' },
  { key: 'application', label: '신청 내용' },
] as const

function isAppliedSection(value: string): value is AppliedSection {
  return value === 'program' || value === 'application'
}

function isActivitySection(value: string): value is EducationActivitySection {
  return (
    value === 'notice' ||
    value === 'schedule' ||
    value === 'educationJournal' ||
    value === 'students' ||
    value === 'survey' ||
    value === 'satisfaction' ||
    value === 'settlement'
  )
}

function readAppliedSection(search = window.location.search): AppliedSection {
  const value = new URLSearchParams(search).get('section')
  return value === 'application' ? 'application' : 'program'
}

function readActivitySection(
  search: string,
  allowed: readonly EducationActivitySection[],
  fallback: EducationActivitySection,
): EducationActivitySection {
  const value = new URLSearchParams(search).get('section')
  if (value && isActivitySection(value) && allowed.includes(value)) return value
  return fallback
}

function readSection(search = window.location.search): DetailSection {
  const value = new URLSearchParams(search).get('section')
  if (value && isActivitySection(value)) return value
  if (value === 'application') return 'application'
  return 'program'
}

const EDUCATION_APPLICATION_TYPES = new Set<ProgramApplicationType>(['INDIVIDUAL', 'ORGANIZATION'])

function readEducationApplicationType(value: string | undefined): ProgramApplicationType | null {
  if (value && EDUCATION_APPLICATION_TYPES.has(value as ProgramApplicationType)) {
    return value as ProgramApplicationType
  }
  return null
}

function buildDetailPath(
  applicationId: string,
  section: DetailSection,
  applicationType?: ProgramApplicationType,
) {
  const base = educationApplicationDetailPath(applicationId, applicationType)
  if (section === 'program' || section === 'notice') return base
  return `${base}?section=${section}`
}

export function MypageEducationDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '', applicationType } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const routeApplicationType = readEducationApplicationType(applicationType)
  const { applicationType: probedApplicationType, isProbing: isProbingApplicationType } =
    useProbeEducationApplicationType(applicationId, routeApplicationType)
  const resolvedApplicationType = routeApplicationType ?? probedApplicationType
  const remoteDetailEnabled = isRemoteApiConfigured() && resolvedApplicationType != null
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [section, setSection] = useState(readSection)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const cancelMutation = useCancelMyProgramApplicationMutation()
  const queryClient = useQueryClient()
  const member = useMypageMember()
  const isTeacher = hasTeacherMypageProfile(member.profile)

  const remoteApplicationQuery = useMyProgramApplicationDetail(
    resolvedApplicationType,
    applicationId,
  )
  const application = remoteDetailEnabled ? remoteApplicationQuery.application : undefined
  const programDetailFocus = useMemo(
    () => resolveEducationApplicationProgramFocus(application),
    [application],
  )
  const remoteProgramQuery = useProgramDetail(
    application?.programId ?? null,
    { fresh: true, focus: programDetailFocus },
  )
  const remoteProgram = remoteProgramQuery.program
  const program = useMemo(() => {
    if (!remoteProgram) return undefined
    const applicationProgram = application?.programConfig
    if (!applicationProgram) return remoteProgram
    return {
      ...remoteProgram,
      programType: applicationProgram.programType ?? remoteProgram.programType,
      educationFormLabel:
        applicationProgram.educationFormLabel ?? remoteProgram.educationFormLabel,
      educationJournalEnabled:
        applicationProgram.educationJournalEnabled ?? remoteProgram.educationJournalEnabled,
      surveyConfigured: applicationProgram.surveyConfigured ?? remoteProgram.surveyConfigured,
      satisfactionConfigured:
        applicationProgram.satisfactionConfigured ?? remoteProgram.satisfactionConfigured,
    }
  }, [application?.programConfig, remoteProgram])
  const isApplicationLoading =
    (isRemoteApiConfigured() && isProbingApplicationType) ||
    (remoteDetailEnabled && remoteApplicationQuery.isLoading)
  const isProgramLoading = remoteDetailEnabled
    ? remoteApplicationQuery.isLoading || remoteProgramQuery.isLoading
    : false
  const isDetailLoading =
    !isAuthReady ||
    isChecking ||
    isRedirecting ||
    isApplicationLoading ||
    (Boolean(application) && isProgramLoading && !program)

  const isWithdrawnBefore = application ? isWithdrawnBeforeEducation(application) : false
  const isWithdrawnDuring = application ? isWithdrawnDuringEducation(application) : false
  const isProgramApplicationStatus = application
    ? PROGRAM_APPLICATION_STATUSES.has(application.displayStatus) || isWithdrawnBefore
    : false
  const isActivityStatus = application
    ? ACTIVITY_STATUSES.has(application.displayStatus)
    : false

  const isTeacherOrgActivityDetail =
    isTeacher &&
    Boolean(application && program) &&
    (isActivityStatus || isWithdrawnDuring) &&
    isOrganizationEducationApplication(application, program)

  const studentDocumentPolicyQuery = useOrganizationStudentDocumentPolicyQuery(
    routeApplicationType ?? application?.applicationType ?? null,
    applicationId,
    { organizationProgram: program?.programAudience === 'organization' },
    { enabled: isTeacherOrgActivityDetail },
  )

  const teacherStudentDocumentTabsVisible = useMemo(() => {
    if (!isTeacher || !isTeacherOrgActivityDetail) return false
    return shouldShowTeacherStudentDocumentDependentTabs(studentDocumentPolicyQuery.data, {
      policyQueryEnabled: true,
      // 이 신청 건의 policy가 아직 없을 때만 탭을 숨깁니다.
      // 업로드 취소 등으로 같은 키를 다시 조회할 때는 캐시를 유지해 탭·본문이 바뀌지 않게 합니다.
      policyLoading: studentDocumentPolicyQuery.isPending,
      policyError: studentDocumentPolicyQuery.isError,
    })
  }, [
    isTeacher,
    isTeacherOrgActivityDetail,
    studentDocumentPolicyQuery.data,
    studentDocumentPolicyQuery.isError,
    studentDocumentPolicyQuery.isPending,
  ])
  const isStudentDocumentPolicyPending =
    isTeacherOrgActivityDetail && studentDocumentPolicyQuery.isPending

  const activityTabOptions = useMemo(
    () =>
      program
        ? {
            detailCase: program.detailCase,
            programType: program.programType,
            scheduleTabLabel: EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL,
            surveyConfigured: program.surveyConfigured,
            satisfactionConfigured: program.satisfactionConfigured,
            educationJournalEnabled:
              isTeacher &&
              program.programType === 'TRAINED_TEACHER' &&
              program.educationJournalEnabled === true,
            ...(isTeacher
              ? { teacherStudentDocumentTabsVisible: teacherStudentDocumentTabsVisible !== false }
              : {}),
          }
        : null,
    [isTeacher, program, teacherStudentDocumentTabsVisible],
  )

  const inProgressTabItems = useMemo(() => {
    if (!activityTabOptions) return []
    return isTeacher
      ? buildTeacherInProgressDetailTabItems(activityTabOptions)
      : buildInProgressDetailTabItems(activityTabOptions)
  }, [activityTabOptions, isTeacher])
  const withdrawnDuringTabItems = useMemo(() => {
    if (!activityTabOptions) return []
    return isTeacher
      ? buildTeacherWithdrawnDuringDetailTabItems(activityTabOptions)
      : buildWithdrawnDuringDetailTabItems(activityTabOptions)
  }, [activityTabOptions, isTeacher])

  const inProgressKeys = useMemo(
    () => inProgressTabItems.map(item => item.key),
    [inProgressTabItems],
  )
  const withdrawnDuringKeys = useMemo(
    () => withdrawnDuringTabItems.map(item => item.key),
    [withdrawnDuringTabItems],
  )

  const teacherApplicationContent = useMemo(() => {
    if (!application || !program) return undefined
    if (!isOrganizationEducationApplication(application, program)) {
      return application.teacherApplicationContent
    }

    const preferredEducationScheduleLabel = resolvePreferredEducationScheduleDisplayLabel({
      preferredEducationScheduleLabel: application.preferredEducationScheduleLabel,
      preferredScheduleOptionValues: application.preferredScheduleOptionValues,
      educationScheduleLines: program.educationScheduleLines,
      schedules: program.eventSchedules,
    })

    const contentApplicationType = resolveOrganizationApplicationTypeForContent(
      application.applicationType,
      program,
    )
    const programGroup = resolveTeacherApplicationProgramGroup(program)

    return buildTeacherApplicationContentFromPortal(
      {
        applicationType: contentApplicationType,
        programAudience: program.programAudience,
        detailCase: application.detailCase,
        programGroup,
        answers: application.applicationAnswers,
        preferredScheduleBlocks: application.preferredScheduleBlocks,
        preferredScheduleOptionValues: application.preferredScheduleOptionValues,
        preferredEducationScheduleLabel,
        existing: application.teacherApplicationContent,
      },
      program,
    )
  }, [application, program])

  const showTeacherInstitutionGuidanceOnTab = useMemo(
    () =>
      program && application
        ? shouldShowTeacherInstitutionGuidanceOnApplicationTab(program, { application })
        : false,
    [application, program],
  )

  const showTeacherGuidanceEditLink = useMemo(() => {
    if (!application || !program) return false
    return shouldShowTeacherInstitutionGuidanceEditLink({
      isTeacher,
      application,
      program,
      displayStatus: application.displayStatus,
    })
  }, [application, isTeacher, program])

  const applicationInfoBody = useMemo(() => {
    if (!application || !program) return undefined
    if (shouldUseUjatApplicationContent(application.detailCase)) {
      return <UjatApplicationContent content={application.ujatApplicationContent} />
    }
    if (
      !isOrganizationEducationApplication(application, program) ||
      !teacherApplicationContent
    ) {
      return undefined
    }
    const contentApplicationType =
      application.applicationType ??
      routeApplicationType ??
      resolveOrganizationApplicationTypeForContent(undefined, program)
    return (
      <TeacherApplicationContent
        applicationId={application.id}
        applicationType={contentApplicationType}
        content={teacherApplicationContent}
        showGuidanceWriteLink={showTeacherGuidanceEditLink}
        institutionGuidanceEnabled={showTeacherInstitutionGuidanceOnTab}
        showPreferredEducationForm={
          program.educationForm === 'participant_choice' ||
          isTrainedTeachersEducationProgram(program)
        }
      />
    )
  }, [
    application,
    application?.applicationType,
    application?.id,
    application?.detailCase,
    application?.ujatApplicationContent,
    program,
    program?.educationForm,
    routeApplicationType,
    showTeacherGuidanceEditLink,
    showTeacherInstitutionGuidanceOnTab,
    teacherApplicationContent,
  ])

  useEffect(() => {
    if (!probedApplicationType || routeApplicationType || !applicationId) return
    navigate(
      `${educationApplicationDetailPath(applicationId, probedApplicationType)}${location.search}`,
      { replace: true },
    )
  }, [applicationId, location.search, navigate, probedApplicationType, routeApplicationType])

  useEffect(() => {
    if (!isRemoteApiConfigured() || routeApplicationType || probedApplicationType || !applicationId) {
      return
    }

    const listQueries = queryClient.getQueriesData<{ items?: EducationApplicationListItem[] }>({
      queryKey: platformQueryKeys.mypage.programApplications.all(),
    })
    for (const [, data] of listQueries) {
      const match = data?.items?.find(item => item.id === applicationId)
      if (match?.applicationType) {
        navigate(
          `${educationApplicationDetailPath(applicationId, match.applicationType)}${location.search}`,
          { replace: true },
        )
        return
      }
    }
  }, [
    applicationId,
    location.search,
    navigate,
    probedApplicationType,
    queryClient,
    routeApplicationType,
  ])

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(
        resolveLoginRequiredPath(
          educationApplicationDetailPath(applicationId || 'unknown', routeApplicationType ?? undefined),
        ),
      )
      return
    }

    setIsAuthReady(true)
  }, [applicationId, navigate, routeApplicationType])

  useEffect(() => {
    if (!application) return
    if (isVolunteerRoleApplication(application)) {
      navigate(`${volunteerApplicationDetailPath(application.id, application.applicationType)}${location.search}`, {
        replace: true,
      })
      return
    }
    if (isInstructorRoleApplication(application)) {
      navigate(`${lectureApplicationDetailPath(application.id, application.applicationType)}${location.search}`, {
        replace: true,
      })
      return
    }
    if (remoteDetailEnabled && !isParticipantRoleApplication(application)) {
      navigate(`${MYPAGE_EDUCATION_PATH}${location.search}`, {
        replace: true,
      })
    }
  }, [application, location.search, navigate, remoteDetailEnabled])

  useEffect(() => {
    const onPopState = () => {
      setSection(readSection())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (isStudentDocumentPolicyPending) return
    if (isWithdrawnDuring) {
      const fallback = withdrawnDuringKeys[0] ?? 'schedule'
      if (!isActivitySection(section) || !withdrawnDuringKeys.includes(section)) {
        setSection(fallback)
        const nextPath = buildDetailPath(applicationId, fallback, application?.applicationType)
        const currentPath = `${window.location.pathname}${window.location.search}`
        if (nextPath !== currentPath) window.history.replaceState(null, '', nextPath)
      }
      return
    }
    if (isActivityStatus) {
      const fallback = inProgressKeys[0] ?? 'notice'
      if (!isActivitySection(section) || !inProgressKeys.includes(section)) {
        setSection(fallback)
        const nextPath = buildDetailPath(applicationId, fallback, application?.applicationType)
        const currentPath = `${window.location.pathname}${window.location.search}`
        if (nextPath !== currentPath) window.history.replaceState(null, '', nextPath)
      }
      return
    }
    if (isProgramApplicationStatus && !isAppliedSection(section)) {
      setSection(readAppliedSection())
    }
  }, [
    isActivityStatus,
    isStudentDocumentPolicyPending,
    isProgramApplicationStatus,
    isWithdrawnDuring,
    section,
    inProgressKeys,
    withdrawnDuringKeys,
    application?.applicationType,
    applicationId,
  ])

  const handleBack = () => {
    navigate(resolveEducationListBackPath(location.state), { replace: true })
  }

  const handleSectionChange = (next: string) => {
    let nextSection: DetailSection
    if (isWithdrawnDuring) {
      nextSection = readActivitySection(
        `?section=${next}`,
        withdrawnDuringKeys,
        withdrawnDuringKeys[0] ?? 'schedule',
      )
    } else if (isActivityStatus) {
      nextSection = readActivitySection(
        `?section=${next}`,
        inProgressKeys,
        inProgressKeys[0] ?? 'notice',
      )
    } else {
      nextSection = next === 'application' ? 'application' : 'program'
    }
    setSection(nextSection)
    const nextPath = buildDetailPath(applicationId, nextSection, application?.applicationType)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.replaceState(null, '', nextPath)
    }
  }

  const handleConfirmCancel = () => {
    if (remoteDetailEnabled && application?.applicationType) {
      if (cancelMutation.isPending) return
      cancelMutation.mutate(
        {
          applicationType: application.applicationType,
          applicationId: application.id,
          programId: application.programId,
        },
        {
          onSuccess: () => {
            setIsCancelConfirmOpen(false)
            navigate(MYPAGE_EDUCATION_PATH, { replace: true })
          },
        },
      )
      return
    }
    setIsCancelConfirmOpen(false)
    navigate(MYPAGE_EDUCATION_PATH, { replace: true })
  }

  if (isDetailLoading) {
    return <EducationApplicationDetailLoading onBack={handleBack} />
  }

  if (!application) {
    return (
      <section className={styles.page}>
        <EducationDetailBack onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          신청 정보를 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_EDUCATION_PATH)}>
          교육현황으로
        </PFButton>
      </section>
    )
  }

  if (!program) {
    return (
      <section className={styles.page}>
        <EducationDetailBack onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          프로그램을 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_EDUCATION_PATH)}>
          교육현황으로
        </PFButton>
      </section>
    )
  }

  const ujatScheduleBanner = shouldShowUjatScheduleBanner(
    application.detailCase,
    application.ujatPortalBannerState,
  )
    ? resolveUjatScheduleBannerFromState(application.ujatPortalBannerState)
    : null
  const showBanner = !ujatScheduleBanner && shouldShowDocumentPassBanner(application)
  const programForInfo = shouldUseUjatApplicationContent(application.detailCase)
    ? {
        ...program,
        basicInfoFields: sanitizeUjatParticipantBasicInfoFields(
          application.detailCase,
          program.educationTargetDetailLabel,
          program.basicInfoFields,
        ),
      }
    : program
  const showCancelCta =
    application.cancellable ?? canCancelEducationApplication(application.displayStatus)
  const showTeacherAssignment =
    isTeacher && hasTeacherAssignmentAsideContent(application.teacherAssignment)
  const appliedSection = isAppliedSection(section) ? section : 'program'
  const activitySection =
    isActivitySection(section) &&
    ((isWithdrawnDuring && withdrawnDuringKeys.includes(section)) ||
      (isActivityStatus && inProgressKeys.includes(section)))
      ? section
      : isWithdrawnDuring
        ? (withdrawnDuringKeys[0] ?? 'schedule')
        : (inProgressKeys[0] ?? 'notice')

  const preferredEducationScheduleLabel = resolvePreferredEducationScheduleDisplayLabel({
    preferredEducationScheduleLabel: application.preferredEducationScheduleLabel,
    preferredScheduleOptionValues: application.preferredScheduleOptionValues,
    educationScheduleLines: program.educationScheduleLines,
    schedules: program.eventSchedules,
  })

  const showTeacherNoticeWrite = shouldShowTeacherInstitutionGuidanceWrite({
    isTeacher,
    application,
    program,
    displayStatus: application.displayStatus,
  })

  const noticeWriteAuthorDisplayName = member.displayName
    ? `${member.displayName} 담당교사님`
    : '담당교사님'

  const renderApplicationOrPlaceholder = () =>
    canShowEducationApplicationContent(application.displayStatus) ? (
      shouldUseUjatApplicationContent(application.detailCase) ? (
        <UjatApplicationContent content={application.ujatApplicationContent} />
      ) : isOrganizationEducationApplication(application, program) &&
        teacherApplicationContent ? (
        <TeacherApplicationContent
          applicationId={application.id}
          applicationType={
            application.applicationType ??
            routeApplicationType ??
            resolveOrganizationApplicationTypeForContent(
              undefined,
              program,
              application.applicationAnswers,
            )
          }
          content={teacherApplicationContent}
          showGuidanceWriteLink={showTeacherGuidanceEditLink}
          institutionGuidanceEnabled={showTeacherInstitutionGuidanceOnTab}
          showPreferredEducationForm={
            program.educationForm === 'participant_choice' ||
            isTrainedTeachersEducationProgram(program)
          }
        />
      ) : (
        <EducationApplicationContent
          selfIntroMotivation={application.selfIntroMotivation}
          preferredEducationScheduleLabel={preferredEducationScheduleLabel}
        />
      )
    ) : (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
        신청 내용 화면은 준비 중입니다.
      </PFText>
    )

  const renderActivityBody = (active: EducationActivitySection) => {
    if (active === 'notice' && isActivityStatus) {
      return (
        <EducationInProgressNoticePanel
          program={program}
          selfIntroMotivation={application.selfIntroMotivation}
          preferredEducationScheduleLabel={preferredEducationScheduleLabel}
          applicationInfoBody={applicationInfoBody}
          applicationType={routeApplicationType}
          applicationId={application.id}
          noticeWriteEnabled={showTeacherNoticeWrite}
          noticeWriteAuthorDisplayName={noticeWriteAuthorDisplayName}
        />
      )
    }
    if (active === 'schedule') {
      return (
        <EducationSchedulePanel
          programId={program.id}
          applicationType={routeApplicationType}
          applicationId={application.id}
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
          listTitle={EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL}
          absenceReasonEnabled={!isOrganizationEducationApplication(application, program)}
        />
      )
    }
    if (active === 'students') {
      return (
        <EducationStudentsPanel
          applicationId={application.id}
          applicationType={routeApplicationType ?? application.applicationType ?? null}
          organizationProgram={
            routeApplicationType === 'ORGANIZATION' || program.programAudience === 'organization'
          }
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
        />
      )
    }
    if (active === 'educationJournal') {
      if (!isTeacher || !isOrganizationEducationApplication(application, program)) {
        return null
      }
      return (
        <EducationJournalPanel
          programId={program.id}
          organizationApplicationId={application.id}
          enabled={program.educationJournalEnabled === true}
        />
      )
    }
    if (active === 'survey') {
      const surveyAvailability = getEducationSurveyTabAvailability({
        displayStatus: application.displayStatus,
        withdrawalPhase: application.withdrawalPhase,
        configured: program.surveyConfigured,
      })
      if (remoteDetailEnabled || surveyAvailability === 'active') {
        return (
          <EducationSurveyFillPanel
            kind="survey"
            programTitle={program.title}
            educationScheduleLines={program.educationScheduleLines}
            educationTargetLabel={program.educationTargetDetailLabel}
            applicationType={routeApplicationType}
            applicationId={application.id}
            programId={program.id}
            pendingSurveyCount={application.pendingSurveyCount}
          />
        )
      }
      return <EducationSurveyEmptyPanel kind="survey" />
    }
    if (active === 'satisfaction') {
      if (program.programType?.toUpperCase() === 'TRAINED_TEACHER') {
        return null
      }
      const satisfactionAvailability = getEducationSurveyTabAvailability({
        displayStatus: application.displayStatus,
        withdrawalPhase: application.withdrawalPhase,
        configured: program.satisfactionConfigured,
      })
      if (remoteDetailEnabled || satisfactionAvailability === 'active') {
        return (
          <EducationSurveyFillPanel
            kind="satisfaction"
            satisfactionAudience="student"
            programTitle={program.title}
            educationScheduleLines={program.educationScheduleLines}
            educationTargetLabel={program.educationTargetDetailLabel}
            applicationType={routeApplicationType}
            applicationId={application.id}
            programId={program.id}
          />
        )
      }
      return <EducationSurveyEmptyPanel kind="satisfaction" />
    }
    if (active === 'settlement') {
      if (isTeacher) {
        return (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
            준비 중입니다.
          </PFText>
        )
      }
      return (
        <EducationSettlementPanel
          programId={program.id}
          applicationType={routeApplicationType}
          applicationId={application.id}
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
        />
      )
    }
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
        준비 중입니다.
      </PFText>
    )
  }

  return (
    <section className={styles.page}>
      <EducationDetailHeaderLayout
        leading={<EducationDetailBack onClick={handleBack} />}
        header={
          <EducationDetailHeader
            title={program.title}
            displayStatus={application.displayStatus}
            educationTargetLabel={program.educationTargetLabel}
            educationForm={program.educationForm}
            educationFormLabel={program.educationFormLabel}
            statusAudience={isTeacher ? 'teacher' : 'general'}
          />
        }
        aside={
          showTeacherAssignment && application.teacherAssignment ? (
            <TeacherEducationAssignmentAside
              applicationId={application.id}
              assignment={application.teacherAssignment}
            />
          ) : undefined
        }
      />

      {ujatScheduleBanner ? (
        <UjatScheduleBanner
          copy={ujatScheduleBanner}
          onActivate={
            ujatScheduleBanner.clickable
              ? () =>
                  navigate(
                    educationUjatProgressConfirmPath(
                      application.id,
                      application.applicationType,
                    ),
                  )
              : undefined
          }
        />
      ) : showBanner ? (
        <DocumentPassBanner interviewAtLabel={application.interviewAtLabel} />
      ) : null}

      {isProgramApplicationStatus ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={[...APPLIED_SECTION_TAB_ITEMS]}
            value={appliedSection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="교육현황 상세 탭"
          />

          {appliedSection === 'program' ? (
            <ProgramInfoBody
              program={programForInfo}
              showPeriodSponsor
              showApplyCta={false}
              showCancelCta={showCancelCta}
              onCancel={() => setIsCancelConfirmOpen(true)}
            />
          ) : (
            renderApplicationOrPlaceholder()
          )}
        </>
      ) : isWithdrawnDuring ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={withdrawnDuringTabItems}
            value={activitySection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="활동 포기 교육 상세 탭"
          />
          <div className={styles.tabPanelBody}>{renderActivityBody(activitySection)}</div>
        </>
      ) : isActivityStatus ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={inProgressTabItems}
            value={activitySection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="진행중 교육 상세 탭"
          />
          <div className={styles.tabPanelBody}>{renderActivityBody(activitySection)}</div>
        </>
      ) : (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
          해당 진행 상태의 상세 탭은 준비 중입니다.
        </PFText>
      )}

      <EducationCancelConfirm
        open={isCancelConfirmOpen}
        onCancel={() => {
          if (cancelMutation.isPending) return
          cancelMutation.reset()
          setIsCancelConfirmOpen(false)
        }}
        onConfirm={handleConfirmCancel}
        pending={cancelMutation.isPending}
        error={cancelMutation.error}
      />
    </section>
  )
}
