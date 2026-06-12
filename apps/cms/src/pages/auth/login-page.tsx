/**
 * 로그인 페이지
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 0.1.3: 로그인 흐름 개선 (역할 자동 판별)
 * UX/UI 디자이너: Ant Design Form 컴포넌트 활용, 깔끔한 로그인 UI
 */

import { Form, Input, Button, Card, Typography, Space, Alert, Tabs } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useEffect, useState } from 'react'
import type { LoginRequest } from '@/types/user'
import type { LoginMode } from '@/entities/user/api/auth-service'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { ADMIN_MFA_LOCAL_TEST_CODE } from '@/shared/constants/mfa-policy'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { SocialLoginForm } from '@/features/auth/ui/social-login-form'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { useLoginAttempts } from '@/features/auth/hooks/use-login-attempts'
import { LOGIN_POLICY } from '@/shared/constants/login-policy'
import { handleError } from '@/shared/utils/error-handler'
import './login-page.css'

const { Text } = Typography

// 개발용 테스트 계정 (임시)
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin1@jakorea.org',
    password: 'admin1234!' },
  instructor: {
    email: 'instructor1@example.com',
    password: 'instructor123!' },
  school: {
    email: 'school1@example.com',
    password: 'school123!' },
  student: {
    email: 'individual1@example.com',
    password: 'individual123!' } }

import logoImage from '@/assets/images/logo/ja_korea_logo.png'

export function LoginPage() {
  const navigate = useNavigate()
  const { params } = useQueryParams<{ redirect?: string }>()
  const authStore = useAuthStore()
  const { login, loading, error, isAuthenticated, requiresMfa, user } = authStore
  const [form] = Form.useForm()
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [loginMode, setLoginMode] = useState<LoginMode | null>(null)
  const apiLoginAvailable = isRemoteApiConfigured()
  const adminAuthApiEnabled = isRealApiModuleEnabled('adminAuth')

  // Phase 0.5.5: 로그인 실패 추적 및 잠금 관리
  const {
    failedAttempts,
    isLocked,
    recordFailure,
    recordSuccess,
    checkLocked,
    getRemainingLockMinutes } = useLoginAttempts()

  // Phase 0.2.1: FR-C01 - redirect 파라미터 처리
  const redirectPath = params.redirect

  // 이미 로그인된 경우 redirect 파라미터 또는 역할별 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      const finalRedirectPath = redirectPath || getRedirectPathByRole(user)
      navigate(finalRedirectPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate, redirectPath])

  const submitLogin = async (values: LoginRequest, mode: LoginMode) => {
    // Phase 0.5.5: 잠금 상태 확인
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

    try {
      const result = await login(values, { mode })

      // Phase 0.5.5: 로그인 성공 시 실패 횟수 초기화
      recordSuccess()

      // Phase 0.5.1: MFA 필요 시 MFA 모달 열기
      if (result?.requiresMfa) {
        setMfaModalOpen(true)
        return
      }

      // Phase 0.2.1: FR-C01 - redirect 파라미터 우선, 없으면 역할별 리다이렉트
      const currentUser = authStore.user
      if (currentUser) {
        const finalRedirectPath = redirectPath || getRedirectPathByRole(currentUser)
        navigate(finalRedirectPath, { replace: true })
      } else {
        navigate(redirectPath || '/', { replace: true })
      }
    } catch (loginError: unknown) {
      // Phase 0.5.5: 로그인 실패 시 실패 횟수 기록 (잠금·실패 횟수는 Alert로 표시, authStore.error는 인라인)
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

  // MFA 인증 완료 시 모달 닫기 및 역할별 리다이렉트
  useEffect(() => {
    // Zustand store의 최신 상태를 직접 확인 (구독된 값보다 정확함)
    const authState = useAuthStore.getState()
    const currentIsAuthenticated = authState.isAuthenticated
    const currentRequiresMfa = authState.requiresMfa
    const currentUser = authState.user

    // Zustand store의 최신 상태를 직접 확인
    if (currentIsAuthenticated && !currentRequiresMfa && mfaModalOpen && currentUser) {
      setMfaModalOpen(false)
      // Phase 0.2.1: FR-C01 - redirect 파라미터 우선, 없으면 역할별 리다이렉트
      const finalRedirectPath = redirectPath || getRedirectPathByRole(currentUser)
      setTimeout(() => {
        navigate(finalRedirectPath, { replace: true })
      }, 200)
    }
  }, [isAuthenticated, requiresMfa, mfaModalOpen, navigate, user, redirectPath])

  // 추가: 주기적으로 상태 확인 (구독이 제대로 작동하지 않는 경우 대비)
  useEffect(() => {
    if (!mfaModalOpen) return

    const interval = setInterval(() => {
      const authState = useAuthStore.getState()
      if (authState.isAuthenticated && !authState.requiresMfa && mfaModalOpen && authState.user) {
        setMfaModalOpen(false)
        // Phase 0.2.1: FR-C01 - redirect 파라미터 우선, 없으면 역할별 리다이렉트
        const finalRedirectPath = redirectPath || getRedirectPathByRole(authState.user)
        navigate(finalRedirectPath, { replace: true })
      }
    }, 500) // 0.5초마다 확인

    return () => clearInterval(interval)
  }, [mfaModalOpen, navigate, redirectPath])

  // Phase 0.1.3 수정: 간편인증 탭 추가 (휴대폰 인증은 제외)
  const tabItems = [
    {
      key: 'email',
      label: '이메일/비밀번호',
      children: (
        <div>
          <Form form={form} name="login" autoComplete="off" layout="vertical" size="large">
            <Form.Item
              name="email"
              label="이메일"
              rules={[
                { required: true },
                { type: 'email' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="이메일" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="비밀번호"
              rules={[{ required: true }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호"
                autoComplete="current-password"
                disabled={isLocked}
              />
            </Form.Item>

            {/* Phase 0.5.5: 잠금 상태 알림 */}
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
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Phase 0.5.5: 실패 횟수 경고 (잠금 전) */}
            {!isLocked && failedAttempts > 0 && failedAttempts < LOGIN_POLICY.maxFailedAttempts && (
              <Alert
                type="warning"
                message={`로그인 실패: ${failedAttempts}회`}
                description={`${LOGIN_POLICY.maxFailedAttempts - failedAttempts}회 더 실패하면 계정이 ${LOGIN_POLICY.lockoutDurationMinutes}분간 잠깁니다.`}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {error && !isLocked && (
              <div className="login-error">
                <Text type="danger">로그인에 실패했습니다.</Text>
              </div>
            )}

            <Form.Item className="login-submit-actions">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  loading={loading && loginMode === 'api'}
                  disabled={isLocked || !apiLoginAvailable}
                  onClick={() => handleLoginClick('api')}
                >
                  API 로그인
                </Button>
                <Button
                  block
                  loading={loading && loginMode === 'mock'}
                  disabled={isLocked}
                  onClick={() => handleLoginClick('mock')}
                >
                  Mock 로그인
                </Button>
              </Space>
              {!apiLoginAvailable && (
                <Text type="secondary" className="login-api-hint">
                  API 로그인은 `VITE_API_SERVER` 또는 `VITE_API_BASE_URL` 설정 후 사용할 수 있습니다.
                </Text>
              )}
              {apiLoginAvailable && adminAuthApiEnabled && (
                <Text type="secondary" className="login-api-hint">
                  API 로그인 MFA(LOCAL_TEST_CODE): 인증번호 <Text code>{ADMIN_MFA_LOCAL_TEST_CODE}</Text>
                </Text>
              )}
            </Form.Item>
          </Form>

          {/* 개발용 테스트 계정 버튼 (임시) */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
              [개발용] 빠른 로그인:
            </Text>
            <Space size="small" wrap>
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue({
                    email: TEST_ACCOUNTS.admin.email,
                    password: TEST_ACCOUNTS.admin.password })
                }}
              >
                관리자
              </Button>
              {/* [임시 주석] 강사 / 학교 / 학생 빠른 로그인
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue({
                    email: TEST_ACCOUNTS.instructor.email,
                    password: TEST_ACCOUNTS.instructor.password })
                }}
              >
                강사
              </Button>
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue({
                    email: TEST_ACCOUNTS.school.email,
                    password: TEST_ACCOUNTS.school.password })
                }}
              >
                학교
              </Button>
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue({
                    email: TEST_ACCOUNTS.student.email,
                    password: TEST_ACCOUNTS.student.password })
                }}
              >
                학생
              </Button>
              */}
            </Space>
          </div>
        </div>
      ) },
    {
      key: 'social',
      label: '간편인증',
      children: <SocialLoginForm /> },
  ]

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-header">
          <img src={logoImage} alt="JA Korea" className="login-logo" />
        </div>

        <Tabs items={tabItems} defaultActiveKey="email" centered size="large" />

        <div className="login-footer">
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
            이메일/비밀번호 또는 간편인증으로 로그인하세요.
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            계정이 없으신가요?{' '}
            <Link
              to={
                redirectPath
                  ? `/register?redirect=${encodeURIComponent(redirectPath)}`
                  : '/register'
              }
            >
              회원가입
            </Link>
          </Text>
        </div>
      </Card>

      <MfaVerificationModal open={mfaModalOpen} />
    </div>
  )
}
