import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  getMypageLnbItems,
  isInstructorMypageProfile,
  MYPAGE_PATH,
  MYPAGE_SETTLEMENT_PATH,
  MypageLayoutBootSkeleton,
  navigateMypageLnb,
  useMypageMember,
  useMypagePageAuthReady,
  type MypageLnbItemKey,
} from '@/features/mypage'
import {
  buildSettlementOverviewPath,
  EMPTY_SETTLEMENT_OVERVIEW,
  loadDevSettlementFixture,
  readSettlementOverviewParams,
  SETTLEMENT_OVERVIEW_VIEW_ITEMS,
  SettlementOverview,
  type SettlementOverviewPageData,
  type SettlementOverviewParams,
  type SettlementOverviewView,
} from '@/features/mypage/settlement'
import illustPiggyBankUrl from '@/shared/assets/illustration/illust-piggy-bank.png'
import { PFTabs, PFText } from '@/shared/ui'
import statusListTabsStyles from '@/features/mypage/shared/ui/mypage-status-list-tabs.module.css'
import { MypageLayout } from '@/widgets/mypage-layout'
import styles from './page.module.css'

export function MypageSettlementPage() {
  const navigate = useNavigate()
  const isAuthReady = useMypagePageAuthReady(MYPAGE_SETTLEMENT_PATH)
  const [params, setParams] = useState(readSettlementOverviewParams)
  const [data, setData] = useState<SettlementOverviewPageData>(EMPTY_SETTLEMENT_OVERVIEW)
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile, 'settlement')
  const isInstructor = isInstructorMypageProfile(member.profile)

  useEffect(() => {
    const onPopState = () => {
      setParams(readSettlementOverviewParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!isAuthReady || member.isLoading || isChecking || isRedirecting) return
    if (!isInstructor) {
      navigate(MYPAGE_PATH, { replace: true })
    }
  }, [isAuthReady, isChecking, isInstructor, isRedirecting, member.isLoading, navigate])

  useEffect(() => {
    let cancelled = false
    void loadDevSettlementFixture().then(fixture => {
      if (cancelled) return
      setData(fixture ?? EMPTY_SETTLEMENT_OVERVIEW)
    })
    return () => {
      cancelled = true
    }
  }, [params.fixture])

  const updateParams = (next: Partial<SettlementOverviewParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildSettlementOverviewPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    navigateMypageLnb(navigate, key)
  }

  if (!isAuthReady || isChecking || isRedirecting || member.isLoading || !isInstructor) {
    return (
      <MypageLayout variant="subpage" lnbItems={lnbItems} onLnbItemSelect={handleLnbItemSelect}>
        <MypageLayoutBootSkeleton />
      </MypageLayout>
    )
  }

  return (
    <MypageLayout variant="subpage" lnbItems={lnbItems} onLnbItemSelect={handleLnbItemSelect}>
      <header className={styles.pageTitleRow}>
        <span className={styles.pageIconWrap} aria-hidden="true">
          <img className={styles.pageIcon} src={illustPiggyBankUrl} alt="" />
        </span>
        <PFText as="h1" typo="page-title" color="black" className={styles.pageTitle}>
          정산 현황
        </PFText>
      </header>

      <PFTabs
        className={statusListTabsStyles.tabs}
        items={[...SETTLEMENT_OVERVIEW_VIEW_ITEMS]}
        value={params.view}
        onChange={view => updateParams({ view: view as SettlementOverviewView })}
        variant="pill"
        size="large"
        ariaLabel="정산 현황 보기"
      />

      <SettlementOverview params={params} data={data} onParamsChange={updateParams} />
    </MypageLayout>
  )
}
