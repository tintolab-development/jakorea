/**
 * 내 정보 확인 — 관리자 비밀번호 변경 모달
 */

import { Form } from 'antd'
import { useState } from 'react'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import { fetchAdminPasswordChange } from '@/features/auth/api/admin-password-change-fetcher'
import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_CONDITION_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { CmsButton, CmsInput, ContentModal, useCmsAlert } from '@/shared/ui'
import './profile-password-change-modal.css'

export interface ProfilePasswordChangeModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

type ProfilePasswordChangeFormValues = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

const MODAL_DESCRIPTION =
  '개인정보를 안전하게 보호하기 위해 비밀번호를 주기적(90일)으로 변경해 주세요.\n비밀번호는 12자 이상의 영문, 숫자, 특수문자를 조합하여 사용 가능합니다.'

const NEW_PASSWORD_CONFIRM_MISMATCH_ALERT = {
  title: '비밀번호 불일치 안내',
  content:
    '새 비밀번호 확인이 새 비밀번호와 일치하지 않습니다.\n비밀번호를 확인 후 다시 시도해 주세요.',
}

const NEW_PASSWORD_CONDITION_ALERT = {
  title: '비밀번호 조건 안내',
  content: `${REGISTER_PASSWORD_CONDITION_MESSAGE}\n비밀번호를 확인 후 다시 시도해 주세요.`,
}

const CURRENT_PASSWORD_MISMATCH_ALERT = {
  title: '비밀번호 불일치 안내',
  content: '현재 비밀번호가 일치하지 않습니다.\n비밀번호를 확인 후 다시 시도해 주세요.',
}

const PASSWORD_CHANGE_CURRENT_MISMATCH_CODES = new Set([
  'INVALID_PASSWORD',
  'PASSWORD_MISMATCH',
  'CURRENT_PASSWORD_INVALID',
  'CURRENT_PASSWORD_MISMATCH',
  'WRONG_PASSWORD',
])

function resolvePasswordChangeFailureAlert(error: unknown): {
  title: string
  content: string
} {
  if (error instanceof AdminMfaApiError) {
    const code = error.code.trim().toUpperCase()
    if (code === 'VALIDATION_FAILED') {
      return NEW_PASSWORD_CONDITION_ALERT
    }
    if (PASSWORD_CHANGE_CURRENT_MISMATCH_CODES.has(code) || code.includes('CURRENT_PASSWORD')) {
      return CURRENT_PASSWORD_MISMATCH_ALERT
    }
  }
  const message =
    error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'
  return {
    title: '비밀번호 변경 실패',
    content: message,
  }
}

type PasswordFieldRowProps = {
  label: string
  name: keyof ProfilePasswordChangeFormValues
  placeholder: string
  autoComplete: string
}

function PasswordFieldRow({ label, name, placeholder, autoComplete }: PasswordFieldRowProps) {
  return (
    <div className="profile-password-change-modal__row">
      <label className="profile-password-change-modal__label" htmlFor={`profile-password-${name}`}>
        <span className="profile-password-change-modal__label-text">{label}</span>
        <span className="profile-password-change-modal__required" aria-hidden>
          *
        </span>
      </label>
      <div className="profile-password-change-modal__control">
        <Form.Item name={name} className="profile-password-change-modal__form-item">
          <CmsInput
            id={`profile-password-${name}`}
            type="password"
            inputSize="large"
            width="100%"
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        </Form.Item>
      </div>
    </div>
  )
}

export function ProfilePasswordChangeModal({
  open,
  onCancel,
  onSuccess,
}: ProfilePasswordChangeModalProps) {
  const [form] = Form.useForm<ProfilePasswordChangeFormValues>()
  const { showAlert } = useCmsAlert()
  const [submitting, setSubmitting] = useState(false)

  const handleCancel = () => {
    if (submitting) return
    form.resetFields()
    onCancel()
  }

  const handleChangeComplete = async () => {
    if (submitting) return

    const values = form.getFieldsValue()
    const currentPassword = (values.currentPassword ?? '').trim()
    const nextPassword = (values.newPassword ?? '').trim()
    const nextPasswordConfirm = (values.newPasswordConfirm ?? '').trim()

    if (!currentPassword || !nextPassword || !nextPasswordConfirm) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }

    if (!isValidRegisterPassword(currentPassword)) {
      showAlert(NEW_PASSWORD_CONDITION_ALERT)
      return
    }

    if (!isValidRegisterPassword(nextPassword)) {
      showAlert(NEW_PASSWORD_CONDITION_ALERT)
      return
    }

    if (nextPassword !== nextPasswordConfirm) {
      showAlert(NEW_PASSWORD_CONFIRM_MISMATCH_ALERT)
      return
    }

    setSubmitting(true)
    try {
      await fetchAdminPasswordChange({
        currentPassword,
        newPassword: nextPassword,
      })
      form.resetFields()
      onSuccess?.()
      onCancel()
      showAlert({
        title: '비밀번호 변경 완료',
        content: '비밀번호가 변경되었습니다.',
      })
    } catch (error) {
      showAlert(resolvePasswordChangeFailureAlert(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="비밀번호 변경"
      description={MODAL_DESCRIPTION}
      width={600}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={handleCancel} disabled={submitting}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            loading={submitting}
            onClick={() => {
              void handleChangeComplete()
            }}
          >
            변경 완료
          </CmsButton>
        </>
      }
    >
      <Form form={form} requiredMark={false} layout="vertical">
        <div className="profile-password-change-modal__fields">
          <PasswordFieldRow
            label="현재 비밀번호"
            name="currentPassword"
            placeholder="현재 비밀번호를 입력해 주세요"
            autoComplete="current-password"
          />
          <PasswordFieldRow
            label="새 비밀번호"
            name="newPassword"
            placeholder="변경할 비밀번호를 입력해 주세요"
            autoComplete="new-password"
          />
          <PasswordFieldRow
            label="새 비밀번호 확인"
            name="newPasswordConfirm"
            placeholder="변경할 비밀번호를 확인해 주세요"
            autoComplete="new-password"
          />
        </div>
      </Form>
    </ContentModal>
  )
}
