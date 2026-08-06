import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMypageLnbItems,
  getMypageProfileLabel,
  isGeneralMypageReady,
  MOCK_MYPAGE_PROGRAM_STATS,
  MYPAGE_PATH,
  showInstructorApplyCta,
  useMypageMember,
} from '@/features/mypage'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { MypageLayout, mypageSettingsIconUrl } from '@/widgets/mypage-layout'
import { PFText } from '@/shared/ui'
import { ProgramStatCards } from './program-stat-cards'
import { ScheduleSection } from './schedule-section'
import styles from './page.module.css'

export function MypageHomePage() {
  const navigate = useNavigate()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const member = useMypageMember()
  const lnbItems = getMypageLnbItems(member.profile)
  const isGeneralReady = isGeneralMypageReady(member.profile)

  useEffect(() => {
    if (!getDevAuthLoggedIn()) {
      navigate(`/auth/required?redirect=${encodeURIComponent(MYPAGE_PATH)}`)
      return
    }

    setIsAuthReady(true)
  }, [navigate])

  if (!isAuthReady) {
    return null
  }

  if (member.isRemoteSession && member.isLoading) {
    return (
      <MypageLayout lnbItems={lnbItems} showInstructorApply={showInstructorApplyCta(member.profile)}>
        <div className={styles.placeholder}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            회원 정보를 불러오는 중이에요…
          </PFText>
        </div>
      </MypageLayout>
    )
  }

  return (
    <MypageLayout lnbItems={lnbItems} showInstructorApply={showInstructorApplyCta(member.profile)}>
      {isGeneralReady ? (
        <div className={styles.page}>
          <header className={styles.header}>
            <PFText as="h1" typo="page-title" color="black">
              {member.displayName}님
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
            <ScheduleSection />
          </div>
        </div>
      ) : (
        <div className={styles.placeholder}>
          <PFText as="p" typo="hd-md" color="black">
            해당 회원 유형 마이페이지는 준비 중입니다
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            {getMypageProfileLabel(member.profile)} 화면은 추후 제공될 예정이에요.
          </PFText>
        </div>
      )}
    </MypageLayout>
  )
}
