/**
 * 로그인 페이지
 * Phase 4.1.1: 사용자 인증 시스템
 * Phase 0.1.3: 로그인 흐름 개선 (역할 자동 판별)
 * UX/UI 디자이너: Ant Design Form 컴포넌트 활용, 깔끔한 로그인 UI
 */

import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useEffect, useState } from 'react'
import type { LoginRequest } from '@/types/user'
import { MfaVerificationModal } from '@/features/auth/ui/mfa-verification-modal'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import './login-page.css'

const { Text } = Typography

// 로고 이미지 경로
const LOGO_PATH = '/logo/JA_New_Brand_Logo_01.webp'

export function LoginPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const { login, loading, error, isAuthenticated, requiresMfa, user } = authStore
  const [form] = Form.useForm()
  const [mfaModalOpen, setMfaModalOpen] = useState(false)

  // 이미 로그인된 경우 역할별 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPathByRole(user)
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const onFinish = async (values: LoginRequest) => {
    try {
      const result = await login(values)
      
      // Phase 0.5.1: MFA 필요 시 MFA 모달 열기
      if (result?.requiresMfa) {
        setMfaModalOpen(true)
        return
      }

      // Phase 0.1.3: 역할별 리다이렉트
      const currentUser = authStore.user
      if (currentUser) {
        const redirectPath = getRedirectPathByRole(currentUser)
        message.success('로그인 성공')
        navigate(redirectPath, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch {
      message.error(error?.message || '로그인에 실패했습니다.')
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
      // Phase 0.1.3: 역할별 리다이렉트
      const redirectPath = getRedirectPathByRole(currentUser)
      setTimeout(() => {
        navigate(redirectPath, { replace: true })
      }, 200)
    }
  }, [isAuthenticated, requiresMfa, mfaModalOpen, navigate, user])
  
  // 추가: 주기적으로 상태 확인 (구독이 제대로 작동하지 않는 경우 대비)
  useEffect(() => {
    if (!mfaModalOpen) return
    
    const interval = setInterval(() => {
      const authState = useAuthStore.getState()
      if (authState.isAuthenticated && !authState.requiresMfa && mfaModalOpen && authState.user) {
        setMfaModalOpen(false)
        // Phase 0.1.3: 역할별 리다이렉트
        const redirectPath = getRedirectPathByRole(authState.user)
        navigate(redirectPath, { replace: true })
      }
    }, 500) // 0.5초마다 확인
    
    return () => clearInterval(interval)
  }, [mfaModalOpen, navigate])

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-header">
          <img src={LOGO_PATH} alt="JA Korea" className="login-logo" />
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="이메일"
            rules={[
              { required: true, message: '이메일을 입력해주세요.' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="이메일" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="비밀번호"
            rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </Form.Item>

          {error && (
            <div className="login-error">
              <Text type="danger">{error.message}</Text>
            </div>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              로그인
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
            이메일과 비밀번호로 로그인하세요. 역할은 자동으로 판별됩니다.
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </Text>
        </div>
      </Card>

      <MfaVerificationModal open={mfaModalOpen} />
    </div>
  )
}
