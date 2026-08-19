import { useCallback, useId, useState } from 'react'
import { getLoginApiErrorMessage, usePortalPasswordChangeMutation } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import { validateSettingsChangePassword } from '../lib/change-password'
import styles from './change-password-modal.module.css'

export type SettingsChangePasswordModalProps = {
  open: boolean
  onClose: () => void
}

const EMPTY_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export function SettingsChangePasswordModal({ open, onClose }: SettingsChangePasswordModalProps) {
  const descriptionId = useId()
  const passwordChangeMutation = usePortalPasswordChangeMutation()
  const [currentPassword, setCurrentPassword] = useState(EMPTY_FORM.currentPassword)
  const [newPassword, setNewPassword] = useState(EMPTY_FORM.newPassword)
  const [confirmPassword, setConfirmPassword] = useState(EMPTY_FORM.confirmPassword)
  const [currentPasswordError, setCurrentPasswordError] = useState<string>()
  const [newPasswordError, setNewPasswordError] = useState<string>()
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>()

  const isBusy = passwordChangeMutation.isPending

  const resetForm = () => {
    setCurrentPassword(EMPTY_FORM.currentPassword)
    setNewPassword(EMPTY_FORM.newPassword)
    setConfirmPassword(EMPTY_FORM.confirmPassword)
    setCurrentPasswordError(undefined)
    setNewPasswordError(undefined)
    setConfirmPasswordError(undefined)
  }

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose])

  const clearFieldErrors = () => {
    setCurrentPasswordError(undefined)
    setNewPasswordError(undefined)
    setConfirmPasswordError(undefined)
  }

  const handleSubmit = async () => {
    if (isBusy) {
      return
    }

    const validation = validateSettingsChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    })

    clearFieldErrors()

    if (validation) {
      if (validation.field === 'current') {
        setCurrentPasswordError(validation.message)
      } else if (validation.field === 'new') {
        setNewPasswordError(validation.message)
      } else {
        setConfirmPasswordError(validation.message)
      }
      return
    }

    if (isRemoteApiConfigured()) {
      try {
        await passwordChangeMutation.mutateAsync({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        })
      } catch (error) {
        setCurrentPasswordError(getLoginApiErrorMessage(error, '비밀번호를 변경하지 못했습니다.'))
        return
      }
    }

    handleClose()
  }

  return (
    <PFModal
      open={open}
      size="md"
      title="비밀번호 변경"
      ariaDescribedBy={descriptionId}
      onClose={handleClose}
    >
      <div className={styles.guide} id={descriptionId}>
        <PFText as="p" typo="bd-sm-rg" color="black" className={styles.guideText}>
          개인정보를 안전하게 보호하기 위해 비밀번호를 주기적(90일)으로 변경해 주세요. <br />
          비밀번호는 8자 이상의 영문, 숫자, 특수문자를 조합하여 사용 가능합니다.
        </PFText>{' '}
      </div>
      <div className={styles.content}>
        <div className={styles.fields}>
          <PFTextInput
            size="xlarge"
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호를 입력해 주세요"
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
            placeholder="변경할 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            required
            value={newPassword}
            onValueChange={value => {
              setNewPassword(value)
              setNewPasswordError(undefined)
            }}
            error={Boolean(newPasswordError)}
            message={newPasswordError}
            messageStatus="error"
          />
          <PFTextInput
            size="xlarge"
            label="새 비밀번호 확인"
            type="password"
            placeholder="변경할 비밀번호를 확인해 주세요"
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

        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={isBusy}
            onClick={handleClose}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            size="xlarge"
            disabled={isBusy}
            onClick={() => {
              void handleSubmit()
            }}
          >
            {isBusy ? '변경 중…' : '수정완료'}
          </PFButton>
        </div>
      </div>
    </PFModal>
  )
}
