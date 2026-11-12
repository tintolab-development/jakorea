/**
 * Homepage Admin 로그인 페이지
 * 로그인 → CMS auth + Homepage remote API
 */

import { Form, Typography, Space, Alert } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton, CmsInput } from '@/shared/ui'
import { useEffect, useState } from 'react'
import type { LoginRequest } from '@/entities/auth/model/types'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { LoginAdminApprovalPendingNotice } from '@/features/auth/ui/login-admin-approval-pending-notice'
import { isAdminLoginApprovalPendingError } from '@/features/auth/errors/admin-login-approval-pending-error'
import { useLoginAttempts } from '@/features/auth/hooks/use-login-attempts'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'
import {
  canShowDevRoleLogin,
  DEV_LOGIN_QA_ACCOUNTS,
} from '@/features/auth/lib/dev-login-accounts'
import { AuthLogoLink } from '@/features/auth/ui/auth-logo-link'
import { LoginUtilityLinks } from '@/features/auth/ui/login-utility-links'
import { LoginSocialSection } from '@/features/auth/ui/login-social-section'
import './login-page.css'

const { Text } = Typography

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const { login, loading, error, isAuthenticated, requiresMfa, user, clearError } = authStore
  const [form] = Form.useForm()
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [showAdminApprovalPending, setShowAdminApprovalPending] = useState(false)
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const apiLoginAvailable = isRemoteApiConfigured()

  const {
    failedAttempts,
    isLocked,
    recordFailure,
    recordSuccess,
    checkLocked,
    getRemainingLockMinutes,
  } = useLoginAttempts()

  const redirectPath = searchParams.get('redirect') || undefined

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirectPath || '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate, redirectPath])

  const submitLogin = async (values: LoginRequest) => {
    if (checkLocked()) {
      return
    }

    if (!apiLoginAvailable) {
      console.error('API 서버가 설정되지 않았습니다. `.env`에 `VITE_API_SERVER`를 확인하세요.')
      return
    }

    setLoginSubmitting(true)
    setShowAdminApprovalPending(false)

    try {
      const result = await login(values)
      recordSuccess()

      if (result?.requiresMfa) {
        setMfaModalOpen(true)
        return
      }

      navigate(redirectPath || '/', { replace: true })
    } catch (loginError: unknown) {
      if (isAdminLoginApprovalPendingError(loginError)) {
        clearError()
        setShowAdminApprovalPending(true)
        return
      }

      recordFailure()
      console.error('login failed', loginError)
    } finally {
      setLoginSubmitting(false)
    }
  }

  const handleLoginClick = async () => {
    try {
      const values = await form.validateFields()
      await submitLogin(values as LoginRequest)
    } catch {
      // 폼 검증 실패
    }
  }

  useEffect(() => {
    if (isAuthenticated && !requiresMfa && mfaModalOpen && user) {
      setMfaModalOpen(false)
      navigate(redirectPath || '/', { replace: true })
    }
  }, [isAuthenticated, requiresMfa, mfaModalOpen, navigate, user, redirectPath])

  return (
    <div className="login-page">
      <div className="login-card">
        <AuthLogoLink wrapperClassName="login-logo-wrapper" logoClassName="login-logo" />

        <p className="login-notice">
          본 시스템은 승인된 관리자 전용입니다.
          <br />
          보안을 위해 접속 및 중요 작업의 이력이 저장됩니다.
        </p>

        <div className="login-form-wrapper">
          <Form
            form={form}
            name="login"
            autoComplete="off"
            layout="vertical"
            requiredMark={false}
            className="login-form"
            onValuesChange={() => {
              if (showAdminApprovalPending) {
                setShowAdminApprovalPending(false)
              }
              if (error) {
                clearError()
              }
            }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '이메일을 입력해 주세요.' },
                { type: 'email', message: '올바른 이메일 형식을 입력해 주세요.' },
              ]}
            >
              <CmsInput
                label="이메일"
                required
                inputSize="xlarge"
                allowClear
                width="100%"
                placeholder="이메일 주소를 입력해 주세요"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
            >
              <CmsInput
                label="비밀번호"
                required
                type="password"
                inputSize="xlarge"
                allowClear
                width="100%"
                placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password"
                disabled={isLocked}
              />
            </Form.Item>

            {showAdminApprovalPending && <LoginAdminApprovalPendingNotice />}

            {isLocked && (
              <Alert
                type="error"
                description={
                  <div>
                    <Text>
                      로그인 시도가 {LOGIN_POLICY.maxFailedAttempts}회 실패하여 계정이 잠겼습니다.
                    </Text>
                    <br />
                    <Text>
                      {getRemainingLockMinutes() !== null && (
                        <>{getRemainingLockMinutes()}분 후 다시 시도해주세요.</>
                      )}
                    </Text>
                  </div>
                }
                showIcon
                className="login-alert"
              />
            )}

            {!isLocked && failedAttempts > 0 && failedAttempts < LOGIN_POLICY.maxFailedAttempts && (
              <Alert
                type="warning"
                message={`로그인 실패: ${failedAttempts}회`}
                description={`${LOGIN_POLICY.maxFailedAttempts - failedAttempts}회 더 실패하면 계정이 ${LOGIN_POLICY.lockoutDurationMinutes}분간 잠깁니다.`}
                showIcon
                className="login-alert"
              />
            )}

            {error && !isLocked && !showAdminApprovalPending && (
              <div className="login-error">
                <Text type="danger">{error.message || '로그인에 실패했습니다.'}</Text>
              </div>
            )}

            <Form.Item className="login-submit-actions">
              <CmsButton
                variant="primary"
                type="submit"
                size="h52" className="login-submit-btn"
                loading={loading && loginSubmitting}
                disabled={isLocked || !apiLoginAvailable}
                onClick={() => void handleLoginClick()} >
                로그인하기
              </CmsButton>
            </Form.Item>
          </Form>

          <LoginUtilityLinks />
          <LoginSocialSection />

          {canShowDevRoleLogin() ? (
            <div className="login-dev-quick">
              <Text type="secondary" className="login-dev-quick__label">
                권한별 로그인
              </Text>
              <Space size="small" wrap>
              {DEV_LOGIN_QA_ACCOUNTS.map(account => (
                <CmsButton
                  key={account.key}
                  variant="default"
                  size="h32"
                  onClick={() => {
                    form.setFieldsValue({
                      email: account.email,
                      password: account.password,
                    })
                  }} >
                  {account.label}
                </CmsButton>
              ))}
            </Space>
            <Text type="secondary" className="login-dev-quick__hint">
              로컬 공통 비밀번호 admin1234! · MFA 000000
            </Text>
          </div>
          ) : null}
        </div>
      </div>

      <MfaVerificationModal open={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  )
}
