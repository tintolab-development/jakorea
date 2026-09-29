import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildInProgressDetailTabItems,
  buildTeacherInProgressDetailTabItems,
  buildTeacherWithdrawnDuringDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  canCancelEducationApplication,
  canShowEducationApplicationContent,
  cancelMockEducationApplication,
  educationApplicationDetailPath,
  EducationApplicationContent,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  EducationDetailHeaderLayout,
  EducationInProgressNoticePanel,
  EducationSchedulePanel,
  EducationSettlementPanel,
  EducationStudentsPanel,
  EducationSurveyEmptyPanel,
  EducationSurveyFillPanel,
  DocumentPassBanner,
  getEducationSurveyMockAvailability,
  getMockEducationApplicationById,
  hasTeacherAssignmentAsideContent,
  isInstructorRoleApplication,
  isParticipantRoleApplication,
  isSchoolTeacherMypageProfile,
  isVolunteerRoleApplication,
  isWithdrawnBeforeEducation,
  isWithdrawnDuringEducation,
  lectureApplicationDetailPath,
  MYPAGE_EDUCATION_PATH,
  resolveEducationListBackPath,
  volunteerApplicationDetailPath,
  resolveEducationScheduleTabLabel,
  shouldShowDocumentPassBanner,
  TeacherApplicationContent,
  TeacherEducationAssignmentAside,
  useCancelMyProgramApplicationMutation,
  useMyProgramApplicationDetail,
  useMypageMember,
  type EducationActivitySection,
  type EducationDisplayStatus,
  type ProgramApplicationType,
} from '@/features/mypage'
import { ProgramInfoBody, useMockProgramById, useProgramDetail } from '@/features/program'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { useShouldUsePlatformMockData } from '@/shared/hooks'
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
  const remoteDetailEnabled = isRemoteApiConfigured() && routeApplicationType != null
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [section, setSection] = useState(readSection)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const cancelMutation = useCancelMyProgramApplicationMutation()
  const member = useMypageMember()
  const isTeacher = isSchoolTeacherMypageProfile(member.profile)

  const mockEnabled = useShouldUsePlatformMockData()
  const mockApplication = useMemo(
    () => getMockEducationApplicationById(applicationId),
    [applicationId, mockEnabled],
  )
  const remoteApplicationQuery = useMyProgramApplicationDetail(routeApplicationType, applicationId)
  const application = remoteDetailEnabled ? remoteApplicationQuery.application : mockApplication
  const mockProgramQuery = useMockProgramById(remoteDetailEnabled ? '' : (application?.programId ?? ''))
  const remoteProgramQuery = useProgramDetail(
    remoteDetailEnabled ? application?.programId : null,
    { fresh: true },
  )
  const program = remoteDetailEnabled ? remoteProgramQuery.program : mockProgramQuery.program
  const isProgramLoading = remoteDetailEnabled
    ? remoteApplicationQuery.isLoading || remoteProgramQuery.isLoading
    : mockProgramQuery.isLoading

  const isWithdrawnBefore = application ? isWithdrawnBeforeEducation(application) : false
  const isWithdrawnDuring = application ? isWithdrawnDuringEducation(application) : false
  const isProgramApplicationStatus = application
    ? PROGRAM_APPLICATION_STATUSES.has(application.displayStatus) || isWithdrawnBefore
    : false
  const isActivityStatus = application
    ? ACTIVITY_STATUSES.has(application.displayStatus)
    : false

  const activityTabOptions = useMemo(
    () =>
      program
        ? {
            detailCase: program.detailCase,
            surveyConfigured: program.surveyConfigured,
            satisfactionConfigured: program.satisfactionConfigured,
          }
        : null,
    [program],
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
    if (isWithdrawnDuring) {
      const fallback = withdrawnDuringKeys[0] ?? 'schedule'
      if (!isActivitySection(section) || !withdrawnDuringKeys.includes(section)) {
        setSection(fallback)
      }
      return
    }
    if (isActivityStatus) {
      const fallback = inProgressKeys[0] ?? 'notice'
      if (!isActivitySection(section) || !inProgressKeys.includes(section)) {
        setSection(fallback)
      }
      return
    }
    if (isProgramApplicationStatus && !isAppliedSection(section)) {
      setSection(readAppliedSection())
    }
  }, [
    isActivityStatus,
    isProgramApplicationStatus,
    isWithdrawnDuring,
    section,
    inProgressKeys,
    withdrawnDuringKeys,
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
      cancelMutation.mutate(
        { applicationType: application.applicationType, applicationId: application.id },
        {
          onSuccess: () => {
            setIsCancelConfirmOpen(false)
            navigate(MYPAGE_EDUCATION_PATH, { replace: true })
          },
        },
      )
      return
    }
    cancelMockEducationApplication(applicationId)
    setIsCancelConfirmOpen(false)
    navigate(MYPAGE_EDUCATION_PATH, { replace: true })
  }

  if (!isAuthReady || isChecking || isRedirecting) {
    return null
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

  if (isProgramLoading && !program) {
    return null
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

  const showBanner = shouldShowDocumentPassBanner(application)
  const showCancelCta =
    application.cancellable ?? canCancelEducationApplication(application.displayStatus)
  const showTeacherAssignment =
    isTeacher && hasTeacherAssignmentAsideContent(application.teacherAssignment)
  const appliedSection = isAppliedSection(section) ? section : 'program'
  const activitySection = isActivitySection(section)
    ? section
    : isWithdrawnDuring
      ? (withdrawnDuringKeys[0] ?? 'schedule')
      : (inProgressKeys[0] ?? 'notice')

  const renderApplicationOrPlaceholder = () =>
    canShowEducationApplicationContent(application.displayStatus) ? (
      isTeacher && application.teacherApplicationContent ? (
        <TeacherApplicationContent
          applicationId={application.id}
          content={application.teacherApplicationContent}
        />
      ) : (
        <EducationApplicationContent
          selfIntroMotivation={application.selfIntroMotivation}
          preferredEducationScheduleLabel={application.preferredEducationScheduleLabel}
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
          preferredEducationScheduleLabel={application.preferredEducationScheduleLabel}
          applicationType={routeApplicationType}
          applicationId={application.id}
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
          listTitle={resolveEducationScheduleTabLabel(program.detailCase)}
        />
      )
    }
    if (active === 'students') {
      return (
        <EducationStudentsPanel
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
        />
      )
    }
    if (active === 'survey') {
      const surveyAvailability = getEducationSurveyMockAvailability({
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
          />
        )
      }
      return <EducationSurveyEmptyPanel kind="survey" />
    }
    if (active === 'satisfaction') {
      const satisfactionAvailability = getEducationSurveyMockAvailability({
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

      {showBanner && application.interviewAtLabel ? (
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
              program={program}
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
          {renderActivityBody(activitySection)}
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
          {renderActivityBody(activitySection)}
        </>
      ) : (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
          해당 진행 상태의 상세 탭은 준비 중입니다.
        </PFText>
      )}

      <EducationCancelConfirm
        open={isCancelConfirmOpen}
        onCancel={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
      />
    </section>
  )
}
