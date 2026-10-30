import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildInProgressDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  canCancelEducationApplication,
  canShowEducationApplicationContent,
  educationApplicationDetailPath,
  EducationApplicationContent,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  EducationSettlementPanel,
  EducationSurveySection,
  DocumentPassBanner,
  isVolunteerRoleApplication,
  isWithdrawnBeforeEducation,
  isWithdrawnDuringEducation,
  MYPAGE_VOLUNTEER_PATH,
  resolveVolunteerActivityDetailCase,
  shouldShowDocumentPassBanner,
  useCancelMyProgramApplicationMutation,
  useMyProgramApplicationDetail,
  EducationApplicationDetailLoading,
  volunteerApplicationDetailPath,
  type EducationActivitySection,
  type EducationDisplayStatus,
  type ProgramApplicationType,
} from '@/features/mypage'
import { useApplicationSchedulesQuery } from '@/features/mypage/education/applications/api/activity-hooks'
import {
  UjatVolunteerSchedulePanel,
  VolunteerAssignmentPanel,
  VolunteerNoticePanel,
  resolveUjatVolunteerWithdrawnDetailView,
  resolveVolunteerListBackPath,
  resolveVolunteerSchedulePanelKind,
} from '@/features/mypage/volunteer'
import { ProgramInfoBody, useProgramDetail } from '@/features/program'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { resolveMypagePreferredScheduleLines } from '@/features/mypage/education/applications/lib/mypage-preferred-schedule-lines'
import {
  groupScheduleLinesByDate,
  resolveVolunteerApplicationExtrasFromAnswers,
} from '@/features/mypage/education/applications/lib/volunteer-application-extras-from-answers'
import { PFButton, PFTabs, PFText } from '@/shared/ui'
import styles from '../../education/detail/page.module.css'

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

function readVolunteerApplicationType(value: string | undefined): ProgramApplicationType | null {
  return value === 'VOLUNTEER' ? 'VOLUNTEER' : null
}

function buildDetailPath(
  applicationId: string,
  section: DetailSection,
  applicationType?: ProgramApplicationType,
) {
  const base = volunteerApplicationDetailPath(applicationId, applicationType)
  if (section === 'program' || section === 'notice') return base
  return `${base}?section=${section}`
}

export function MypageVolunteerDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '', applicationType } = useParams<{
    applicationId: string
    applicationType?: string
  }>()
  const routeApplicationType = readVolunteerApplicationType(applicationType)
  const remoteDetailEnabled = isRemoteApiConfigured() && routeApplicationType != null
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [section, setSection] = useState(readSection)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const cancelMutation = useCancelMyProgramApplicationMutation()

  const remoteApplicationQuery = useMyProgramApplicationDetail(routeApplicationType, applicationId)
  const application = remoteDetailEnabled ? remoteApplicationQuery.application : undefined
  const programRequest = useMemo(() => {
    if (!application || application.programId.trim() === '') return null
    if (application.recruitmentId == null || application.recruitmentId <= 0) return null
    if (!application.applicationType) return null

    const applicationType = application.applicationType.trim().toUpperCase()
    return {
      programId: application.programId,
      focus: {
        applicationTypes: [applicationType],
        recruitmentIds: [application.recruitmentId],
      },
    }
  }, [application])
  const remoteProgramQuery = useProgramDetail(
    programRequest?.programId ?? null,
    { fresh: true, focus: programRequest?.focus ?? null },
  )
  const remoteProgram = remoteProgramQuery.program
  const program = useMemo(() => {
    if (!remoteProgram) return undefined
    const applicationProgram = application?.programConfig
    if (!applicationProgram) return remoteProgram
    return {
      ...remoteProgram,
      surveyConfigured: applicationProgram.surveyConfigured ?? remoteProgram.surveyConfigured,
      satisfactionConfigured:
        applicationProgram.satisfactionConfigured ?? remoteProgram.satisfactionConfigured,
    }
  }, [application?.programConfig, remoteProgram])
  const isApplicationLoading = remoteDetailEnabled && remoteApplicationQuery.isLoading
  const isProgramLoading = remoteDetailEnabled
    ? remoteApplicationQuery.isLoading || remoteProgramQuery.isLoading
    : false
  const isUjatVolunteer = application?.detailCase === 'ujat-volunteer'
  const ujatSchedulesQuery = useApplicationSchedulesQuery(
    isUjatVolunteer ? routeApplicationType : null,
    isUjatVolunteer ? applicationId : null,
  )
  const ujatWithdrawnView = resolveUjatVolunteerWithdrawnDetailView({
    isUjatVolunteer: Boolean(isUjatVolunteer),
    displayStatus: application?.displayStatus,
    schedulesQuery: {
      enabled: ujatSchedulesQuery.enabled,
      isLoading: ujatSchedulesQuery.isLoading,
      isError: ujatSchedulesQuery.isError,
      items: ujatSchedulesQuery.items,
    },
  })
  const isDetailLoading =
    !isAuthReady ||
    isChecking ||
    isRedirecting ||
    isApplicationLoading ||
    (Boolean(application) && isProgramLoading && !program) ||
    ujatWithdrawnView === 'loading'
  const isWithdrawnBefore = application
    ? isUjatVolunteer
      ? false
      : isWithdrawnBeforeEducation(application)
    : false
  const isWithdrawnDuring = application
    ? isUjatVolunteer
      ? ujatWithdrawnView === 'history'
      : isWithdrawnDuringEducation(application)
    : false
  const isProgramApplicationStatus = application
    ? PROGRAM_APPLICATION_STATUSES.has(application.displayStatus) ||
      isWithdrawnBefore ||
      ujatWithdrawnView === 'applied'
    : false
  const isActivityStatus = application
    ? ACTIVITY_STATUSES.has(application.displayStatus)
    : false
  const schedulePanelKind = resolveVolunteerSchedulePanelKind(application?.detailCase)
  const lastParticipatedSession =
    isWithdrawnDuring && !isUjatVolunteer ? application?.lastParticipatedSession : undefined

  const activityTabOptions = useMemo(
    () =>
      program && application
        ? {
            detailCase: resolveVolunteerActivityDetailCase(application.detailCase),
            surveyConfigured: program.surveyConfigured,
            satisfactionConfigured: program.satisfactionConfigured,
          }
        : null,
    [application, program],
  )

  const inProgressTabItems = useMemo(
    () => (activityTabOptions ? buildInProgressDetailTabItems(activityTabOptions) : []),
    [activityTabOptions],
  )
  const withdrawnDuringTabItems = useMemo(
    () => (activityTabOptions ? buildWithdrawnDuringDetailTabItems(activityTabOptions) : []),
    [activityTabOptions],
  )

  const inProgressKeys = useMemo(
    () => inProgressTabItems.map(item => item.key),
    [inProgressTabItems],
  )
  const withdrawnDuringKeys = useMemo(
    () => withdrawnDuringTabItems.map(item => item.key),
    [withdrawnDuringTabItems],
  )

  const preferredEducationScheduleLines = useMemo(
    () =>
      application && program
        ? resolveMypagePreferredScheduleLines({
            applicationType: application.applicationType ?? routeApplicationType ?? 'VOLUNTEER',
            answers: application.applicationAnswers,
            preferredEducationScheduleLabel: application.preferredEducationScheduleLabel,
            preferredScheduleOptionValues: application.preferredScheduleOptionValues,
            program,
          })
        : [],
    [application, program, routeApplicationType],
  )

  const volunteerApplicationExtras = useMemo(
    () => resolveVolunteerApplicationExtrasFromAnswers(application?.applicationAnswers),
    [application?.applicationAnswers],
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
          volunteerApplicationDetailPath(applicationId || 'unknown', routeApplicationType ?? undefined),
        ),
      )
      return
    }

    setIsAuthReady(true)
  }, [applicationId, navigate, routeApplicationType])

  useEffect(() => {
    if (application && !isVolunteerRoleApplication(application)) {
      navigate(`${educationApplicationDetailPath(application.id, application.applicationType)}${location.search}`, {
        replace: true,
      })
    }
  }, [application, location.search, navigate])

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
    navigate(resolveVolunteerListBackPath(location.state), { replace: true })
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
            navigate(MYPAGE_VOLUNTEER_PATH, { replace: true })
          },
        },
      )
      return
    }
    setIsCancelConfirmOpen(false)
    navigate(MYPAGE_VOLUNTEER_PATH, { replace: true })
  }

  if (isDetailLoading) {
    return (
      <EducationApplicationDetailLoading
        backLabel="봉사현황"
        onBack={handleBack}
      />
    )
  }

  if (!application || !isVolunteerRoleApplication(application)) {
    return (
      <section className={styles.page}>
        <EducationDetailBack label="봉사현황" onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          신청 정보를 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_VOLUNTEER_PATH)}>
          봉사현황으로
        </PFButton>
      </section>
    )
  }

  if (!program) {
    return (
      <section className={styles.page}>
        <EducationDetailBack label="봉사현황" onClick={handleBack} />
        <PFText as="p" typo="hd-md" color="black" className={styles.empty}>
          프로그램을 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => navigate(MYPAGE_VOLUNTEER_PATH)}>
          봉사현황으로
        </PFButton>
      </section>
    )
  }

  const showBanner = shouldShowDocumentPassBanner(application)
  const showCancelCta =
    application.cancellable ?? canCancelEducationApplication(application.displayStatus)
  const appliedSection = isAppliedSection(section) ? section : 'program'
  const activitySection = isActivitySection(section)
    ? section
    : isWithdrawnDuring
      ? (withdrawnDuringKeys[0] ?? 'schedule')
      : (inProgressKeys[0] ?? 'notice')

  const renderApplicationOrPlaceholder = () =>
    canShowEducationApplicationContent(application.displayStatus) ? (
      <EducationApplicationContent
        selfIntroMotivation={application.selfIntroMotivation}
        preferredEducationScheduleLines={groupScheduleLinesByDate(preferredEducationScheduleLines)}
        alwaysShowPreferredSchedule
        scheduleSummaryTitle="봉사 진행 가능 일정"
        freeTextSections={volunteerApplicationExtras.freeTextSections}
        infoFields={volunteerApplicationExtras.infoFields}
      />
    ) : (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
        신청 내용 화면은 준비 중입니다.
      </PFText>
    )

  const renderActivityBody = (active: EducationActivitySection) => {
    if (active === 'notice' && isActivityStatus) {
      return (
        <VolunteerNoticePanel
          program={program}
          selfIntroMotivation={application.selfIntroMotivation}
          preferredEducationScheduleLines={preferredEducationScheduleLines}
          alwaysShowPreferredSchedule
          lastParticipatedSession={lastParticipatedSession}
          applicationType={routeApplicationType}
          applicationId={application.id}
        />
      )
    }
    if (active === 'schedule') {
      if (schedulePanelKind === 'ujat-schedules') {
        return (
          <UjatVolunteerSchedulePanel
            applicationType={routeApplicationType}
            applicationId={application.id}
            listTitle="배정 및 출결 현황"
            readOnly={application.displayStatus === 'withdrawn'}
          />
        )
      }
      return (
        <VolunteerAssignmentPanel
          programAudience={program.programAudience}
          applicationType={routeApplicationType}
          applicationId={application.id}
          lastParticipatedSession={lastParticipatedSession}
        />
      )
    }
    if (active === 'survey') {
      return (
        <EducationSurveySection
          kind="survey"
          displayStatus={application.displayStatus}
          withdrawalPhase={application.withdrawalPhase}
          configured={program.surveyConfigured}
          remoteDetailEnabled={remoteDetailEnabled}
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
    if (active === 'satisfaction') {
      return (
        <EducationSurveySection
          kind="satisfaction"
          satisfactionAudience="student"
          displayStatus={application.displayStatus}
          withdrawalPhase={application.withdrawalPhase}
          configured={program.satisfactionConfigured}
          remoteDetailEnabled={remoteDetailEnabled}
          programTitle={program.title}
          educationScheduleLines={program.educationScheduleLines}
          educationTargetLabel={program.educationTargetDetailLabel}
          applicationType={routeApplicationType}
          applicationId={application.id}
          programId={program.id}
        />
      )
    }
    if (active === 'settlement') {
      return (
        <EducationSettlementPanel
          programId={program.id}
          applicationType={routeApplicationType}
          applicationId={application.id}
          operationEndAt={program.operatingPeriodEnd}
          lastParticipatedSession={lastParticipatedSession}
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
      <EducationDetailBack label="봉사현황" onClick={handleBack} />

      <EducationDetailHeader
        title={application.title}
        displayStatus={application.displayStatus}
        educationTargetLabel={program.educationTargetLabel}
        educationForm={program.educationForm}
        educationFormLabel={program.educationFormLabel}
      />

      {showBanner ? (
        <DocumentPassBanner interviewAtLabel={application.interviewAtLabel} />
      ) : null}

      {ujatWithdrawnView === 'error' ? (
        <div className={styles.errorStatus}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            배정 및 출결 현황을 불러오지 못했습니다.
          </PFText>
          <PFButton
            type="button"
            variant="tertiary"
            size="large"
            disabled={ujatSchedulesQuery.isRefetching}
            onClick={() => void ujatSchedulesQuery.refetch()}
          >
            다시 시도
          </PFButton>
        </div>
      ) : isProgramApplicationStatus ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={[...APPLIED_SECTION_TAB_ITEMS]}
            value={appliedSection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="봉사현황 상세 탭"
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
            ariaLabel="활동 포기 봉사 상세 탭"
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
            ariaLabel="진행중 봉사 상세 탭"
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
