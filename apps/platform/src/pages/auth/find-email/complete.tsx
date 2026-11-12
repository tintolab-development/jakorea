import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearFoundEmail, peekFoundEmail } from '@/features/auth/find-email'
import illustSearchUrl from '@/shared/assets/illustration/illust-search.png'
import { PFButton, PFText } from '@/shared/ui'
import styles from './complete.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

export function FindEmailCompletePage() {
  const navigate = useNavigate()
  // 본인인증 후 찾은 이메일 원문 — 화면 상태에만 두고, 메모리 전달값은 마운트 직후 비운다.
  const [email] = useState(() => peekFoundEmail())

  useEffect(() => {
    clearFoundEmail()
    if (!email) {
      navigate('/auth/find-email', { replace: true })
    }
  }, [email, navigate])

  if (!email) {
    return null
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
          {email}
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={() => navigate('/auth/sign-in')}>
          로그인하기
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          onClick={() => navigate('/auth/find-password')}
        >
          비밀번호 재설정하기
        </PFButton>
      </div>
    </section>
  )
}
