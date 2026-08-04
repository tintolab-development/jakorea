import { useState } from 'react'
import { normalizeEmailId, validateEmailId } from '@/shared/lib/email-id'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const EMAIL_NOT_FOUND_MESSAGE =
  '가입한 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요.'
const MOCK_NOT_FOUND_EMAIL = 'ja@gmail.com'

export function FindPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) {
      setEmailError(null)
    }
  }

  const handleVerify = () => {
    const validation = validateEmailId(email)

    if (!validation.ok) {
      setEmailError(validation.message)
      return
    }

    if (validation.normalized === normalizeEmailId(MOCK_NOT_FOUND_EMAIL)) {
      setEmailError(EMAIL_NOT_FOUND_MESSAGE)
      return
    }

    window.location.assign('/auth/find-password/reset')
  }

  return (
    <section>
        <div className={styles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
            비밀번호를 다시 설정할게요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
            가입한 이메일과 본인 인증이 필요해요.
          </PFText>
        </div>

        <div className={styles.content}>
          <PFTextInput
            size="xlarge"
            label="이메일"
            type="email"
            placeholder="이메일을 입력해 주세요"
            autoComplete="email"
            required
            value={email}
            onValueChange={handleEmailChange}
            error={Boolean(emailError)}
            message={emailError ?? undefined}
            messageStatus="error"
          />

          <PFButton size="xlarge" width="100%" onClick={handleVerify}>
            본인인증 하기
          </PFButton>
        </div>
    </section>
  )
}
