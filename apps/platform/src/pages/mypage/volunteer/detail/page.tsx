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
  EducationSurveyEmptyPanel,
  EducationSurveyFillPanel,
  DocumentPassBanner,
  getEducationSurveyTabAvailability,
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
import {
  VolunteerAssignmentPanel,
  VolunteerNoticePanel,
  resolveVolunteerListBackPath,
} from '@/features/mypage/volunteer'
import { ProgramInfoBody, useProgramDetail } from '@/features/program'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { resolveMypagePreferredScheduleLines } from '@/features/mypage/education/applications/lib/mypage-preferred-schedule-lines'
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
  const remoteProgramQuery = useProgramDetail(
    application?.programId ?? null,
    { fresh: true },
  )
  const program = remoteProgramQuery.program
  const isApplicationLoading = remoteDetailEnabled && remoteApplicationQuery.isLoading
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
        preferredEducationScheduleLines={preferredEducationScheduleLines}
        alwaysShowPreferredSchedule
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
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
          applicationType={routeApplicationType}
          applicationId={application.id}
        />
      )
    }
    if (active === 'schedule') {
      return (
        <VolunteerAssignmentPanel
          programAudience={program.programAudience}
          applicationType={routeApplicationType}
          applicationId={application.id}
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
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
          />
        )
      }
      return <EducationSurveyEmptyPanel kind="survey" />
    }
    if (active === 'satisfaction') {
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
      <EducationDetailBack label="봉사현황" onClick={handleBack} />

      <EducationDetailHeader
        title={program.title}
        displayStatus={application.displayStatus}
        educationTargetLabel={program.educationTargetLabel}
        educationForm={program.educationForm}
        educationFormLabel={program.educationFormLabel}
      />

      {showBanner ? (
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
