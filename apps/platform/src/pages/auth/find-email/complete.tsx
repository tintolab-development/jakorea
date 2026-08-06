import illustSearchUrl from '@/shared/assets/illustration/illust-search.png'
import { PFButton, PFText } from '@/shared/ui'
import styles from './complete.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'

const MOCK_MASKED_EMAIL = 'Ja****@gmail.com'

export function FindEmailCompletePage() {
  const navigate = useNavigate()
  const handleGoLogin = () => {
    navigate('/auth/sign-in')
  }

  const handleResetPassword = () => {
    navigate('/auth/find-password')
  }

  return (
    <section>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustSearchUrl} alt="" aria-hidden="true" />
          <PFText as="h1" typo="hd-md" color="black" className={authPageCopyClass('title')}>
            가입한 이메일을 찾았어요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
            아래 이메일로 로그인할 수 있어요.
          </PFText>
        </div>

        <div className={styles.emailBox} aria-label="찾은 이메일">
          <PFText typo="bd-lg-sb" color="black">
            {MOCK_MASKED_EMAIL}
          </PFText>
        </div>

        <div className={styles.actions}>
          <PFButton size="xlarge" width="100%" onClick={handleGoLogin}>
            로그인하기
          </PFButton>
          <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleResetPassword}>
            비밀번호 재설정하기
          </PFButton>
        </div>
    </section>
  )
}
