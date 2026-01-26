/**
 * MFA/OTP 인증 페이지
 * Phase 0.5.1: MFA/OTP UX (NFR-SEC-AUT-01)
 */

import { useState, useEffect, useCallback } from 'react'
import { Form, Input, Button, Card, message, Typography, Space, Alert } from 'antd'
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfa } from '@/features/auth/hooks/use-mfa'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { useOtpCountdown } from '@/features/auth/hooks/use-otp-countdown'
import { OTP_POLICY, OTP_LENGTH } from '@/shared/constants/mfa-policy'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import './mfa-page.css'

const { Text, Title } = Typography

export function MfaPage() {
  const navigate = useNavigate()
  const { user, setMfaVerified } = useAuthStore()
  const { mfaState, initializeMfa, completeMfa } = useMfa()
  const { sending, verifying, failedAttempts, isLocked, lockUntil, sendOtpCode, verifyOtpCode, reset: resetVerification } = useOtpVerification()
  const { remainingSeconds, isExpired, canResend, resendCooldownSeconds, start: startCountdown } = useOtpCountdown()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')

  // 초기 OTP 발송 여부 추적
  const [initialOtpSent, setInitialOtpSent] = useState(false)

  // OTP 발송 함수 (useCallback으로 감싸서 effect에서 사용 가능)
  const handleSendOtp = useCallback(async () => {
    if (!user) return

    try {
      await sendOtpCode({
        userId: user.id,
        phoneNumber: user.phone || '010-1234-5678',
      })
      message.success(MESSAGES.success.codeSent)
      startCountdown()
      resetVerification()
      form.setFieldsValue({ otpCode: '' })
      setOtpCode('')
    } catch (error: any) {
      message.error(error.message || MESSAGES.error.otpSendFailed)
    }
  }, [user, sendOtpCode, startCountdown, resetVerification, form])

  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // MFA 상태 초기화 (관리자만 MFA 필요)
    if (user.role === 'ADMIN' && !mfaState) {
      // Mock: 사용자 전화번호 (실제로는 사용자 정보에서 가져옴)
      const phoneNumber = user.phone || '010-1234-5678'
      initializeMfa(user.id, phoneNumber)
    } else if (user.role !== 'ADMIN') {
      // 관리자가 아니면 MFA 불필요, 대시보드로 이동
      navigate('/')
    }
  }, [user, mfaState, initializeMfa, navigate])

  // 초기 OTP 발송 (mfaState가 초기화된 후 한 번만)
  useEffect(() => {
    if (mfaState && !mfaState.isVerified && !initialOtpSent) {
      handleSendOtp()
      setInitialOtpSent(true)
    }
  }, [mfaState, initialOtpSent, handleSendOtp])

  // 카운트다운 시작
  useEffect(() => {
    if (mfaState && !mfaState.isVerified) {
      startCountdown()
    }
  }, [mfaState, startCountdown])

  // 만료 시 알림
  useEffect(() => {
    if (isExpired && mfaState && !mfaState.isVerified) {
      message.warning(MESSAGES.warning.codeExpired)
    }
  }, [isExpired, mfaState])

  const handleVerify = async () => {
    if (!user || !otpCode || otpCode.length !== OTP_LENGTH) {
      message.error(MESSAGES.error.enterOtpCode)
      return
    }

    try {
      const verified = await verifyOtpCode({
        userId: user.id,
        otpCode,
      })

      if (verified) {
        completeMfa()
        // auth-store의 MFA 인증 완료 처리
        setMfaVerified()
        message.success(MESSAGES.success.authenticated)
        navigate('/')
      } else {
        message.error(MESSAGES.error.invalidCode)
        form.setFieldsValue({ otpCode: '' })
        setOtpCode('')
      }
    } catch (error: any) {
      message.error(error.message || MESSAGES.error.authenticationFailed)
      form.setFieldsValue({ otpCode: '' })
      setOtpCode('')
    }
  }

  const handleResend = async () => {
    if (!canResend) {
      message.warning(MESSAGES.warning.resendCooldown(Math.ceil(resendCooldownSeconds / 60)))
      return
    }
    await handleSendOtp()
  }

  // 잠금 상태 확인 (lockUntil 기반)
  const lockMessage = isLocked && lockUntil
    ? `인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.`
    : null

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="mfa-page">
      <Card className="mfa-card">
        <div className="mfa-header">
          <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: LAYOUT_CONSTANTS.margins.lg }} />
          <Title level={3} style={{ marginBottom: 8 }}>
            2단계 인증
          </Title>
          <Text type="secondary">
            등록된 휴대폰으로 발송된 인증번호를 입력하세요.
          </Text>
          {mfaState && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {mfaState.phoneNumber}
            </Text>
          )}
        </div>

        {lockMessage && (
          <Alert
            type="error"
            message={lockMessage}
            style={{ marginBottom: LAYOUT_CONSTANTS.margins.xl }}
            showIcon
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerify}
        >
          <Form.Item
            label="인증번호"
            name="otpCode"
            rules={[
              { required: true, message: MESSAGES.validation.otpRequired },
              { len: OTP_LENGTH, message: MESSAGES.validation.otpLength(OTP_LENGTH) },
            ]}
          >
            <Input.OTP
              length={OTP_LENGTH}
              value={otpCode}
              onChange={setOtpCode}
              disabled={isLocked || isExpired}
              size="large"
            />
          </Form.Item>

          <div style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, textAlign: 'center' }}>
            <Text type={isExpired ? 'danger' : 'secondary'}>
              유효시간: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
            </Text>
            {failedAttempts > 0 && (
              <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                실패 횟수: {failedAttempts} / {OTP_POLICY.maxFailedAttempts}
              </Text>
            )}
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={verifying}
              disabled={isLocked || isExpired || otpCode.length !== OTP_LENGTH}
              icon={<SafetyOutlined />}
            >
              인증하기
            </Button>

            <Button
              onClick={handleResend}
              block
              size="large"
              loading={sending}
              disabled={!canResend || isLocked}
              icon={<ReloadOutlined />}
            >
              {canResend ? '재전송' : `재전송 (${Math.ceil(resendCooldownSeconds / 60)}분 후 가능)`}
            </Button>
          </Space>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            인증번호가 오지 않나요? 재전송 버튼을 클릭하세요.
            <br />
            테스트용 인증번호: <Text code>123456</Text> 또는 <Text code>000000</Text>
          </Text>
        </div>
      </Card>
    </div>
  )
}
