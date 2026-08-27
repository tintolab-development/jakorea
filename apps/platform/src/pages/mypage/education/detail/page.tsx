import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  canCancelEducationApplication,
  cancelMockEducationApplication,
  educationApplicationDetailPath,
  EducationCancelConfirm,
  EducationDetailBack,
  EducationDetailHeader,
  DocumentPassBanner,
  getMockEducationApplicationById,
  MYPAGE_EDUCATION_PATH,
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

type DetailSection = 'program' | 'application'

const PROGRAM_APPLICATION_STATUSES = new Set<EducationDisplayStatus>([
  'waiting_result',
  'document_passed',
  'rejected',
])

const SECTION_TAB_ITEMS = [
  { key: 'program', label: '프로그램 정보' },
  { key: 'application', label: '신청 내용' },
] as const

function readSection(search = window.location.search): DetailSection {
  const value = new URLSearchParams(search).get('section')
  return value === 'application' ? 'application' : 'program'
}

function buildDetailPath(applicationId: string, section: DetailSection) {
  const base = educationApplicationDetailPath(applicationId)
  return section === 'program' ? base : `${base}?section=${section}`
}

export function MypageEducationDetailPage() {
  const navigate = useNavigate()
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

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate(MYPAGE_EDUCATION_PATH)
  }

  const handleSectionChange = (next: string) => {
    const nextSection = next === 'application' ? 'application' : 'program'
    setSection(nextSection)
    const nextPath = buildDetailPath(applicationId, nextSection)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
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

  const isProgramApplicationStatus = PROGRAM_APPLICATION_STATUSES.has(
    application.displayStatus,
  )
  const showBanner = shouldShowDocumentPassBanner(application)
  const showCancelCta = canCancelEducationApplication(application.displayStatus)

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
            items={[...SECTION_TAB_ITEMS]}
            value={section}
            onChange={handleSectionChange}
            variant="pill"
            size="large"
            ariaLabel="교육현황 상세 탭"
          />

          {section === 'program' ? (
            <ProgramInfoBody
              program={program}
              showApplyCta={false}
              showCancelCta={showCancelCta}
              onCancel={() => setIsCancelConfirmOpen(true)}
            />
          ) : (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
              신청 내용 화면은 준비 중입니다.
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
