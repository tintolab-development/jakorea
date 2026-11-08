import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  getMypageLnbItems,
  MYPAGE_PATH,
  MypageHomeContentSkeleton,
  MypageLayoutBootSkeleton,
  navigateMypageLnb,
  showInstructorApplyCta,
  useMypageMember,
  useMypagePageAuthReady,
  type MypageLnbItemKey,
} from '@/features/mypage'
import { usePortalCalendarQuery, usePortalDashboardQuery } from '@/features/mypage/home/api/hooks'
import { MypageLayout } from '@/widgets/mypage-layout'
import { MypageHomeContent } from './home-content'

const EMPTY_PROGRAM_STATS = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}
export function MypageHomePage() {
  const navigate = useNavigate()
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile)
  const isAuthReady = useMypagePageAuthReady(MYPAGE_PATH)
  const dashboard = usePortalDashboardQuery(member.isRemoteSession)
  const calendar = usePortalCalendarQuery(calendarMonth, member.isRemoteSession)
  const programStatsLoading = member.isRemoteSession && dashboard.isLoading
  const programStats =
    member.isRemoteSession && dashboard.stats ? dashboard.stats : EMPTY_PROGRAM_STATS
  const scheduleEvents = member.isRemoteSession ? calendar.events : []

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    navigateMypageLnb(navigate, key)
  }

  if (!isAuthReady || isChecking || isRedirecting) {
    return (
      <MypageLayout
        lnbItems={lnbItems}
        showInstructorApply={showInstructorApplyCta(member.profile)}
        onLnbItemSelect={handleLnbItemSelect}
      >
        <MypageLayoutBootSkeleton />
      </MypageLayout>
    )
  }

  if (member.isRemoteSession && member.isLoading) {
    return (
      <MypageLayout
        lnbItems={lnbItems}
        showInstructorApply={showInstructorApplyCta(member.profile)}
        onLnbItemSelect={handleLnbItemSelect}
      >
        <MypageHomeContentSkeleton />
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
        programStatsLoading={programStatsLoading}
        scheduleEvents={scheduleEvents}
        scheduleEventsLoading={member.isRemoteSession && calendar.isLoading}
        useMockDemoMonth={!member.isRemoteSession}
        onViewMonthChange={member.isRemoteSession ? setCalendarMonth : undefined}
      />
    </MypageLayout>
  )
}
