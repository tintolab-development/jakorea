import { useEffect } from 'react'
import {
  clearAdminRegisteredWizardState,
  finishAdminRegisteredOnboardingToSignIn,
} from '@/features/auth/admin-registered'
import { MYPAGE_PATH } from '@/features/mypage'
import { isRemoteApiConfigured, setAdminOnboardingRequired, setDevAuthLoggedIn } from '@/shared/lib'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import sharedStyles from './shared.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'

export function AdminRegisteredCompletePage() {
  const navigate = useNavigate()
  useEffect(() => {
    if (isRemoteApiConfigured()) {
      finishAdminRegisteredOnboardingToSignIn()
      return
    }
    setAdminOnboardingRequired(false)
    clearAdminRegisteredWizardState()
    setDevAuthLoggedIn(true)
  }, [navigate])

  const handleStart = () => {
    navigate('/')
  }

  const handleGoMyPage = () => {
    navigate(MYPAGE_PATH)
  }

  const handleConnectSocial = () => {
    navigate('/auth/sign-up/social-connect')
  }

  return (
    <section>
        <div className={sharedStyles.completeIntro}>
          <img
            className={sharedStyles.completeIllustration}
            src={illustCheckUrl}
            alt=""
            aria-hidden="true"
          />
          <PFText as="h1" typo="hd-md" color="black" className={authPageCopyClass('title', sharedStyles.completeTitle)}>
            확인이 완료되었어요!
          </PFText>
          <PFText
            as="p"
            typo="bd-lg-rg"
            color="primary-800"
            className={authPageCopyClass('description', sharedStyles.completeDescription)}
          >
            JA Korea의 다양한 프로그램과 소식을 확인해 보세요.
          </PFText>
        </div>

        <div className={sharedStyles.actionsTerms}>
          <PFButton size="xlarge" width="100%" onClick={handleStart}>
            시작하기
          </PFButton>
          <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleGoMyPage}>
            마이페이지로 이동하기
          </PFButton>
          <PFButton variant="text" size="large" width="100%" onClick={handleConnectSocial}>
            소셜계정 연결하기
          </PFButton>
        </div>
    </section>
  )
}
