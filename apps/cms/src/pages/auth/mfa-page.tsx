/**
 * MFA/OTP 인증 페이지
 * Phase 0.5.1: MFA/OTP UX — TOTP (Microsoft Authenticator)
 */

import { useState, useEffect, useCallback } from 'react'
import { Form, Input, Button, Card, message, Typography, Space, Alert, Spin } from 'antd'
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfa } from '@/features/auth/hooks/use-mfa'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { getTotpProvisioning } from '@/entities/user/api/mfa-service'
import { OTP_POLICY, OTP_LENGTH } from '@/shared/constants/mfa-policy'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import type { TotpProvisioning } from '@/types/mfa'
import './mfa-page.css'

const { Text, Title } = Typography

export function MfaPage() {
  const navigate = useNavigate()
  const { user, setMfaVerified } = useAuthStore()
  const { mfaState, initializeMfa, completeMfa } = useMfa()
  const { verifying, failedAttempts, isLocked, lockUntil, verifyTotpCode } = useOtpVerification()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')
  const [provisioning, setProvisioning] = useState<TotpProvisioning | null>(null)
  const [provisioningLoading, setProvisioningLoading] = useState(false)
  const [provisioningError, setProvisioningError] = useState<string | null>(null)

  const loadProvisioning = useCallback(async () => {
    if (!user?.email) return
    setProvisioningLoading(true)
    setProvisioningError(null)
    try {
      const p = await getTotpProvisioning(user.email)
      setProvisioning(p)
    } catch (e: unknown) {
      setProvisioningError(e instanceof Error ? e.message : 'QR 정보를 불러오지 못했습니다.')
      setProvisioning(null)
    } finally {
      setProvisioningLoading(false)
    }
  }, [user?.email])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.role === 'ADMIN' && !mfaState) {
      initializeMfa(user.id, user.email)
    } else if (user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, mfaState, initializeMfa, navigate])

  useEffect(() => {
    if (user?.email && mfaState && !mfaState.isVerified) {
      void loadProvisioning()
    }
  }, [user?.email, mfaState, loadProvisioning])

  const handleVerify = async () => {
    if (!user?.email || !otpCode || otpCode.length !== OTP_LENGTH) {
      message.error(MESSAGES.error.enterOtpCode)
      return
    }

    try {
      const verified = await verifyTotpCode({
        email: user.email,
        otpCode,
      })

      if (verified) {
        completeMfa()
        setMfaVerified()
        message.success(MESSAGES.success.authenticated)
        navigate('/')
      } else {
        message.error(MESSAGES.error.invalidCode)
        form.setFieldsValue({ otpCode: '' })
        setOtpCode('')
      }
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : MESSAGES.error.authenticationFailed)
      form.setFieldsValue({ otpCode: '' })
      setOtpCode('')
    }
  }

  const lockMessage =
    isLocked && lockUntil
      ? `인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.`
      : null

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="mfa-page">
      <Card className="mfa-card">
        <div className="mfa-header">
          <SafetyOutlined
            style={{ fontSize: 48, color: '#1890ff', marginBottom: LAYOUT_CONSTANTS.margins.lg }}
          />
          <Title level={3} style={{ marginBottom: 8 }}>
            2단계 인증
          </Title>
          <Text type="secondary">
            Microsoft Authenticator 등으로 QR을 등록한 뒤, 앱의 6자리 코드를 입력하세요.
          </Text>
          {mfaState && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {mfaState.accountLabel}
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

        {provisioningError && (
          <Alert type="warning" message={provisioningError} style={{ marginBottom: 16 }} showIcon />
        )}

        <div style={{ textAlign: 'center', marginBottom: 24, minHeight: 220 }}>
          {provisioningLoading ? (
            <Spin tip="QR 코드 생성 중…" />
          ) : provisioning ? (
            <>
              <img src={provisioning.qrDataUrl} alt="TOTP QR" width={220} height={220} />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  수동 입력 키 (Base32)
                </Text>
                <br />
                <Text code copyable={{ text: provisioning.manualSecret }} style={{ fontSize: 12 }}>
                  {provisioning.manualSecret}
                </Text>
              </div>
            </>
          ) : null}
        </div>

        <Form form={form} layout="vertical" onFinish={handleVerify}>
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
              disabled={isLocked}
              size="large"
            />
          </Form.Item>

          <div style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, textAlign: 'center' }}>
            <Text type="secondary">앱의 코드는 약 30초마다 바뀝니다.</Text>
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
              disabled={isLocked || otpCode.length !== OTP_LENGTH}
              icon={<SafetyOutlined />}
            >
              인증하기
            </Button>

            <Button
              type="default"
              onClick={() => void loadProvisioning()}
              block
              size="large"
              loading={provisioningLoading}
              disabled={isLocked}
              icon={<ReloadOutlined />}
            >
              QR 코드 다시 불러오기
            </Button>
          </Space>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            개발용 Mock TOTP — 운영에서는 서버에서만 시크릿·검증을 처리해야 합니다.
          </Text>
        </div>
      </Card>
    </div>
  )
}
