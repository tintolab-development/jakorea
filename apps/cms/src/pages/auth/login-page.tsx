/**
 * 로그인 페이지
 * Phase 4.1.1: 사용자 인증 시스템
 * UX/UI 디자이너: Ant Design Form 컴포넌트 활용, 깔끔한 로그인 UI
 */

import { Form, Input, Button, Card, message, Typography, Select } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useEffect, useState } from 'react'
import type { LoginRequest, UserRole } from '@/types/user'
import { getUsersByRole } from '@/data/mock/users'
import './login-page.css'

const { Text } = Typography
const { Option } = Select

// 로고 이미지 경로
const LOGO_PATH = '/logo/JA_New_Brand_Logo_01.webp'

// 권한별 옵션
const roleOptions = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'STUDENT', label: '수강자' },
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, isAuthenticated } = useAuthStore()
  const [form] = Form.useForm()
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN')

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // 권한 변경 시 해당 권한의 첫 번째 계정으로 자동 입력
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    const users = getUsersByRole(role)
    if (users.length > 0) {
      const firstUser = users[0]
      form.setFieldsValue({
        email: firstUser.email,
        password: firstUser.password,
      })
    }
  }

  const onFinish = async (values: LoginRequest) => {
    try {
      await login(values)
      message.success('로그인 성공')
      navigate('/')
    } catch {
      message.error(error?.message || '로그인에 실패했습니다.')
    }
  }

  // 초기 로드 시 관리자 계정으로 자동 입력
  useEffect(() => {
    const adminUsers = getUsersByRole('ADMIN')
    if (adminUsers.length > 0) {
      const firstAdmin = adminUsers[0]
      form.setFieldsValue({
        email: firstAdmin.email,
        password: firstAdmin.password,
      })
    }
  }, [form])

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-header">
          <img src={LOGO_PATH} alt="JA Korea" className="login-logo" />
          <Form.Item name="role" initialValue="ADMIN" style={{ marginBottom: 16 }}>
            <Select
              value={selectedRole}
              onChange={handleRoleChange}
              size="large"
              style={{ width: '100%' }}
              defaultValue="ADMIN"
            >
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label} 로그인
                </Option>
              ))}
            </Select>
          </Form.Item>
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
            rules={[
              { required: true, message: '이메일을 입력해주세요.' },
              { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="이메일" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
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
          <Text type="secondary" style={{ fontSize: '12px' }}>
            권한을 선택하면 해당 권한의 테스트 계정이 자동으로 입력됩니다.
          </Text>
        </div>
      </Card>
    </div>
  )
}
