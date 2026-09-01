/**
 * 로그인 페이지
 */

import { Form, Button, Typography, Space, Alert } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { LoadingButton } from '@/shared/ui/loading-button'
import { CmsInput } from '@/shared/ui'
import { useEffect, useState } from 'react'
import type { LoginRequest } from '@/types/user'
import type { LoginMode } from '@/entities/user/api/auth-service'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { LoginSocialNotLinkedView } from '@/features/auth/ui/login-social-not-linked-view'
import { LoginSocialAlreadyLinkedView } from '@/features/auth/ui/login-social-already-linked-view'
import { LoginUtilityLinks } from '@/features/auth/ui/login-utility-links'
import { LoginSocialSection } from '@/features/auth/ui/login-social-section'
import { LoginAdminApprovalPendingNotice } from '@/features/auth/ui/login-admin-approval-pending-notice'
import { isAdminLoginApprovalPendingError } from '@/features/auth/errors/admin-login-approval-pending-error'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { resolvePostAuthRedirectPath } from '@/shared/utils/post-auth-redirect'
import { getUserByEmail } from '@/data/mock/users'
import { useLoginAttempts } from '@/features/auth/hooks/use-login-attempts'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'
import { handleError } from '@/shared/utils/error-handler'
import { AuthLogoLink } from '@/features/auth/ui/auth-logo-link'
import './login-page.css'

const { Text } = Typography

const TEST_ACCOUNTS = {
  admin: {
    email: 'admin1@jakorea.org',
    password: 'admin1234!',
  },
  /** 실 API 가입·승인 대기 등 — 개발용 자동 입력 */
  adminRegistered: {
    email: '123@jakorea.org',
    password: '!Tinto05270527',
  },
}

type LoginSocialView = 'default' | 'socialNotLinked' | 'socialAlreadyLinked'

function buildLoginPath(redirectPath?: string, view: LoginSocialView = 'default') {
  const search = new URLSearchParams()
  if (redirectPath) {
    search.set('redirect', redirectPath)
  }
  if (view === 'socialNotLinked') {
    search.set('socialNotLinked', '1')
  }
  if (view === 'socialAlreadyLinked') {
    search.set('socialAlreadyLinked', '1')
  }
  const query = search.toString()
  return query ? `/login?${query}` : '/login'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{
    redirect?: string
    socialNotLinked?: string
    socialAlreadyLinked?: string
  }>()
  const authStore = useAuthStore()
  const {
    login,
    setAuth,
    loading,
    error,
    isAuthenticated,
    requiresMfa,
    passwordChangeRequired,
    user,
    clearError,
  } = authStore
  const [form] = Form.useForm()
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [loginMode, setLoginMode] = useState<LoginMode | null>(null)
  const [showAdminApprovalPending, setShowAdminApprovalPending] = useState(false)
  const apiLoginAvailable = isRemoteApiConfigured()

  const {
    failedAttempts,
    isLocked,
    recordFailure,
    recordSuccess,
    checkLocked,
    getRemainingLockMinutes,
  } = useLoginAttempts()

  const redirectPath = params.redirect
  const showSocialNotLinked = params.socialNotLinked === '1' || params.socialNotLinked === 'true'
  const showSocialAlreadyLinked =
    params.socialAlreadyLinked === '1' || params.socialAlreadyLinked === 'true'
  const registerPath = redirectPath
    ? `/register?redirect=${encodeURIComponent(redirectPath)}`
    : '/register'

  useEffect(() => {
    if (isAuthenticated && user) {
      const fallback = redirectPath || getRedirectPathByRole(user)
      navigate(
        resolvePostAuthRedirectPath({ passwordChangeRequired, fallbackPath: fallback }),
        { replace: true }
      )
    }
  }, [isAuthenticated, user, navigate, redirectPath, passwordChangeRequired])

  const submitLogin = async (values: LoginRequest, mode: LoginMode) => {
    if (checkLocked()) {
      return
    }

    if (mode === 'api' && !apiLoginAvailable) {
      handleError(
        new Error('API 서버가 설정되지 않았습니다. `.env`에 `VITE_API_SERVER`를 확인하세요.'),
        { context: 'loginPage.apiNotConfigured' }
      )
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

      const currentUser = authStore.user
      const fallback = currentUser
        ? redirectPath || getRedirectPathByRole(currentUser)
        : redirectPath || '/'
      navigate(
        resolvePostAuthRedirectPath({
          passwordChangeRequired: useAuthStore.getState().passwordChangeRequired,
          fallbackPath: fallback,
        }),
        { replace: true }
      )
    } catch (loginError: unknown) {
      if (isAdminLoginApprovalPendingError(loginError)) {
        clearError()
        setShowAdminApprovalPending(true)
        return
      }

      recordFailure()
      handleError(loginError, { context: 'loginPage.submitLogin' })
    } finally {
      setLoginMode(null)
    }
  }

  const handleLoginClick = async (mode: LoginMode) => {
    try {
      const values = await form.validateFields()
      await submitLogin(values as LoginRequest, mode)
    } catch {
      // 폼 검증 실패 — Ant Design이 필드 오류를 표시함
    }
  }

  const handleEmailLogin = () => {
    navigate(buildLoginPath(redirectPath, 'default'), { replace: true })
  }

  const handleConnectOtherSocial = () => {
    navigate(buildLoginPath(redirectPath, 'default'), { replace: true })
  }

  /** DEV 전용 — mock 관리자로 MFA·API 없이 즉시 로그인 */
  const handleDevLoginBypass = () => {
    const mockUser = getUserByEmail(TEST_ACCOUNTS.admin.email)
    if (!mockUser?.isActive) {
      handleError(new Error('개발용 관리자 mock 계정을 찾을 수 없습니다.'), {
        context: 'loginPage.devBypass',
      })
      return
    }

    const { password: _password, ...userWithoutPassword } = mockUser
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    setMfaModalOpen(false)
    recordSuccess()
    setAuth({
      user: {
        ...userWithoutPassword,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token: `mock-jwt-token-${mockUser.id}-${Date.now()}`,
      expiresAt,
    })
  }

  useEffect(() => {
    const authState = useAuthStore.getState()
    const currentIsAuthenticated = authState.isAuthenticated
    const currentRequiresMfa = authState.requiresMfa
    const currentUser = authState.user

    if (currentIsAuthenticated && !currentRequiresMfa && mfaModalOpen && currentUser) {
      setMfaModalOpen(false)
      const fallback = redirectPath || getRedirectPathByRole(currentUser)
      setTimeout(() => {
        const latest = useAuthStore.getState()
        navigate(
          resolvePostAuthRedirectPath({
            passwordChangeRequired: latest.passwordChangeRequired,
            fallbackPath: fallback,
          }),
          { replace: true }
        )
      }, 200)
    }
  }, [isAuthenticated, requiresMfa, mfaModalOpen, navigate, user, redirectPath])

  useEffect(() => {
    if (!mfaModalOpen) return

    const interval = setInterval(() => {
      const authState = useAuthStore.getState()
      if (authState.isAuthenticated && !authState.requiresMfa && mfaModalOpen && authState.user) {
        setMfaModalOpen(false)
        const fallback = redirectPath || getRedirectPathByRole(authState.user)
        navigate(
          resolvePostAuthRedirectPath({
            passwordChangeRequired: authState.passwordChangeRequired,
            fallbackPath: fallback,
          }),
          { replace: true }
        )
      }
    }, 500)

    return () => clearInterval(interval)
  }, [mfaModalOpen, navigate, redirectPath])

  return (
    <div className="login-page">
      <div
        className={
          showSocialAlreadyLinked ? 'login-card login-card--social-already-linked' : 'login-card'
        }
      >
        <AuthLogoLink wrapperClassName="login-logo-wrapper" logoClassName="login-logo" />

        {showSocialAlreadyLinked ? (
          <LoginSocialAlreadyLinkedView
            onConnectOtherSocial={handleConnectOtherSocial}
            onEmailLogin={handleEmailLogin}
          />
        ) : (
          <>
            {showSocialNotLinked ? (
              <div className="login-form-wrapper login-form-wrapper--social-not-linked">
                <LoginSocialNotLinkedView
                  registerPath={registerPath}
                  onEmailLogin={handleEmailLogin}
                />
              </div>
            ) : (
              <>
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
                      rules={[
                        { required: true, message: '이메일을 입력해 주세요.' },
                        { type: 'email', message: '올바른 이메일 형식을 입력해 주세요.' },
                      ]}
                    >
                      <CmsInput
                        label="이메일"
                        required
                        inputSize="xlarge"
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
                              로그인 시도가 {LOGIN_POLICY.maxFailedAttempts}회 실패하여 계정이
                              잠겼습니다.
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

                    {!isLocked &&
                      failedAttempts > 0 &&
                      failedAttempts < LOGIN_POLICY.maxFailedAttempts && (
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
                        <Text type="danger">로그인에 실패했습니다.</Text>
                      </div>
                    )}

                    <Form.Item className="login-submit-actions">
                      <LoadingButton
                        type="primary"
                        block
                        className="login-submit-btn"
                        loading={loading && loginMode === 'api'}
                        disabled={isLocked || !apiLoginAvailable}
                        onClick={() => handleLoginClick('api')}
                      >
                        로그인하기
                      </LoadingButton>
                      {!apiLoginAvailable && (
                        <Text type="secondary" className="login-api-hint">
                          API 로그인은 `VITE_API_SERVER` 또는 `VITE_API_BASE_URL` 설정 후 사용할 수
                          있습니다.
                        </Text>
                      )}
                    </Form.Item>
                  </Form>

                  <LoginUtilityLinks registerPath={registerPath} />
                  <LoginSocialSection />

                  {import.meta.env.DEV && (
                    <div className="login-dev-quick">
                      <Space size="small" wrap>
                        <Button
                          size="small"
                          onClick={() => {
                            form.setFieldsValue({
                              email: TEST_ACCOUNTS.admin.email,
                              password: TEST_ACCOUNTS.admin.password,
                            })
                          }}
                        >
                          어드민 계정정보 자동 입력
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            form.setFieldsValue({
                              email: TEST_ACCOUNTS.adminRegistered.email,
                              password: TEST_ACCOUNTS.adminRegistered.password,
                            })
                          }}
                        >
                          어드민 가입계정 자동 입력
                        </Button>
                        <Button size="small" onClick={handleDevLoginBypass}>
                          로그인 우회
                        </Button>
                      </Space>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <MfaVerificationModal open={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  )
}
