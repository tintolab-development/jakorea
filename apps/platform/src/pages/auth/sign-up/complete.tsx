import { MYPAGE_PATH } from '@/features/mypage'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './complete.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

export function SignUpCompletePage() {
  const handleStart = () => {
    window.location.assign('/')
  }

  const handleGoMyPage = () => {
    window.location.assign(MYPAGE_PATH)
  }

  const handleConnectSocial = () => {
    window.location.assign('/auth/sign-up/social-connect')
  }

  return (
    <section>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustCheckUrl} alt="" aria-hidden="true" />
          <PFText as="div" typo="hd-md" color="black" className={authPageCopyClass('title')}>
            가입이 완료되었어요!
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={authPageCopyClass('description')}>
            이제 JA Korea의 다양한 프로그램과 소식을
            <br />
            확인할 수 있어요.
          </PFText>
        </div>

        <div className={styles.actions}>
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
