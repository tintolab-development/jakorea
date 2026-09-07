import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildEducationApplicationListPath,
  EDUCATION_APPLICATION_TAB_ITEMS,
  getMypageLnbItems,
  MYPAGE_EDUCATION_PATH,
  navigateMypageLnb,
  readEducationApplicationListParams,
  showInstructorApplyCta,
  useMypageMember,
  type EducationApplicationListParams,
  type EducationApplicationTab,
  type MypageLnbItemKey,
} from '@/features/mypage'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import illustBookUrl from '@/shared/assets/illustration/illust-book.svg'
import { PFTabs, PFText } from '@/shared/ui'
import { MypageLayout } from '@/widgets/mypage-layout'
import { EducationListContent } from './list-content'
import styles from './page.module.css'

export function MypageEducationPage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [params, setParams] = useState(readEducationApplicationListParams)
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile, 'education')

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(MYPAGE_EDUCATION_PATH))
      return
    }

    setIsAuthReady(true)
  }, [navigate])

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
    const nextPath = buildEducationApplicationListPath(merged)
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
    return null
  }

  return (
    <MypageLayout
      variant="subpage"
      lnbItems={lnbItems}
      showInstructorApply={showInstructorApplyCta(member.profile)}
      onLnbItemSelect={handleLnbItemSelect}
    >
      <header className={styles.pageTitleRow}>
        <span className={styles.pageIconWrap} aria-hidden="true">
          <img className={styles.pageIcon} src={illustBookUrl} alt="" />
        </span>
        <PFText as="h1" typo="page-title" color="black" className={styles.pageTitle}>
          교육현황
        </PFText>
      </header>

      <PFTabs
        className={styles.tabs}
        items={[...EDUCATION_APPLICATION_TAB_ITEMS]}
        value={params.tab}
        onChange={handleTabChange}
        variant="pill"
        size="large"
        ariaLabel="교육현황 탭"
      />

      <EducationListContent params={params} onParamsChange={updateParams} />
    </MypageLayout>
  )
}
