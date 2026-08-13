/**
 * 최초 로그인 — 본인인증 후 비밀번호 변경 (스크린샷3)
 */

import { Form } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchAdminPasswordChange } from '@/features/auth/api/admin-password-change-fetcher'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  clearPasswordChangeRequiredWizardState,
  getPasswordChangeRequiredWizardState,
  hasBirthGender,
  hasIdentityVerified,
  usePasswordChangeRequiredGuard,
  validatePasswordChangeRequiredForm,
} from '@/features/auth/password-change-required'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { LoadingButton } from '@/shared/ui/loading-button'
import { CmsInput, useCmsAlert } from '@/shared/ui'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'

type FormValues = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

export function PasswordChangeRequiredChangePasswordPage() {
  const navigate = useNavigate()
  const { showAlert } = useCmsAlert()
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const { isReady, user } = usePasswordChangeRequiredGuard()
  const clearPasswordChangeRequired = useAuthStore(state => state.clearPasswordChangeRequired)
  const wizardState = getPasswordChangeRequiredWizardState()
  const birthReady = hasBirthGender(wizardState)
  const identityReady = hasIdentityVerified(wizardState)

  useEffect(() => {
    if (!isReady) return
    if (!birthReady) {
      navigate(passwordChangeRequiredPaths.birth, { replace: true })
      return
    }
    if (!identityReady) {
      navigate(passwordChangeRequiredPaths.identity, { replace: true })
    }
  }, [isReady, birthReady, identityReady, navigate])

  const handleSubmit = async (values: FormValues) => {
    if (!wizardState?.email) {
      navigate(passwordChangeRequiredPaths.notice, { replace: true })
      return
    }

    const validation = validatePasswordChangeRequiredForm({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.newPasswordConfirm,
      initialPassword: wizardState.email,
    })

    if (validation) {
      const fieldName =
        validation.field === 'current'
          ? 'currentPassword'
          : validation.field === 'new'
            ? 'newPassword'
            : 'newPasswordConfirm'
      form.setFields([{ name: fieldName, errors: [validation.message] }])
      return
    }

    setSubmitting(true)
    try {
      await fetchAdminPasswordChange({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      clearPasswordChangeRequired()
      clearPasswordChangeRequiredWizardState()
      showAlert({
        title: '비밀번호 변경 완료',
        content: '비밀번호가 변경되었습니다. 서비스를 이용해 주세요.',
      })
      navigate(user ? getRedirectPathByRole(user) : '/', { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'
      form.setFields([{ name: 'currentPassword', errors: [message] }])
    } finally {
      setSubmitting(false)
    }
  }

  if (!isReady || !birthReady || !identityReady) {
    return null
  }

  return (
    <AuthPageShell showLogo={false} cardClassName="register-card">
      <div className="admin-register-step">
        <RegisterStepHeader
          title="비밀번호를 변경해 주세요."
          description="현재 비밀번호는 가입된 이메일 주소와 동일합니다."
        />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="auth-form admin-register-step__form"
          onFinish={values => {
            void handleSubmit(values)
          }}
        >
          <Form.Item
            name="currentPassword"
            rules={[{ required: true, message: '현재 비밀번호를 입력해 주세요.' }]}
          >
            <CmsInput
              label="현재 비밀번호"
              required
              type="password"
              inputSize="xlarge"
              width="100%"
              placeholder="현재 비밀번호를 입력해 주세요."
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            rules={[{ required: true, message: '새 비밀번호를 입력해 주세요.' }]}
          >
            <CmsInput
              label="새 비밀번호"
              required
              type="password"
              inputSize="xlarge"
              width="100%"
              placeholder="새 비밀번호를 입력해 주세요"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="newPasswordConfirm"
            rules={[{ required: true, message: '새 비밀번호를 한 번 더 입력해 주세요.' }]}
          >
            <CmsInput
              label="새 비밀번호 확인"
              required
              type="password"
              inputSize="xlarge"
              width="100%"
              placeholder="새 비밀번호를 한 번 더 입력해 주세요"
              autoComplete="new-password"
            />
          </Form.Item>

          <div className="auth-actions admin-register-step__actions">
            <LoadingButton
              type="primary"
              htmlType="submit"
              block
              className="auth-submit-btn"
              loading={submitting}
            >
              비밀번호 변경하기
            </LoadingButton>
          </div>
        </Form>
      </div>
    </AuthPageShell>
  )
}
