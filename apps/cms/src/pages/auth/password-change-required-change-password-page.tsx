/**
 * 최초 로그인 — 본인인증 후 비밀번호 변경 (step 3)
 * 이메일(읽기전용) · 새 비밀번호 · 확인 — 인풋 그룹 간격 40px
 */

import { Form } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchAdminPasswordChange } from '@/features/auth/api/admin-password-change-fetcher'
import {
  getPasswordChangeRequiredWizardState,
  hasBirthGender,
  hasIdentityVerified,
  hasPasswordChangeRequiredComplete,
  markPasswordChangeRequiredComplete,
  usePasswordChangeRequiredGuard,
  validatePasswordChangeRequiredForm,
  PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS,
} from '@/features/auth/password-change-required'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { LoadingButton } from '@/shared/ui/loading-button'
import { CmsInput } from '@/shared/ui'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'

import './register-page.css'
import './password-change-required-change-password-page.css'

type FormValues = {
  newPassword: string
  newPasswordConfirm: string
}

export function PasswordChangeRequiredChangePasswordPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const { isReady } = usePasswordChangeRequiredGuard()
  const wizardState = getPasswordChangeRequiredWizardState()
  const birthReady = hasBirthGender(wizardState)
  const identityReady = hasIdentityVerified(wizardState)
  const email = wizardState?.email?.trim() ?? ''

  useEffect(() => {
    if (hasPasswordChangeRequiredComplete()) {
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
      return
    }
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
    if (!email) {
      navigate(passwordChangeRequiredPaths.notice, { replace: true })
      return
    }

    const validation = validatePasswordChangeRequiredForm({
      newPassword: values.newPassword,
      confirmPassword: values.newPasswordConfirm,
      initialPassword: email,
    })

    if (validation) {
      const fieldName = validation.field === 'new' ? 'newPassword' : 'newPasswordConfirm'
      form.setFields([{ name: fieldName, errors: [validation.message] }])
      return
    }

    setSubmitting(true)
    try {
      await fetchAdminPasswordChange({
        currentPassword: email,
        newPassword: values.newPassword.trim(),
      })
      markPasswordChangeRequiredComplete()
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'
      form.setFields([{ name: 'newPassword', errors: [message] }])
    } finally {
      setSubmitting(false)
    }
  }

  if (!isReady || !birthReady || !identityReady) {
    return null
  }

  return (
    <AuthPageShell
      showLogo={false}
      cardClassName="register-card auth-card--password-change-required-change"
    >
      <RegisterStepProgress
        currentStep={3}
        totalSteps={PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS}
        className="register-step-progress--password-change-required"
      />
      <div className="admin-register-step admin-register-step--password-change-required">
        <RegisterStepHeader
          title="비밀번호를 변경해 주세요."
          description="현재 비밀번호는 가입된 이메일 주소와 동일합니다."
        />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="auth-form admin-register-step__form password-change-required-change-form"
          onFinish={values => {
            void handleSubmit(values)
          }}
        >
          <div className="password-change-required-change-form__field">
            <CmsInput
              label="이메일"
              value={email}
              disabled
              inputSize="xlarge"
              width="100%"
              allowClear={false}
              autoComplete="username"
            />
          </div>

          <Form.Item
            name="newPassword"
            className="password-change-required-change-form__item"
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
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="newPasswordConfirm"
            className="password-change-required-change-form__item"
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
              allowClear
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
