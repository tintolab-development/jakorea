import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  EDUCATION_APPLICATION_TAB_ITEMS,
  getMypageLnbItems,
  MYPAGE_VOLUNTEER_PATH,
  MypageLayoutBootSkeleton,
  navigateMypageLnb,
  readEducationApplicationListParams,
  showInstructorApplyCta,
  useMypageMember,
  useMypagePageAuthReady,
  type EducationApplicationListParams,
  type EducationApplicationTab,
  type MypageLnbItemKey,
} from '@/features/mypage'
import { buildVolunteerApplicationListPath } from '@/features/mypage/volunteer'
import illustTeardropsUrl from '@/shared/assets/illustration/illust-teardrops.svg'
import { PFTabs, PFText } from '@/shared/ui'
import statusListTabsStyles from '@/features/mypage/shared/ui/mypage-status-list-tabs.module.css'
import { MypageLayout } from '@/widgets/mypage-layout'
import { VolunteerListContent } from './list-content'
import styles from './page.module.css'

export function MypageVolunteerPage() {
  const navigate = useNavigate()
  const isAuthReady = useMypagePageAuthReady(MYPAGE_VOLUNTEER_PATH)
  const [params, setParams] = useState(readEducationApplicationListParams)
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile, 'volunteer')

  useEffect(() => {
    const onPopState = () => {
      setParams(readEducationApplicationListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<EducationApplicationListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildVolunteerApplicationListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    navigateMypageLnb(navigate, key)
  }

  const handleTabChange = (tab: string) => {
    updateParams({ tab: tab as EducationApplicationTab, page: 1 })
  }

  if (!isAuthReady || isChecking || isRedirecting) {
    return (
      <MypageLayout
        variant="subpage"
        lnbItems={lnbItems}
        showInstructorApply={showInstructorApplyCta(member.profile)}
        onLnbItemSelect={handleLnbItemSelect}
      >
        <MypageLayoutBootSkeleton />
      </MypageLayout>
    )
  }

  return (
    <MypageLayout
      variant="subpage"
      lnbItems={lnbItems}
      showInstructorApply={showInstructorApplyCta(member.profile)}
      onLnbItemSelect={handleLnbItemSelect}
    >
      <header className={styles.pageTitleRow}>
        <img className={styles.pageIcon} src={illustTeardropsUrl} alt="" aria-hidden="true" />
        <PFText as="h1" typo="page-title" color="black" className={styles.pageTitle}>
          봉사현황
        </PFText>
      </header>

      <PFTabs
        className={statusListTabsStyles.tabs}
        items={[...EDUCATION_APPLICATION_TAB_ITEMS]}
        value={params.tab}
        onChange={handleTabChange}
        variant="pill"
        size="large"
        ariaLabel="봉사현황 탭"
      />

      <VolunteerListContent params={params} onParamsChange={updateParams} />
    </MypageLayout>
  )
}
