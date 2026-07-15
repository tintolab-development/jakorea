import { useEffect, useState } from 'react'
import {
  getMypageLnbItems,
  getMypageProfileLabel,
  isGeneralMypageReady,
  MOCK_MYPAGE_PROGRAM_STATS,
  MOCK_MYPAGE_USER_NAME,
  MYPAGE_PATH,
  showInstructorApplyCta,
} from '@/features/mypage'
import { getDevAuthLoggedIn, getDevMemberProfile } from '@/shared/lib'
import { MypageLayout, mypageSettingsIconUrl } from '@/widgets/mypage-layout'
import { PFText } from '@/shared/ui'
import { ProgramStatCards } from './program-stat-cards'
import { SchedulePlaceholder } from './schedule-placeholder'
import styles from './page.module.css'

export function MypageHomePage() {
  const [isReady, setIsReady] = useState(false)
  const profile = getDevMemberProfile()
  const lnbItems = getMypageLnbItems(profile)
  const isGeneralReady = isGeneralMypageReady(profile)

  useEffect(() => {
    if (!getDevAuthLoggedIn()) {
      window.location.assign(`/auth/required?redirect=${encodeURIComponent(MYPAGE_PATH)}`)
      return
    }

    setIsReady(true)
  }, [])

  if (!isReady) {
    return null
  }

  return (
    <MypageLayout lnbItems={lnbItems} showInstructorApply={showInstructorApplyCta(profile)}>
      {isGeneralReady ? (
        <div className={styles.page}>
          <header className={styles.header}>
            <PFText as="h1" typo="page-title" color="black">
              {MOCK_MYPAGE_USER_NAME}님
            </PFText>
            <button
              className={styles.settingsButton}
              type="button"
              disabled
              aria-disabled="true"
            >
              <img
                className={styles.settingsIcon}
                src={mypageSettingsIconUrl}
                alt=""
                aria-hidden="true"
              />
              <PFText as="span" typo="bd-md-sb" color="black">
                회원정보 설정
              </PFText>
            </button>
          </header>

          <div className={styles.stats}>
            <ProgramStatCards stats={MOCK_MYPAGE_PROGRAM_STATS} />
          </div>

          <div className={styles.schedule}>
            <SchedulePlaceholder />
          </div>
        </div>
      ) : (
        <div className={styles.placeholder}>
          <PFText as="p" typo="hd-md" color="black">
            해당 회원 유형 마이페이지는 준비 중입니다
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {getMypageProfileLabel(profile)} 화면은 추후 제공될 예정이에요.
          </PFText>
        </div>
      )}
    </MypageLayout>
  )
}
