import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './complete.module.css'

const SOCIAL_CONNECT_PATH = '/auth/sign-up/social-connect'

export function SignUpSocialConnectCompletePage() {
  const handleStart = () => {
    window.location.assign('/')
  }

  const handleConnectMore = () => {
    window.location.assign(SOCIAL_CONNECT_PATH)
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustCheckUrl} alt="" aria-hidden="true" />
          <PFText as="div" typo="hd-md" color="black" className={styles.title}>
            소셜 계정이 연결되었어요!
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
            다음부터 이 계정으로 간편하게 로그인할 수 있어요.
          </PFText>
        </div>

        <div className={styles.actions}>
          <PFButton size="xlarge" width="100%" onClick={handleStart}>
            시작하기
          </PFButton>
          <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleConnectMore}>
            다른 소셜계정도 연결하기
          </PFButton>
        </div>
      </div>
    </section>
  )
}
