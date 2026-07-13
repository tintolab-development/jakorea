import { useState } from 'react'
import {
  requireAdminRegisteredWizardState,
  validateAdminRegisteredChangePassword,
} from '@/features/auth/admin-registered'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import sharedStyles from './shared.module.css'

const PASSWORD_HELP_TEXT = '영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.'

export function AdminRegisteredChangePasswordPage() {
  const wizardState = requireAdminRegisteredWizardState()

  if (!wizardState?.birthDate || !wizardState.gender) {
    window.location.assign('/auth/admin-registered/birth')
    return null
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState<string>()
  const [newPasswordError, setNewPasswordError] = useState<string>()
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>()

  const clearErrors = () => {
    setCurrentPasswordError(undefined)
    setNewPasswordError(undefined)
    setConfirmPasswordError(undefined)
  }

  const handleSubmit = () => {
    const validation = validateAdminRegisteredChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
      initialPassword: wizardState.email,
    })

    clearErrors()

    if (validation) {
      if (validation.field === 'current') {
        setCurrentPasswordError(validation.message)
      } else if (validation.field === 'new') {
        setNewPasswordError(validation.message)
      } else if (validation.field === 'confirm') {
        setConfirmPasswordError(validation.message)
      }
      return
    }

    // TODO: POST /api/auth/password/change API 연동
    window.location.assign('/auth/admin-registered/confirm')
  }

  return (
    <section className={sharedStyles.page}>
      <div className={sharedStyles.container}>
        <div className={sharedStyles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={sharedStyles.title}>
            비밀번호를 변경해 주세요.
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={sharedStyles.description}>
            안전한 계정 이용을 위해 주기적으로 변경해 주세요.
          </PFText>
        </div>

        <div className={sharedStyles.content}>
          <div className={sharedStyles['password-inputs-container']}>
            <PFTextInput
              size="xlarge"
              label="현재 비밀번호"
              type="password"
              placeholder="현재 비밀번호를 입력해 주세요."
              autoComplete="current-password"
              required
              value={currentPassword}
              onValueChange={value => {
                setCurrentPassword(value)
                setCurrentPasswordError(undefined)
              }}
              error={Boolean(currentPasswordError)}
              message={currentPasswordError}
              messageStatus="error"
            />
            <PFTextInput
              size="xlarge"
              label="새 비밀번호"
              type="password"
              placeholder="새 비밀번호를 입력해 주세요"
              autoComplete="new-password"
              required
              value={newPassword}
              onValueChange={value => {
                setNewPassword(value)
                setNewPasswordError(undefined)
              }}
              error={Boolean(newPasswordError)}
              message={newPasswordError ?? PASSWORD_HELP_TEXT}
              messageStatus={newPasswordError ? 'error' : 'neutral'}
            />
            <PFTextInput
              size="xlarge"
              label="새 비밀번호 확인"
              type="password"
              placeholder="새 비밀번호를 한 번 더 입력해 주세요"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onValueChange={value => {
                setConfirmPassword(value)
                setConfirmPasswordError(undefined)
              }}
              error={Boolean(confirmPasswordError)}
              message={confirmPasswordError}
              messageStatus="error"
            />
          </div>
        </div>

        <PFButton size="xlarge" width="100%" onClick={handleSubmit}>
          비밀번호 변경하기
        </PFButton>
      </div>
    </section>
  )
}
