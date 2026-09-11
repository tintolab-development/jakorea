import { PFButton, PFText } from '@/shared/ui'
import styles from './not-found.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'

export function FindEmailNotFoundPage() {
  const navigate = useNavigate()

  return (
    <section className={styles.root}>
      <div className={styles.body}>
        <PFText as="h1" typo="hd-md" color="black" className={authPageCopyClass('title')}>
          가입된 이메일 정보가 없어요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          JA Korea 계정을 찾을 수 없어요.
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={() => navigate('/auth/sign-up')}>
          회원가입 하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={() => navigate('/auth/sign-in')}>
          로그인 화면 돌아가기
        </PFButton>
      </div>
    </section>
  )
}
