import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildInProgressDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  canCancelEducationApplication,
  canShowEducationApplicationContent,
  cancelMockEducationApplication,
  educationApplicationDetailPath,
  EducationApplicationContent,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  EducationInProgressNoticePanel,
  EducationSchedulePanel,
  EducationSettlementPanel,
  EducationSurveyEmptyPanel,
  EducationSurveyFillPanel,
  DocumentPassBanner,
  getEducationSurveyMockAvailability,
  getMockEducationApplicationById,
  isWithdrawnBeforeEducation,
  isWithdrawnDuringEducation,
  MYPAGE_EDUCATION_PATH,
  resolveEducationListBackPath,
  resolveEducationScheduleTabLabel,
  shouldShowDocumentPassBanner,
  type EducationActivitySection,
  type EducationDisplayStatus,
} from '@/features/mypage'
import { ProgramInfoBody, useMockProgramById } from '@/features/program'
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

function buildDetailPath(applicationId: string, section: DetailSection) {
  const base = educationApplicationDetailPath(applicationId)
  if (section === 'program' || section === 'notice') return base
  return `${base}?section=${section}`
}

export function MypageEducationDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId = '' } = useParams<{ applicationId: string }>()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [section, setSection] = useState(readSection)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()

  const mockEnabled = useShouldUsePlatformMockData()
  const application = useMemo(
    () => getMockEducationApplicationById(applicationId),
    [applicationId, mockEnabled],
  )
  const { program, isLoading: isProgramLoading } = useMockProgramById(
    application?.programId ?? '',
  )

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

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(educationApplicationDetailPath(applicationId || 'unknown')))
      return
    }

    setIsAuthReady(true)
  }, [applicationId, navigate])

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
    const nextPath = buildDetailPath(applicationId, nextSection)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.replaceState(null, '', nextPath)
    }
  }

  const handleConfirmCancel = () => {
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
  const showCancelCta = canCancelEducationApplication(application.displayStatus)
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
        preferredEducationScheduleLabel={application.preferredEducationScheduleLabel}
      />
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
        />
      )
    }
    if (active === 'schedule') {
      return (
        <EducationSchedulePanel
          programId={program.id}
          lastParticipatedSession={
            isWithdrawnDuring ? application.lastParticipatedSession : undefined
          }
          listTitle={resolveEducationScheduleTabLabel(program.detailCase)}
        />
      )
    }
    if (active === 'survey') {
      const surveyAvailability = getEducationSurveyMockAvailability({
        displayStatus: application.displayStatus,
        withdrawalPhase: application.withdrawalPhase,
        surveyConfigured: program.surveyConfigured,
      })
      if (surveyAvailability === 'active') {
        return <EducationSurveyFillPanel programTitle={program.title} />
      }
      return <EducationSurveyEmptyPanel kind="survey" />
    }
    if (active === 'satisfaction') {
      return <EducationSurveyEmptyPanel kind="satisfaction" />
    }
    if (active === 'settlement') {
      return (
        <EducationSettlementPanel
          programId={program.id}
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
      <EducationDetailBack onClick={handleBack} />

      <EducationDetailHeader
        title={program.title}
        displayStatus={application.displayStatus}
        educationTargetLabel={program.educationTargetLabel}
        educationForm={program.educationForm}
        educationFormLabel={program.educationFormLabel}
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
