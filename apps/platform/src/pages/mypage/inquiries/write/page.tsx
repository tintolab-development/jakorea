import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRegisteredNoticeRedirect } from '@/features/auth/admin-registered'
import { MYPAGE_INQUIRIES_PATH, MYPAGE_PATH } from '@/features/mypage'
import {
  getMypageLnbItems,
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
import { PFText } from '@/shared/ui'
import { MypageLayout } from '@/widgets/mypage-layout'
import styles from './page.module.css'

export function MypageInquiriesWritePage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
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

  const handleLnbItemSelect = (key: MypageLnbItemKey) => {
    if (key === 'home') {
      navigate(MYPAGE_PATH)
    }
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
      <PFText as="h1" typo="page-title" color="black" className={styles.title}>
        1:1 문의 작성
      </PFText>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.placeholder}>
        1:1 문의 작성 화면은 준비 중입니다.
      </PFText>
    </MypageLayout>
  )
}
