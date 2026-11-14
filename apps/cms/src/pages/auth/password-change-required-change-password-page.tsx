/**
 * 최초 로그인 — 본인인증 후 비밀번호 변경 (step 2)
 * 이메일(읽기전용) · 새 비밀번호 · 확인 — 인풋 그룹 간격 40px
 */

import { Form } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import { fetchAdminPasswordChange } from '@/features/auth/api/admin-password-change-fetcher'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  PASSWORD_CHANGE_REQUIRED_STEP_CHANGE_PASSWORD,
  PASSWORD_CHANGE_REQUIRED_STEP_PROGRESS_LABEL,
  PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS,
  getPasswordChangeRequiredWizardState,
  hasIdentityVerified,
  hasPasswordChangeRequiredComplete,
  markPasswordChangeRequiredComplete,
  usePasswordChangeRequiredGuard,
  validatePasswordChangeRequiredForm,
} from '@/features/auth/password-change-required'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'
import { RegisterStepProgress } from '@/features/auth/ui/admin-register/register-step-progress'
import { AuthPageShell } from '@/features/auth/ui/auth-page-shell'
import { CmsButton, CmsInput } from '@/shared/ui'
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
  const identityVerificationRequired = useAuthStore(state => state.identityVerificationRequired)
  const setIdentityVerificationRequired = useAuthStore(
    state => state.setIdentityVerificationRequired
  )
  const wizardState = getPasswordChangeRequiredWizardState()
  // 서버 값이 있으면 그 값으로(BE R1), 없으면(배포 전) 기존처럼 이 탭의 본인인증 완료 여부로 판단한다
  const identityReady =
    identityVerificationRequired === null
      ? hasIdentityVerified(wizardState)
      : identityVerificationRequired === false
  const email = wizardState?.email?.trim() ?? ''

  useEffect(() => {
    if (hasPasswordChangeRequiredComplete()) {
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
      return
    }
    if (!isReady) return
    if (!identityReady) {
      navigate(passwordChangeRequiredPaths.identity, { replace: true })
    }
  }, [isReady, identityReady, navigate])

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
      // 방어 — 본인인증 확정 전이면 본인인증 단계로 되돌린다
      if (error instanceof AdminMfaApiError && error.code === 'ADMIN_IDENTITY_NOT_VERIFIED') {
        setIdentityVerificationRequired(true)
        navigate(passwordChangeRequiredPaths.identity, { replace: true })
        return
      }
      const message =
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'
      form.setFields([{ name: 'newPassword', errors: [message] }])
    } finally {
      setSubmitting(false)
    }
  }

  if (!isReady || !identityReady) {
    return null
  }

  return (
    <AuthPageShell
      showLogo={false}
      cardClassName="register-card auth-card--password-change-required-change"
    >
      <div className="register-page-content">
        <RegisterStepProgress
          currentStep={PASSWORD_CHANGE_REQUIRED_STEP_CHANGE_PASSWORD}
          totalSteps={PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS}
          ariaLabel={PASSWORD_CHANGE_REQUIRED_STEP_PROGRESS_LABEL}
        />
        <RegisterStepHeader
          title="비밀번호를 입력해 주세요."
          description="안전한 계정 이용을 위해 주기적으로 변경해 주세요."
        />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="auth-form password-change-required-change-form"
          onFinish={values => {
            void handleSubmit(values)
          }}
        >
          <div style={{ marginTop: '40px' }}>
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
            rules={[{ required: true, message: '새 비밀번호를 입력해 주세요.' }]}
          >
            <CmsInput
              label="새 비밀번호"
              required
              type="password"
              inputSize="xlarge"
              width="100%"
              style={{ marginTop: '20px' }}
              placeholder="새 비밀번호를 입력해 주세요"
              autoComplete="new-password"
              allowClear
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
              allowClear
            />
          </Form.Item>

          <div className="auth-actions" style={{ marginTop: '20px' }}>
            <CmsButton variant="primary" size="h52" type="submit" loading={submitting}>
              비밀번호 변경하기
            </CmsButton>
          </div>
        </Form>
      </div>
    </AuthPageShell>
  )
}
