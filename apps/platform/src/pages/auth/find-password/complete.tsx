import { clearAdminRegisteredPasswordChangeRequired } from '@/features/auth/admin-registered'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './complete.module.css'

export function FindPasswordCompletePage() {
  const handleGoLogin = () => {
    clearAdminRegisteredPasswordChangeRequired()
    window.location.assign('/auth/sign-in')
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustCheckUrl} alt="" aria-hidden="true" />
          <PFText as="h1" typo="hd-md" color="black" className={styles.title}>
            비밀번호가 변경되었어요.
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
            새 비밀번호로 로그인해 주세요.
          </PFText>
        </div>

        <div className={styles.actions}>
          <PFButton size="xlarge" width="100%" onClick={handleGoLogin}>
            로그인하기
          </PFButton>
        </div>
      </div>
    </section>
  )
}
