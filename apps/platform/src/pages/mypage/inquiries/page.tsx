import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import {
  buildInquiryListPath,
  FaqTabContent,
  INQUIRY_TAB_ITEMS,
  InquiryTabContent,
  readInquiryListParams,
  type InquiryListParams,
  type InquiryTab,
} from '@/features/inquiry'
import {
  getMypageLnbItems,
  MYPAGE_INQUIRIES_PATH,
  MYPAGE_PATH,
  showInstructorApplyCta,
  useMypageMember,
  type MypageLnbItemKey,
} from '@/features/mypage'
import {
  getAccessToken,
  getDevAuthLoggedIn,
  isRemoteApiConfigured,
  resolveLoginRequiredPath,
} from '@/shared/lib'
import illustWordballoonsUrl from '@/shared/assets/illustration/illust-wordballoons.svg'
import { PFTabs, PFText } from '@/shared/ui'
import { MypageLayout } from '@/widgets/mypage-layout'
import styles from './page.module.css'

export function MypageInquiriesPage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [params, setParams] = useState(readInquiryListParams)
  const member = useMypageMember()
  const { isChecking, isRedirecting } = useAdminRegisteredNoticeRedirect()
  const lnbItems = getMypageLnbItems(member.profile, 'inquiries')

  useEffect(() => {
    const hasRemoteToken = isRemoteApiConfigured() && Boolean(getAccessToken())
    if (hasRemoteToken) {
      setIsAuthReady(true)
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(MYPAGE_INQUIRIES_PATH))
      return
    }

    setIsAuthReady(true)
  }, [navigate])

  useEffect(() => {
    const onPopState = () => {
      setParams(readInquiryListParams())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateParams = (next: Partial<InquiryListParams>) => {
    const merged = { ...params, ...next }
    setParams(merged)
    const nextPath = buildInquiryListPath(merged)
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (nextPath !== currentPath) {
      window.history.pushState(null, '', nextPath)
    }
  }

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    if (key === 'home') {
      navigate(MYPAGE_PATH)
    }
  }

  const handleTabChange = (tab: string) => {
    updateParams({ tab: tab as InquiryTab, page: 1 })
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
        <img className={styles.pageIcon} src={illustWordballoonsUrl} alt="" aria-hidden="true" />
        <PFText as="h1" typo="page-title" color="black" className={styles.pageTitle}>
          문의하기
        </PFText>
      </header>

      <PFTabs
        className={styles.tabs}
        items={[...INQUIRY_TAB_ITEMS]}
        value={params.tab}
        onChange={handleTabChange}
        variant="pill"
        size="large"
        ariaLabel="문의하기 탭"
      />

      {params.tab === 'faq' ? (
        <FaqTabContent params={params} onParamsChange={updateParams} />
      ) : (
        <InquiryTabContent params={params} onParamsChange={updateParams} />
      )}
    </MypageLayout>
  )
}
