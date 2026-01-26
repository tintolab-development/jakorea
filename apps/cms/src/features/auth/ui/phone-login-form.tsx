/**
 * 휴대폰 본인인증 로그인 폼
 * Phase 0.1.3: 휴대폰 본인인증 로그인
 */

import { Form, Input, Button, message, Space } from 'antd'
import { MobileOutlined, SafetyOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { loginWithPhone } from '@/entities/user/api/auth-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import type { OtpSendRequest, OtpVerifyRequest } from '@/types/mfa'
import { getUserByPhone } from '@/data/mock/users'
import { MESSAGES } from '@/shared/constants'

interface PhoneLoginFormProps {
  onSuccess?: () => void
}

/**
 * 전화번호 포맷팅 (010-0000-0000)
 */
function formatPhoneNumber(value: string): string {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, '')

  // 길이 제한 (11자리)
  const limited = numbers.slice(0, 11)

  // 하이픈 추가
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`
  }
}

export function PhoneLoginForm({ onSuccess }: PhoneLoginFormProps) {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authStore = useAuthStore()
  const { setAuth } = authStore
  const redirectPath = searchParams.get('redirect')

  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  const { sending, verifying, sendOtpCode, verifyOtpCode, reset: resetOtp } = useOtpVerification()

  // 전화번호 입력 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    form.setFieldsValue({ phoneNumber: formatted })
  }

  // 본인인증 버튼 클릭 (OTP 발송)
  const handleSendOtp = async () => {
    try {
      const values = await form.validateFields(['phoneNumber'])
      const phone = values.phoneNumber.replace(/-/g, '')

      // 전화번호로 사용자 찾기
      const user = getUserByPhone(phone)
      if (!user) {
        message.error(MESSAGES.error.phoneNotRegistered)
        return
      }

      // OTP 발송
      await sendOtpCode({
        userId: user.id,
        phoneNumber: values.phoneNumber,
      } as OtpSendRequest)

      setOtpSent(true)
      message.success(MESSAGES.success.codeSent)
    } catch (error: any) {
      if (error?.errorFields) {
        // Form validation error
        return
      }
      message.error(error?.message || '인증번호 발송에 실패했습니다.')
    }
  }

  // OTP 검증 버튼 클릭
  const handleVerifyOtp = async () => {
    try {
      const values = await form.validateFields(['phoneNumber', 'otpCode'])
      const phone = values.phoneNumber.replace(/-/g, '')

      // 전화번호로 사용자 찾기
      const user = getUserByPhone(phone)
      if (!user) {
        message.error(MESSAGES.error.phoneNotRegistered)
        return
      }

      // OTP 검증
      const verified = await verifyOtpCode({
        userId: user.id,
        otpCode: values.otpCode,
      } as OtpVerifyRequest)

      if (verified) {
        setOtpVerified(true)
        message.success(MESSAGES.success.authenticated)

        // 로그인 처리
        await handleLogin(phone, values.otpCode)
      } else {
        message.error(MESSAGES.error.invalidCode)
      }
    } catch (error: any) {
      message.error(error?.message || '인증에 실패했습니다.')
    }
  }

  // 로그인 처리
  const handleLogin = async (phone: string, otpCode: string) => {
    setLoading(true)
    try {
      const response = await loginWithPhone(phone, otpCode)

      // 인증 상태 저장
      setAuth({
        user: response.user,
        token: response.token,
        expiresAt:
          typeof response.expiresAt === 'string'
            ? response.expiresAt
            : response.expiresAt.toString(),
      })

      // MFA 필요 시 처리 (관리자)
      if (response.requiresMfa && response.mfaState) {
        // MFA는 별도 모달에서 처리되므로 여기서는 성공으로 간주
        message.success(MESSAGES.success.loginSuccess)
        if (onSuccess) {
          onSuccess()
        }
        return
      }

      // 역할별 리다이렉트
      const finalRedirectPath = redirectPath || getRedirectPathByRole(response.user)
      message.success(MESSAGES.success.loginSuccess)
      navigate(finalRedirectPath, { replace: true })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      message.error(error?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 다시 시작
  const handleReset = () => {
    setOtpSent(false)
    setOtpVerified(false)
    resetOtp()
    form.setFieldsValue({ otpCode: '' })
  }

  return (
    <Form form={form} layout="vertical" size="large" initialValues={{ phoneNumber: '' }}>
      <Form.Item
        name="phoneNumber"
        label="휴대폰 번호"
        rules={[
          { required: true, message: '휴대폰 번호를 입력해주세요.' },
          {
            pattern: /^010-\d{4}-\d{4}$/,
            message: '올바른 휴대폰 번호 형식이 아닙니다. (010-0000-0000)',
          },
        ]}
      >
        <Input
          prefix={<MobileOutlined />}
          placeholder="010-0000-0000"
          maxLength={13}
          onChange={handlePhoneChange}
          disabled={otpSent && otpVerified}
        />
      </Form.Item>

      {otpSent && (
        <Form.Item
          name="otpCode"
          label="인증번호"
          rules={[
            { required: true, message: '인증번호를 입력해주세요.' },
            { len: 6, message: '인증번호는 6자리입니다.' },
            { pattern: /^\d+$/, message: '인증번호는 숫자만 입력 가능합니다.' },
          ]}
        >
          <Input
            prefix={<SafetyOutlined />}
            placeholder="6자리 인증번호"
            maxLength={6}
            disabled={otpVerified}
          />
        </Form.Item>
      )}

      <Form.Item>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {!otpSent ? (
            <Button
              type="primary"
              block
              onClick={handleSendOtp}
              loading={sending}
              disabled={!phoneNumber || phoneNumber.length < 13}
            >
              본인인증
            </Button>
          ) : !otpVerified ? (
            <>
              <Button type="primary" block onClick={handleVerifyOtp} loading={verifying || loading}>
                인증번호 확인
              </Button>
              <Button block onClick={handleReset} disabled={verifying || loading}>
                다시 시작
              </Button>
            </>
          ) : (
            <Button type="primary" block loading={loading} disabled>
              인증 완료
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  )
}
