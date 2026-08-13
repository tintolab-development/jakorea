import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMypageLnbItems,
  getMypageProfileLabel,
  isGeneralMypageReady,
  MOCK_MYPAGE_PROGRAM_STATS,
  MOCK_MYPAGE_SCHEDULE_EVENTS,
  MYPAGE_PATH,
  showInstructorApplyCta,
  useMypageMember,
  type MypageProgramStats,
  type MypageScheduleEvent,
} from '@/features/mypage'

const EMPTY_PROGRAM_STATS: MypageProgramStats = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}
const EMPTY_SCHEDULE_EVENTS: MypageScheduleEvent[] = []
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
  /** API 로그인 세션에서는 mock 통계·일정을 쓰지 않음 (실 API 연동 전 빈 값) */
  const programStats = member.isRemoteSession ? EMPTY_PROGRAM_STATS : MOCK_MYPAGE_PROGRAM_STATS
  const scheduleEvents = member.isRemoteSession
    ? EMPTY_SCHEDULE_EVENTS
    : MOCK_MYPAGE_SCHEDULE_EVENTS

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
            <ProgramStatCards stats={programStats} />
          </div>

          <div className={styles.schedule}>
            <ScheduleSection
              events={scheduleEvents}
              useMockDemoMonth={!member.isRemoteSession}
            />
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
