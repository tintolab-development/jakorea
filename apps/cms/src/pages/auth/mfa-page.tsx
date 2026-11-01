/**
 * MFA/OTP 인증 페이지
 * Phase 0.5.1: MFA/OTP UX — TOTP (Microsoft Authenticator)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Form, Input, Card, Typography, Space, Alert, Spin } from 'antd'
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfa } from '@/features/auth/hooks/use-mfa'
import { useOtpVerification } from '@/features/auth/hooks/use-otp-verification'
import { getTotpProvisioning, verifyTotp } from '@/entities/user/api/mfa-service'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import {
  OTP_POLICY,
  OTP_LENGTH,
  ADMIN_MFA_LOCAL_TEST_CODE,
  isAdminLocalTestMfa,
  clampMfaFailedAttempts,
} from '@/shared/constants/mfa-policy'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { unknownErrorText } from '@/shared/utils/error-handler'
import { resolvePostAuthRedirectPath } from '@/shared/utils/post-auth-redirect'
import type { TotpProvisioning } from '@/types/mfa'
import './mfa-page.css'
import { CmsButton } from '@/shared/ui'

const { Text, Title } = Typography

export function MfaPage() {
  const navigate = useNavigate()
  const { user, setMfaVerified, completeAdminAuth, mfaState: authMfaState } = useAuthStore()
  const { mfaState: localMfaState, initializeMfa, completeMfa } = useMfa()
  const mfaState = authMfaState ?? localMfaState
  const { verifying, failedAttempts, isLocked, lockUntil, verifyTotpCode } = useOtpVerification()
  const [form] = Form.useForm()
  const [otpCode, setOtpCode] = useState('')
  const [provisioning, setProvisioning] = useState<TotpProvisioning | null>(null)
  const [provisioningLoading, setProvisioningLoading] = useState(false)
  const [provisioningError, setProvisioningError] = useState<string | null>(null)
  const [forceOtpOnly, setForceOtpOnly] = useState(false)
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null)
  const verifyInFlightRef = useRef(false)

  const isRemoteMfa = Boolean(mfaState?.challengeUuid)
  const isLocalTestMfa = isRemoteMfa && isAdminLocalTestMfa(mfaState?.mfaMethod)
  const showQrSetup =
    isRemoteMfa && mfaState?.mfaSetupRequired === true && !isLocalTestMfa && !forceOtpOnly

  const loadProvisioning = useCallback(async () => {
    if (!showQrSetup || !user?.email || !mfaState?.challengeUuid) return

    setProvisioningLoading(true)
    setProvisioningError(null)
    try {
      const next = await getTotpProvisioning(user.email, {
        challengeUuid: mfaState.challengeUuid,
        mfaMethod: mfaState.mfaMethod,
      })
      if (!next?.qrDataUrl && !next?.manualSecret) {
        setProvisioning(null)
        setProvisioningError('QR 정보를 불러오지 못했습니다.')
        return
      }
      setProvisioning(next)
    } catch (e: unknown) {
      if (e instanceof AdminMfaApiError && e.code === 'MFA_ALREADY_ENROLLED') {
        setForceOtpOnly(true)
        setProvisioning(null)
        setProvisioningError(null)
        return
      }
      setProvisioningError(unknownErrorText(e, 'QR 정보를 불러오지 못했습니다.'))
      setProvisioning(null)
    } finally {
      setProvisioningLoading(false)
    }
  }, [showQrSetup, user?.email, mfaState?.challengeUuid, mfaState?.mfaMethod])

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
    if (user?.email && showQrSetup && mfaState && !mfaState.isVerified) {
      void loadProvisioning()
    }
  }, [user?.email, showQrSetup, mfaState, loadProvisioning])

  const handleVerify = async (code?: string) => {
    const effectiveCode = (code ?? otpCode).trim()
    if (verifyInFlightRef.current || verifying) return
    if (!user?.email || !effectiveCode || effectiveCode.length !== OTP_LENGTH) {
      return
    }
    if (!/^\d+$/.test(effectiveCode)) {
      return
    }

    verifyInFlightRef.current = true
    try {
      if (isRemoteMfa && mfaState?.challengeUuid) {
        const response = await verifyTotp(user.email, effectiveCode, {
          challengeUuid: mfaState.challengeUuid,
        })
        if (response.verified && response.tokens) {
          completeAdminAuth(response.tokens)
          navigate(
            resolvePostAuthRedirectPath({
              passwordChangeRequired: useAuthStore.getState().passwordChangeRequired,
              fallbackPath: '/',
            }),
            { replace: true }
          )
          return
        }
        setVerifyNotice(response.detail)
        form.setFieldsValue({ otpCode: '' })
        setOtpCode('')
        return
      }

      const verified = await verifyTotpCode({
        email: user.email,
        otpCode: effectiveCode,
      })

      if (verified) {
        completeMfa()
        setMfaVerified()
        navigate(
          resolvePostAuthRedirectPath({
            passwordChangeRequired: useAuthStore.getState().passwordChangeRequired,
            fallbackPath: '/',
          }),
          { replace: true }
        )
      } else {
        form.setFieldsValue({ otpCode: '' })
        setOtpCode('')
      }
    } catch (error: unknown) {
      form.setFieldsValue({ otpCode: '' })
      setOtpCode('')
    } finally {
      verifyInFlightRef.current = false
    }
  }

  const handleOtpChange = (value: string) => {
    setOtpCode(value)
    form.setFieldsValue({ otpCode: value })
    if (
      value.length === OTP_LENGTH &&
      !isLocked &&
      !verifying &&
      user?.email &&
      /^\d+$/.test(value)
    ) {
      void handleVerify(value)
    }
  }

  const lockMessage =
    isLocked && lockUntil ? `인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.` : null

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
            {showQrSetup
              ? 'Microsoft Authenticator 등으로 QR을 등록한 뒤, 앱의 6자리 코드를 입력하세요.'
              : '등록된 인증 앱의 6자리 코드를 입력하세요.'}
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
            description={lockMessage}
            style={{ marginBottom: LAYOUT_CONSTANTS.margins.xl }}
            showIcon
          />
        )}

        {isLocalTestMfa && (
          <Alert
            type="info"
            description={`테스트 코드 ${ADMIN_MFA_LOCAL_TEST_CODE} 을 입력하세요.`}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        {verifyNotice && (
          <Alert type="error" description={verifyNotice} style={{ marginBottom: 16 }} showIcon />
        )}

        {provisioningError && (
          <Alert
            type="warning"
            description={provisioningError}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        {showQrSetup && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              minHeight: 220,
            }}
          >
            {provisioningLoading ? (
              <Spin tip="QR 코드 생성 중…" />
            ) : provisioning?.qrDataUrl || provisioning?.manualSecret ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {provisioning.qrDataUrl ? (
                  <img src={provisioning.qrDataUrl} alt="TOTP QR" width={220} height={220} />
                ) : null}
                {provisioning.manualSecret ? (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      수동 입력 키
                    </Text>
                    <br />
                    <Text code style={{ fontSize: 12 }}>
                      {provisioning.manualSecret}
                    </Text>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleVerify}>
          <Form.Item
            label="인증번호"
            name="otpCode"
            rules={[{ required: true }, { len: OTP_LENGTH }]}
          >
            <Input.OTP
              length={OTP_LENGTH}
              value={otpCode}
              onChange={handleOtpChange}
              disabled={isLocked}
              size="large"
            />
          </Form.Item>

          <div style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg, textAlign: 'center' }}>
            <Text type="secondary">앱의 코드는 약 30초마다 바뀝니다.</Text>
            {failedAttempts > 0 && !isLocked && (
              <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                잘못된 코드를 입력하였습니다. (실패 횟수 {clampMfaFailedAttempts(failedAttempts)} /
                {OTP_POLICY.maxFailedAttempts})
              </Text>
            )}
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <CmsButton
              variant="primary"
              size="h52"
              type="submit"
              loading={verifying}
              disabled={isLocked || otpCode.length !== OTP_LENGTH}
              icon={<SafetyOutlined />} >
              인증하기
            </CmsButton>

            <CmsButton
              variant="default"
              size="h52"
              onClick={() => void loadProvisioning()}
              loading={provisioningLoading}
              disabled={isLocked || !showQrSetup}
              icon={<ReloadOutlined />} >
              QR 코드 다시 불러오기
            </CmsButton>
          </Space>
        </Form>

        {isRemoteMfa ? null : (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              개발용 Mock TOTP — 운영에서는 서버에서만 시크릿·검증을 처리해야 합니다.
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}
