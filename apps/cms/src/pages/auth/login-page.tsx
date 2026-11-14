/**
 * 로그인 페이지
 */

import { Form, Typography, Space } from 'antd'
import type { FormInstance } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'
import {
  SESSION_ENDED_NOTICE,
  consumeSessionEndedNotice,
} from '@/features/auth/lib/session-restore-notice'
import { useEffect, useState } from 'react'
import type { LoginRequest } from '@/types/user'
import type { LoginMode } from '@/entities/user/api/auth-service'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { LoginSocialNotLinkedView } from '@/features/auth/ui/login-social-not-linked-view'
import { LoginSocialAlreadyLinkedView } from '@/features/auth/ui/login-social-already-linked-view'
import { LoginUtilityLinks } from '@/features/auth/ui/login-utility-links'
import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import { LoginSocialSection } from '@/features/auth/ui/login-social-section'
import { LoginAdminApprovalPendingNotice } from '@/features/auth/ui/login-admin-approval-pending-notice'
import { LoginInlineAlert } from '@/features/auth/ui/login-inline-alert'
import { isAdminLoginApprovalPendingError } from '@/features/auth/errors/admin-login-approval-pending-error'
import {
  ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE,
  isAdminLoginAccountLockedError,
} from '@/features/auth/errors/admin-login-account-locked-error'
import { hasPasswordChangeRequiredComplete } from '@/features/auth/password-change-required/wizard-state'
import { resolveLoginRedirectTarget } from '@/shared/utils/auth-redirect'
import {
  passwordChangeRequiredPaths,
  resolvePostAuthRedirectPath,
  sanitizeLoginRedirectPath,
} from '@/shared/utils/post-auth-redirect'
import {
  canShowDevRoleLogin,
  DEV_LOGIN_QA_ACCOUNTS,
} from '@/features/auth/lib/dev-login-accounts'
import { useLoginAttempts } from '@/features/auth/hooks/use-login-attempts'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'
import { handleError } from '@/shared/utils/error-handler'
import {
  applyLoginFieldErrors,
  clearLoginFieldErrors,
} from '@/features/auth/lib/login-field-errors'
import { AuthLogoLink } from '@/features/auth/ui/auth-logo-link'
import './login-page.css'

const { Text } = Typography

function resetLoginCredentialFeedback(
  form: FormInstance,
  clearAuthError: () => void,
  setApprovalPending: (value: boolean) => void,
  setAccountLocked: (value: boolean) => void
) {
  setApprovalPending(false)
  setAccountLocked(false)
  clearAuthError()
  clearLoginFieldErrors(form)
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
    next?: string
    socialNotLinked?: string
    socialAlreadyLinked?: string
  }>()
  const authStore = useAuthStore()
  const { login, loading, isAuthenticated, requiresMfa, passwordChangeRequired, user, clearError } =
    authStore
  const [form] = Form.useForm()
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [loginMode, setLoginMode] = useState<LoginMode | null>(null)
  const [showAdminApprovalPending, setShowAdminApprovalPending] = useState(false)
  /** 서버가 계정 잠금으로 거절 — 잠금 해제 시각은 서버가 판단하므로 화면에서 입력을 막지 않는다 */
  const [showServerAccountLocked, setShowServerAccountLocked] = useState(false)
  const apiLoginAvailable = isRemoteApiConfigured()

  const {
    failedAttempts,
    isLocked,
    recordFailure,
    recordSuccess,
    checkLocked,
  } = useLoginAttempts()

  // `next`는 이전 세션 만료 링크 호환용. 안전하지 않은 값은 버린다.
  const redirectPath = sanitizeLoginRedirectPath(params.redirect ?? params.next) ?? undefined
  const showSocialNotLinked =
    SOCIAL_ACCOUNT_LINK_ENABLED &&
    (params.socialNotLinked === '1' || params.socialNotLinked === 'true')
  const showSocialAlreadyLinked =
    SOCIAL_ACCOUNT_LINK_ENABLED &&
    (params.socialAlreadyLinked === '1' || params.socialAlreadyLinked === 'true')
  const registerPath = redirectPath
    ? `/register?redirect=${encodeURIComponent(redirectPath)}`
    : '/register'

  // 새로고침 세션 복원이 거절돼 로그아웃된 경우에만 안내한다 (QA-0137). 확인 버튼만.
  const { showAlert } = useCmsAlert()
  useEffect(() => {
    if (!consumeSessionEndedNotice()) return
    showAlert({ title: SESSION_ENDED_NOTICE.title, content: SESSION_ENDED_NOTICE.content })
  }, [showAlert])

  useEffect(() => {
    if (requiresMfa && !isAuthenticated) {
      setMfaModalOpen(true)
    }
  }, [requiresMfa, isAuthenticated])

  useEffect(() => {
    const complete = hasPasswordChangeRequiredComplete()
    if (complete) {
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
      return
    }
    if (isAuthenticated && user) {
      const fallback = resolveLoginRedirectTarget(redirectPath, user)
      navigate(
        resolvePostAuthRedirectPath({
          complete,
          passwordChangeRequired,
          fallbackPath: fallback,
        }),
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
    setShowServerAccountLocked(false)

    try {
      const result = await login(values, { mode })
      recordSuccess()

      if (result?.requiresMfa) {
        setMfaModalOpen(true)
        return
      }

      // 렌더 시점 스냅샷이 아닌 로그인 직후 최신 사용자로 역할 판정
      const currentUser = useAuthStore.getState().user
      const fallback = currentUser
        ? resolveLoginRedirectTarget(redirectPath, currentUser)
        : redirectPath || '/'
      navigate(
        resolvePostAuthRedirectPath({
          complete: hasPasswordChangeRequiredComplete(),
          passwordChangeRequired: useAuthStore.getState().passwordChangeRequired,
          fallbackPath: fallback,
        }),
        { replace: true }
      )
    } catch (loginError: unknown) {
      if (isAdminLoginApprovalPendingError(loginError)) {
        clearError()
        clearLoginFieldErrors(form)
        setShowAdminApprovalPending(true)
        return
      }

      if (isAdminLoginAccountLockedError(loginError)) {
        clearError()
        clearLoginFieldErrors(form)
        setShowServerAccountLocked(true)
        return
      }

      recordFailure()
      clearError()
      applyLoginFieldErrors(form, loginError)
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

  useEffect(() => {
    const authState = useAuthStore.getState()
    const currentIsAuthenticated = authState.isAuthenticated
    const currentRequiresMfa = authState.requiresMfa
    const currentUser = authState.user

    if (currentIsAuthenticated && !currentRequiresMfa && mfaModalOpen && currentUser) {
      setMfaModalOpen(false)
      const fallback = resolveLoginRedirectTarget(redirectPath, currentUser)
      setTimeout(() => {
        const latest = useAuthStore.getState()
        navigate(
          resolvePostAuthRedirectPath({
            complete: hasPasswordChangeRequiredComplete(),
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
        const fallback = resolveLoginRedirectTarget(redirectPath, authState.user)
        navigate(
          resolvePostAuthRedirectPath({
            complete: hasPasswordChangeRequiredComplete(),
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
        {showSocialNotLinked || showSocialAlreadyLinked ? null : (
          <AuthLogoLink wrapperClassName="login-logo-wrapper" logoClassName="login-logo" />
        )}

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
                    // 입력 중 실시간 검증 안내를 띄우지 않고 [로그인하기] 클릭 시에만 노출한다
                    validateTrigger={[]}
                    onValuesChange={() => {
                      resetLoginCredentialFeedback(
                        form,
                        clearError,
                        setShowAdminApprovalPending,
                        setShowServerAccountLocked
                      )
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

                    {(isLocked || showServerAccountLocked) && (
                      <LoginInlineAlert>{ADMIN_LOGIN_ACCOUNT_LOCKED_MESSAGE}</LoginInlineAlert>
                    )}

                    {!isLocked &&
                      !showServerAccountLocked &&
                      failedAttempts > 0 &&
                      failedAttempts < LOGIN_POLICY.maxFailedAttempts && (
                        <LoginInlineAlert>
                          {`로그인에 실패했습니다. ${LOGIN_POLICY.maxFailedAttempts}회 연속 실패 시 ${LOGIN_POLICY.lockoutDurationMinutes}분간 로그인이 제한됩니다. (${failedAttempts}/${LOGIN_POLICY.maxFailedAttempts}회)`}
                        </LoginInlineAlert>
                      )}

                    <Form.Item className="login-submit-actions">
                      <CmsButton
                        variant="primary"
                        type="submit"
                        size="h52" className="login-submit-btn"
                        loading={loading && loginMode === 'api'}
                        disabled={isLocked || !apiLoginAvailable}
                        onClick={() => handleLoginClick('api')} >
                        로그인하기
                      </CmsButton>
                    </Form.Item>
                  </Form>

                  <LoginUtilityLinks registerPath={registerPath} />
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
              </>
            )}
          </>
        )}
      </div>

      <MfaVerificationModal open={mfaModalOpen} onClose={() => setMfaModalOpen(false)} />
    </div>
  )
}
