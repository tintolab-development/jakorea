import { PFButton, PFText } from '@/shared/ui'
import illustLoginRequiredUrl from '@/shared/assets/illustration/graphic-84-02.png'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'
import { buildSignInPathWithRedirect } from '@/shared/lib/login-redirect'

export function RequiredPage() {
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  // 안전하지 않은 redirect는 버리고 로그인 화면만 연다
  const signInPath = buildSignInPathWithRedirect(searchParams.get('redirect'))

  const handleSignIn = () => {
    navigate(signInPath)
  }

  const handleSignUp = () => {
    navigate('/auth/sign-up')
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    navigate('/')
  }

  return (
    <section>
      <div className={styles.intro}>
        <img className={styles.illustration} src={illustLoginRequiredUrl} alt="" aria-hidden="true" />
        <PFText as="div" typo="hd-md" color="black" className={authPageCopyClass('title')}>
          로그인이 필요한 서비스예요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-700">
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

        <div className={styles.back}>
          <PFButton variant="text" size="medium" onClick={handleBack}>
            이전으로
          </PFButton>
        </div>
    </section>
  )
}
