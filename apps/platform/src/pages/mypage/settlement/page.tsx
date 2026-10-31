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
  useSettlementOverviewQuery,
  type SettlementOverviewPageData,
  type SettlementOverviewParams,
  type SettlementOverviewView,
} from '@/features/mypage/settlement'
import illustPiggyBankUrl from '@/shared/assets/illustration/illust-piggy-bank.png'
import { PFTabs, PFText } from '@/shared/ui'
import statusListTabsStyles from '@/features/mypage/shared/ui/mypage-status-list-tabs.module.css'
import { MypageLayout } from '@/widgets/mypage-layout'
import styles from './page.module.css'

/**
 * 정산 현황.
 * 강사·강사겸교사 LNB 전용. 비강사는 /mypage로 리다이렉트(현 기획 유지 — 변경 시 기획 확인).
 * 데이터: remote GET settlement-applications + individual-settlements schedules.
 * ?fixture=1 은 DEV 전용 샘플만.
 */
export function MypageSettlementPage() {
  const navigate = useNavigate()
  const isAuthReady = useMypagePageAuthReady(MYPAGE_SETTLEMENT_PATH)
  const [params, setParams] = useState(readSettlementOverviewParams)
  const [fixtureData, setFixtureData] = useState<SettlementOverviewPageData | null>(null)
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
    if (!params.fixture) {
      setFixtureData(null)
      return
    }
    void loadDevSettlementFixture().then(fixture => {
      if (cancelled) return
      setFixtureData(fixture)
    })
    return () => {
      cancelled = true
    }
  }, [params.fixture])

  const remoteQuery = useSettlementOverviewQuery({
    enabled:
      isAuthReady &&
      !member.isLoading &&
      !isChecking &&
      !isRedirecting &&
      isInstructor,
    month: params.month,
    fixture: params.fixture,
  })

  const data: SettlementOverviewPageData = params.fixture
    ? (fixtureData ?? EMPTY_SETTLEMENT_OVERVIEW)
    : (remoteQuery.data ?? EMPTY_SETTLEMENT_OVERVIEW)

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

  const showBoot =
    !isAuthReady ||
    isChecking ||
    isRedirecting ||
    member.isLoading ||
    !isInstructor ||
    (!params.fixture && remoteQuery.isLoading)

  if (showBoot) {
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

      <SettlementOverview
        params={params}
        data={data}
        onParamsChange={updateParams}
        onRefresh={
          params.fixture
            ? undefined
            : () => {
                void remoteQuery.refetch()
              }
        }
        refreshing={remoteQuery.isFetching}
      />
    </MypageLayout>
  )
}
