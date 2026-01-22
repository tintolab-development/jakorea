/**
 * 회원가입 페이지
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
 * 
 * Step 1: 역할 선택 (개인/학교/강사)
 * Step 2: 약관 동의 (필수/선택)
 * Step 3: 정보 입력 (역할별 분기)
 */

import { useState } from 'react'
import { Steps, Card, Form, Input, Button, Checkbox, message, Typography, Space, Radio } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, BankOutlined, HomeOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useRegister } from '@/features/auth/hooks/use-register'
import { useConsent } from '@/features/auth/hooks/use-consent'
import type { UserRole } from '@/types/user'
import type { RegisterFormData, RegisterRequest } from '@/types/register'
import './register-page.css'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

// 로고 이미지 경로
const LOGO_PATH = '/logo/JA_New_Brand_Logo_01.webp'

// 가입 유형 옵션
const REGISTER_TYPES: Array<{
  value: UserRole
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    value: 'INDIVIDUAL',
    label: '개인(참여자)',
    description: '프로그램 신청, 수료증 발급',
    icon: <UserOutlined />,
  },
  {
    value: 'SCHOOL',
    label: '학교',
    description: '학교 단위 프로그램 신청',
    icon: <HomeOutlined />,
  },
  {
    value: 'INSTRUCTOR',
    label: '강사',
    description: '강의 신청, 정산 관리',
    icon: <BankOutlined />,
  },
]

export function RegisterPage() {
  const { register, loading, error } = useRegister()
  const { consent, updateConsent, isValid: consentValid } = useConsent()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // Step 1: 역할 선택 완료
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setCurrentStep(1)
  }

  // Step 2: 약관 동의 완료
  const handleConsentNext = () => {
    if (!consentValid) {
      message.warning('필수 약관에 동의해주세요.')
      return
    }
    setCurrentStep(2)
  }

  // Step 3: 정보 입력 및 회원가입
  const handleSubmit = async (values: any) => {
    if (!selectedRole) {
      message.error('가입 유형을 선택해주세요.')
      return
    }

    try {
      // 역할별로 폼 데이터 구성
      let formData: RegisterFormData
      
      if (selectedRole === 'INDIVIDUAL') {
        formData = {
          role: 'INDIVIDUAL',
          email: values.email,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
          name: values.name,
          phone: values.phone,
        }
      } else if (selectedRole === 'SCHOOL') {
        formData = {
          role: 'SCHOOL',
          email: values.email,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
          name: values.name,
          phone: values.phone,
          schoolName: values.schoolName,
          schoolAddress: values.schoolAddress,
          position: values.position,
        }
      } else {
        // INSTRUCTOR
        formData = {
          role: 'INSTRUCTOR',
          email: values.email,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
          name: values.name,
          phone: values.phone,
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          accountHolder: values.accountHolder,
          isBusinessIncome: values.isBusinessIncome || false,
        }
      }

      const registerRequest: RegisterRequest = {
        formData,
        consent,
      }

      await register(registerRequest)
    } catch {
      // 에러는 useRegister에서 처리됨
    }
  }

  // 이전 단계로
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="register-page">
      <Card className="register-card">
        <div className="register-header">
          <img src={LOGO_PATH} alt="JA Korea" className="register-logo" />
          <Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
            회원가입
          </Title>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="가입 유형 선택" />
          <Step title="약관 동의" />
          <Step title="정보 입력" />
        </Steps>

        {/* Step 1: 역할 선택 */}
        {currentStep === 0 && (
          <div className="register-step-content">
            <Title level={4}>가입 유형을 선택해주세요</Title>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              가입 유형에 따라 제공되는 서비스가 다릅니다.
            </Paragraph>

            <Radio.Group
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {REGISTER_TYPES.map(type => (
                  <Radio.Button
                    key={type.value}
                    value={type.value}
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '20px' }}>{type.icon}</span>
                        <Text strong style={{ fontSize: '16px' }}>
                          {type.label}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {type.description}
                      </Text>
                    </div>
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>

            <Button
              type="primary"
              block
              size="large"
              style={{ marginTop: 24 }}
              onClick={() => selectedRole && handleRoleSelect(selectedRole)}
              disabled={!selectedRole}
            >
              다음
            </Button>
          </div>
        )}

        {/* Step 2: 약관 동의 */}
        {currentStep === 1 && (
          <div className="register-step-content">
            <Title level={4}>약관 동의</Title>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              서비스 이용을 위해 아래 약관에 동의해주세요.
            </Paragraph>

            <Form.Item required>
              <Checkbox
                checked={consent.termsOfService}
                onChange={e => updateConsent({ termsOfService: e.target.checked })}
              >
                <Text>
                  <Link to="/terms" target="_blank">
                    이용약관
                  </Link>
                  에 동의합니다 <Text type="danger">(필수)</Text>
                </Text>
              </Checkbox>
            </Form.Item>

            <Form.Item required>
              <Checkbox
                checked={consent.privacyPolicy}
                onChange={e => updateConsent({ privacyPolicy: e.target.checked })}
              >
                <Text>
                  <Link to="/privacy" target="_blank">
                    개인정보 수집 및 이용
                  </Link>
                  에 동의합니다 <Text type="danger">(필수)</Text>
                </Text>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Checkbox
                checked={consent.marketingConsent}
                onChange={e => updateConsent({ marketingConsent: e.target.checked })}
              >
                <Text>
                  뉴스레터 및 홍보 정보 수신에 동의합니다 <Text type="secondary">(선택)</Text>
                </Text>
              </Checkbox>
            </Form.Item>

            <Space style={{ width: '100%', marginTop: 24 }} size="middle">
              <Button block onClick={handlePrev}>
                이전
              </Button>
              <Button type="primary" block onClick={handleConsentNext} disabled={!consentValid}>
                다음
              </Button>
            </Space>
          </div>
        )}

        {/* Step 3: 정보 입력 */}
        {currentStep === 2 && selectedRole && (
          <div className="register-step-content">
            <Title level={4}>정보 입력</Title>
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              {selectedRole === 'INDIVIDUAL' && '개인(참여자) 정보를 입력해주세요.'}
              {selectedRole === 'SCHOOL' && '학교 정보를 입력해주세요.'}
              {selectedRole === 'INSTRUCTOR' && '강사 정보를 입력해주세요.'}
            </Paragraph>

            <Form
              form={form}
              name="register"
              onFinish={handleSubmit}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              {/* 공통 필드 */}
              <Form.Item
                name="email"
                label="이메일"
                rules={[
                  { required: true, message: '이메일을 입력해주세요.' },
                  { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="이메일" />
              </Form.Item>

              <Form.Item
                name="password"
                label="비밀번호"
                rules={[
                  { required: true, message: '비밀번호를 입력해주세요.' },
                  { min: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" />
              </Form.Item>

              <Form.Item
                name="passwordConfirm"
                label="비밀번호 확인"
                dependencies={['password']}
                rules={[
                  { required: true, message: '비밀번호 확인을 입력해주세요.' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'))
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="비밀번호 확인" />
              </Form.Item>

              <Form.Item
                name="name"
                label="이름"
                rules={[{ required: true, message: '이름을 입력해주세요.' }]}
              >
                <Input placeholder="이름" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="전화번호"
                rules={[
                  { required: true, message: '전화번호를 입력해주세요.' },
                  { pattern: /^[0-9-]+$/, message: '올바른 전화번호 형식이 아닙니다.' },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="010-1234-5678" />
              </Form.Item>

              {/* 학교 추가 필드 */}
              {selectedRole === 'SCHOOL' && (
                <>
                  <Form.Item
                    name="schoolName"
                    label="학교명"
                    rules={[{ required: true, message: '학교명을 입력해주세요.' }]}
                  >
                    <Input placeholder="학교명" />
                  </Form.Item>

                  <Form.Item
                    name="schoolAddress"
                    label="학교 주소"
                    rules={[{ required: true, message: '학교 주소를 입력해주세요.' }]}
                  >
                    <Input placeholder="학교 주소" />
                  </Form.Item>

                  <Form.Item name="position" label="담당자 직책">
                    <Input placeholder="담당자 직책 (선택)" />
                  </Form.Item>
                </>
              )}

              {/* 강사 추가 필드 */}
              {selectedRole === 'INSTRUCTOR' && (
                <>
                  <Form.Item
                    name="bankName"
                    label="은행명"
                    rules={[{ required: true, message: '은행명을 입력해주세요.' }]}
                  >
                    <Input placeholder="은행명" />
                  </Form.Item>

                  <Form.Item
                    name="accountNumber"
                    label="계좌번호"
                    rules={[{ required: true, message: '계좌번호를 입력해주세요.' }]}
                  >
                    <Input placeholder="계좌번호" />
                  </Form.Item>

                  <Form.Item
                    name="accountHolder"
                    label="예금주"
                    rules={[{ required: true, message: '예금주를 입력해주세요.' }]}
                  >
                    <Input placeholder="예금주" />
                  </Form.Item>

                  <Form.Item
                    name="isBusinessIncome"
                    label="사업소득자 여부"
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <Checkbox>사업소득자입니다 (3.3% vs 8.8%)</Checkbox>
                  </Form.Item>
                </>
              )}

              {error && (
                <div className="register-error">
                  <Text type="danger">{error.message}</Text>
                </div>
              )}

              <Space style={{ width: '100%', marginTop: 24 }} size="middle">
                <Button block onClick={handlePrev}>
                  이전
                </Button>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  회원가입
                </Button>
              </Space>
            </Form>
          </div>
        )}

        <div className="register-footer">
          <Text type="secondary">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
