import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  getMypageLnbItems,
  getMockMypageProgramStats,
  getMockMypageScheduleEvents,
  MYPAGE_EDUCATION_PATH,
  MYPAGE_INQUIRIES_PATH,
  MYPAGE_PATH,
  showInstructorApplyCta,
  useMypageMember,
  type MypageLnbItemKey,
  type MypageProgramStats,
  type MypageScheduleEvent,
} from '@/features/mypage'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import { MypageLayout } from '@/widgets/mypage-layout'
import { PFText } from '@/shared/ui'
import { MypageHomeContent } from './home-content'
import styles from './page.module.css'

const EMPTY_PROGRAM_STATS: MypageProgramStats = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}
const EMPTY_SCHEDULE_EVENTS: MypageScheduleEvent[] = []

export function MypageHomePage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile)
  /** API 로그인 세션에서는 mock 통계·일정을 쓰지 않음 (실 API 연동 전 빈 값) */
  const programStats = member.isRemoteSession
    ? EMPTY_PROGRAM_STATS
    : getMockMypageProgramStats()
  const scheduleEvents = member.isRemoteSession
    ? EMPTY_SCHEDULE_EVENTS
    : getMockMypageScheduleEvents()

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(MYPAGE_PATH))
      return
    }

    setIsAuthReady(true)
  }, [navigate])

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    if (key === 'education') {
      navigate(MYPAGE_EDUCATION_PATH)
      return
    }
    if (key === 'inquiries') {
      navigate(MYPAGE_INQUIRIES_PATH)
    }
  }

  if (!isAuthReady || isChecking || isRedirecting) {
    return null
  }

  if (member.isRemoteSession && member.isLoading) {
    return (
      <MypageLayout
        lnbItems={lnbItems}
        showInstructorApply={showInstructorApplyCta(member.profile)}
        onLnbItemSelect={handleLnbItemSelect}
      >
        <div className={styles.placeholder}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            회원 정보를 불러오는 중이에요…
          </PFText>
        </div>
      </MypageLayout>
    )
  }

  return (
    <MypageLayout
      lnbItems={lnbItems}
      showInstructorApply={showInstructorApplyCta(member.profile)}
      onLnbItemSelect={handleLnbItemSelect}
    >
      <MypageHomeContent
        member={member}
        programStats={programStats}
        scheduleEvents={scheduleEvents}
        useMockDemoMonth={!member.isRemoteSession}
      />
    </MypageLayout>
  )
}
