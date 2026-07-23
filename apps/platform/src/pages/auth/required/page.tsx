import { PFButton, PFText } from '@/shared/ui'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation.svg'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

export function RequiredPage() {
  const searchParams = new URLSearchParams(window.location.search)
  const redirectPath = searchParams.get('redirect')
  const signInPath = redirectPath
    ? `/auth/sign-in?redirect=${encodeURIComponent(redirectPath)}`
    : '/auth/sign-in'

  const handleSignIn = () => {
    window.location.assign(signInPath)
  }

  const handleSignUp = () => {
    window.location.assign('/auth/sign-up')
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign('/')
  }

  return (
    <section>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustQuotationUrl} alt="" aria-hidden="true" />
          <PFText as="div" typo="hd-md" color="black" className={authPageCopyClass('title')}>
            로그인이 필요한 서비스예요
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="primary-700" className={authPageCopyClass('description')}>
            JA Korea 회원으로 로그인하면
            <br />
            신청과 활동 내역을 이어서 확인할 수 있어요.
          </PFText>
        </div>

        <div className={styles.actions}>
          <PFButton size="xlarge" className={styles.actionButton} onClick={handleSignIn}>
            로그인하기
          </PFButton>
          <PFButton
            size="xlarge"
            variant="secondary"
            className={styles.actionButton}
            onClick={handleSignUp}
          >
            회원가입하기
          </PFButton>
        </div>

        <PFButton variant="text" size="medium" onClick={handleBack}>
          이전으로
        </PFButton>
    </section>
  )
}
