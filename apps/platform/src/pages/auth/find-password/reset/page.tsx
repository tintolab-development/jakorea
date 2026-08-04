import { useState } from 'react'
import { isValidPassword } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

const PASSWORD_HELP_TEXT = '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.'
const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.'

export function FindPasswordResetPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit =
    isValidPassword(newPassword) && confirmPassword.length > 0 && newPassword === confirmPassword

  const handleSubmit = () => {
    // TODO: 비밀번호 변경 API 연동
    window.location.assign('/auth/find-password/complete')
  }

  return (
    <section>
        <div className={styles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
            새 비밀번호를 입력해 주세요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
            이제 새 비밀번호로 로그인할 수 있어요.
          </PFText>
        </div>

        <div className={styles.content}>
          <div className={styles.passwordInputsContainer}>
            <PFTextInput
              size="xlarge"
              label="새 비밀번호"
              type="password"
              placeholder="새 비밀번호를 입력해 주세요"
              autoComplete="new-password"
              required
              value={newPassword}
              onValueChange={setNewPassword}
              message={PASSWORD_HELP_TEXT}
            />
            <PFTextInput
              size="xlarge"
              label="새 비밀번호 확인"
              type="password"
              placeholder="비밀번호를 한 번 더 입력해 주세요"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onValueChange={setConfirmPassword}
              message={isMismatch ? PASSWORD_MISMATCH_MESSAGE : undefined}
              messageStatus="error"
              error={isMismatch}
            />
          </div>

          <PFButton size="xlarge" width="100%" disabled={!canSubmit} onClick={handleSubmit}>
            비밀번호 변경하기
          </PFButton>
        </div>
    </section>
  )
}
