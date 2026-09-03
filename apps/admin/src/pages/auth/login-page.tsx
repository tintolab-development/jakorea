/**
 * Homepage Admin 로그인 페이지
 * Mock 로그인 → local mock 데이터 / API 로그인 → CMS auth + Homepage remote API
 */

import { Form, Input, Button, Typography, Space, Alert } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore, type LoginMode } from '@/features/auth/model/auth-store'
import { LoadingButton } from '@/shared/ui/loading-button'
import { useEffect, useState } from 'react'
import type { LoginRequest } from '@/entities/auth/model/types'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { LoginAdminApprovalPendingNotice } from '@/features/auth/ui/login-admin-approval-pending-notice'
import { isAdminLoginApprovalPendingError } from '@/features/auth/errors/admin-login-approval-pending-error'
import { useLoginAttempts } from '@/features/auth/hooks/use-login-attempts'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'
import { DEV_LOGIN_QA_ACCOUNTS } from '@/features/auth/lib/dev-login-accounts'
import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
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
  const [loginMode, setLoginMode] = useState<LoginMode | null>(null)
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

  const submitLogin = async (values: LoginRequest, mode: LoginMode) => {
    if (checkLocked()) {
      return
    }

    if (mode === 'api' && !apiLoginAvailable) {
      console.error('API 서버가 설정되지 않았습니다. `.env`에 `VITE_API_SERVER`를 확인하세요.')
      return
    }

    setLoginMode(mode)
    setShowAdminApprovalPending(false)

    try {
      const result = await login(values, { mode })
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
      setLoginMode(null)
    }
  }

  const handleLoginClick = async (mode: LoginMode) => {
    try {
      const values = await form.validateFields()
      await submitLogin(values as LoginRequest, mode)
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
          인가된 관리자만 접속 가능하며, 중요 활동의 경우 로그로 기록됩니다.
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
              label={<AuthFormLabel>이메일</AuthFormLabel>}
              rules={[
                { required: true, message: '이메일을 입력해 주세요.' },
                { type: 'email', message: '올바른 이메일 형식을 입력해 주세요.' },
              ]}
            >
              <Input placeholder="이메일 주소를 입력해 주세요" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label={<AuthFormLabel>비밀번호</AuthFormLabel>}
              rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
            >
              <Input.Password
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
              <LoadingButton
                type="primary"
                block
                className="login-submit-btn"
                loading={loading && loginMode === 'api'}
                disabled={isLocked || !apiLoginAvailable}
                onClick={() => void handleLoginClick('api')}
              >
                API 로그인
              </LoadingButton>
              <LoadingButton
                block
                className="login-secondary-btn"
                loading={loading && loginMode === 'mock'}
                disabled={isLocked}
                onClick={() => void handleLoginClick('mock')}
              >
                Mock 로그인
              </LoadingButton>
              {!apiLoginAvailable && (
                <Text type="secondary" className="login-api-hint">
                  API 로그인은 `VITE_API_SERVER` 설정 후 사용할 수 있습니다. Mock 로그인은 목
                  데이터를 사용합니다.
                </Text>
              )}
            </Form.Item>
          </Form>

          <LoginUtilityLinks
            registerPath={
              redirectPath ? `/register?redirect=${encodeURIComponent(redirectPath)}` : '/register'
            }
          />
          <LoginSocialSection />

          {import.meta.env.DEV && (
            <div className="login-dev-quick">
              <Text type="secondary" className="login-dev-quick__label">
                임시 로그인 (DEV)
              </Text>
              <Space size="small" wrap>
                {DEV_LOGIN_QA_ACCOUNTS.map(account => (
                  <Button
                    key={account.key}
                    size="small"
                    onClick={() => {
                      form.setFieldsValue({
                        email: account.email,
                        password: account.password,
                      })
                    }}
                  >
                    {account.label}
                  </Button>
                ))}
              </Space>
            </div>
          )}
        </div>
      </div>

      <MfaVerificationModal open={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  )
}
