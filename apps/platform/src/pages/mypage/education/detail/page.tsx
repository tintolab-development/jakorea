import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  canCancelEducationApplication,
  canShowEducationApplicationContent,
  cancelMockEducationApplication,
  educationApplicationDetailPath,
  EducationApplicationContent,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  EducationInProgressNoticePanel,
  DocumentPassBanner,
  getMockEducationApplicationById,
  MYPAGE_EDUCATION_PATH,
  resolveEducationListBackPath,
  shouldShowDocumentPassBanner,
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
type InProgressSection = 'notice' | 'schedule' | 'survey' | 'satisfaction' | 'settlement'
type DetailSection = AppliedSection | InProgressSection

const PROGRAM_APPLICATION_STATUSES = new Set<EducationDisplayStatus>([
  'waiting_result',
  'document_passed',
  'rejected',
])

const APPLIED_SECTION_TAB_ITEMS = [
  { key: 'program', label: '프로그램 정보' },
  { key: 'application', label: '신청 내용' },
] as const

const IN_PROGRESS_SECTION_TAB_ITEMS = [
  { key: 'notice', label: '안내사항' },
  { key: 'schedule', label: '교육일정' },
  { key: 'survey', label: '설문조사' },
  { key: 'satisfaction', label: '만족도조사' },
  { key: 'settlement', label: '정산현황' },
] as const

function isAppliedSection(value: string): value is AppliedSection {
  return value === 'program' || value === 'application'
}

function isInProgressSection(value: string): value is InProgressSection {
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

function readInProgressSection(search = window.location.search): InProgressSection {
  const value = new URLSearchParams(search).get('section')
  return value && isInProgressSection(value) ? value : 'notice'
}

function readSection(search = window.location.search): DetailSection {
  const value = new URLSearchParams(search).get('section')
  if (value && isInProgressSection(value)) return value
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

  const isProgramApplicationStatus = application
    ? PROGRAM_APPLICATION_STATUSES.has(application.displayStatus)
    : false
  const isInProgressStatus = application?.displayStatus === 'in_progress'

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
    if (isInProgressStatus && !isInProgressSection(section)) {
      setSection(readInProgressSection())
    }
    if (isProgramApplicationStatus && !isAppliedSection(section)) {
      setSection(readAppliedSection())
    }
  }, [isInProgressStatus, isProgramApplicationStatus, section])

  const handleBack = () => {
    navigate(resolveEducationListBackPath(location.state), { replace: true })
  }

  const handleSectionChange = (next: string) => {
    const nextSection = isInProgressStatus
      ? readInProgressSection(`?section=${next}`)
      : next === 'application'
        ? 'application'
        : 'program'
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
  const inProgressSection = isInProgressSection(section) ? section : 'notice'

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
          ) : canShowEducationApplicationContent(application.displayStatus) ? (
            <EducationApplicationContent
              selfIntroMotivation={application.selfIntroMotivation}
              preferredEducationScheduleLabel={application.preferredEducationScheduleLabel}
            />
          ) : (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
              신청 내용 화면은 준비 중입니다.
            </PFText>
          )}
        </>
      ) : isInProgressStatus ? (
        <>
          <PFTabs
            className={styles.tabs}
            items={[...IN_PROGRESS_SECTION_TAB_ITEMS]}
            value={inProgressSection}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="진행중 교육 상세 탭"
          />

          {inProgressSection === 'notice' ? (
            <EducationInProgressNoticePanel program={program} />
          ) : (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
              준비 중입니다.
            </PFText>
          )}
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
