import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  getMypageLnbItems,
  getMockMypageProgramStats,
  getMockMypageScheduleEvents,
  MYPAGE_PATH,
  navigateMypageLnb,
  showInstructorApplyCta,
  useMypageMember,
  type MypageLnbItemKey,
} from '@/features/mypage'
import { usePortalCalendarQuery, usePortalDashboardQuery } from '@/features/mypage/home/api/hooks'
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

const EMPTY_PROGRAM_STATS = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}
export function MypageHomePage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile)
  const dashboard = usePortalDashboardQuery(member.isRemoteSession)
  const calendar = usePortalCalendarQuery(calendarMonth, member.isRemoteSession)
  const programStats = member.isRemoteSession
    ? (dashboard.stats ?? EMPTY_PROGRAM_STATS)
    : getMockMypageProgramStats()
  const scheduleEvents = member.isRemoteSession ? calendar.events : getMockMypageScheduleEvents()

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
    navigateMypageLnb(navigate, key)
  }

  if (!isAuthReady || isChecking || isRedirecting) {
    return null
  }

  if (member.isRemoteSession && (member.isLoading || dashboard.isLoading)) {
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
        onViewMonthChange={member.isRemoteSession ? setCalendarMonth : undefined}
      />
    </MypageLayout>
  )
}
