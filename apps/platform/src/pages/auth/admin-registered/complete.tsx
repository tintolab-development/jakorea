import { useEffect } from 'react'
import { clearAdminRegisteredWizardState } from '@/features/auth/admin-registered'
import { setDevAuthLoggedIn } from '@/shared/lib'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import sharedStyles from './shared.module.css'

export function AdminRegisteredCompletePage() {
  useEffect(() => {
    setDevAuthLoggedIn(true)
    clearAdminRegisteredWizardState()
  }, [])

  const handleStart = () => {
    window.location.assign('/')
  }

  const handleGoMyPage = () => {
    window.location.assign('/')
  }

  const handleConnectSocial = () => {
    window.location.assign('/auth/sign-up/social-connect')
  }

  return (
    <section className={sharedStyles.page}>
      <div className={sharedStyles.container}>
        <div className={sharedStyles['complete-intro']}>
          <img
            className={sharedStyles['complete-illustration']}
            src={illustCheckUrl}
            alt=""
            aria-hidden="true"
          />
          <PFText as="h1" typo="hd-md" color="black" className={sharedStyles['complete-title']}>
            확인이 완료되었어요!
          </PFText>
          <PFText
            as="p"
            typo="bd-lg-rg"
            color="primary-800"
            className={sharedStyles['complete-description']}
          >
            JA Korea의 다양한 프로그램과 소식을 확인해 보세요.
          </PFText>
        </div>

        <div className={sharedStyles['actions-terms']}>
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
      </div>
    </section>
  )
}
