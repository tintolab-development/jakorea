/**
 * 휴대폰 본인인증 폼 (회원가입용)
 * Phase 0.1.3 수정: 회원가입 시 휴대폰 본인인증
 */

import { Form, Input, Space } from 'antd'
import { MobileOutlined, SafetyOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { LoadingButton } from '@/shared/ui'
import type { OtpSendRequest, OtpVerifyRequest } from '@/types/mfa'

interface PhoneVerificationFormProps {
  phoneNumber: string
  onVerified: (phoneNumber: string) => void
  disabled?: boolean
}


export function PhoneVerificationForm({ phoneNumber, onVerified, disabled }: PhoneVerificationFormProps) {
  const [form] = Form.useForm()
  const [otpSent, setOtpSent] = useState(false)
  const [verified, setVerified] = useState(false)
  
  const {
    sending,
    verifying,
    sendOtpCode,
    verifyOtpCode,
    reset: resetOtp } = useOtpVerification()

  // 임시 userId 생성 (회원가입 전이므로, 전화번호 기반으로 고정)
  // 전화번호가 변경되면 새로운 tempUserId 생성
  const tempUserId = useMemo(() => {
    const phone = phoneNumber.replace(/-/g, '')
    // eslint-disable-next-line react-hooks/purity
    return `temp-${phone || String(Date.now())}`
  }, [phoneNumber])

  // 본인인증 버튼 클릭 (OTP 발송)
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 13) {
      return
    }

    try {
      // OTP 발송
      await sendOtpCode({
        userId: tempUserId,
        phoneNumber: phoneNumber } as OtpSendRequest)
      
      setOtpSent(true)
    } catch (error: unknown) {
      console.debug('phoneVerificationForm sendOtp failed', error)
    }
  }

  // OTP 검증 버튼 클릭
  const handleVerifyOtp = async () => {
    try {
      const values = await form.validateFields(['otpCode'])
      
      // OTP 검증
      const verified = await verifyOtpCode({
        userId: tempUserId,
        otpCode: values.otpCode } as OtpVerifyRequest)

      if (verified) {
        setVerified(true)
        onVerified(phoneNumber)
      } else {
        console.debug('phoneVerificationForm otp not verified')
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
      console.debug('phoneVerificationForm verifyOtp failed', error)
    }
  }

  // 다시 시작
  const handleReset = () => {
    setOtpSent(false)
    setVerified(false)
    resetOtp()
    form.setFieldsValue({ otpCode: '' })
  }

  if (verified) {
    return (
      <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
        <Space>
          <SafetyOutlined style={{ color: '#52c41a' }} />
          <span style={{ color: '#52c41a', fontWeight: 500 }}>본인인증이 완료되었습니다.</span>
        </Space>
      </div>
    )
  }

  return (
    <div>
      <Form form={form} layout="vertical" size="middle">
        {!otpSent ? (
          <LoadingButton
            type="default"
            block
            icon={<MobileOutlined />}
            onClick={handleSendOtp}
            loading={sending}
            disabled={disabled || !phoneNumber || phoneNumber.length < 13}
          >
            본인인증
          </LoadingButton>
        ) : (
          <>
            <Form.Item
              name="otpCode"
              label="인증번호"
              rules={[
                { required: true },
                { len: 6 },
                { pattern: /^\d+$/ },
              ]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="6자리 인증번호"
                maxLength={6}
                disabled={disabled}
              />
            </Form.Item>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <LoadingButton
                type="primary"
                block
                onClick={handleVerifyOtp}
                loading={verifying}
                disabled={disabled}
              >
                인증번호 확인
              </LoadingButton>
              <LoadingButton block onClick={handleReset} disabled={verifying || disabled}>
                다시 시작
              </LoadingButton>
            </Space>
          </>
        )}
      </Form>
    </div>
  )
}
