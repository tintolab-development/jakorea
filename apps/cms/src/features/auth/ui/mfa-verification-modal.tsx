/**
 * MFA/OTP 인증 모달
 * Phase 0.5.1: MFA/OTP UX — TOTP (Microsoft Authenticator)
 */

import { Modal, Form, Alert, Typography, Spin } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfaVerification } from '@/features/auth/hooks/use-mfa-verification'
import { ADMIN_MFA_LOCAL_TEST_CODE } from '@/shared/constants/mfa-policy'
import { MfaModalHeader } from './mfa-modal-header'
import { MfaOtpInput } from './mfa-otp-input'
import { MfaOtpStatus } from './mfa-otp-status'
import { MfaActionButtons } from './mfa-action-buttons'

const { Text } = Typography

interface MfaVerificationModalProps {
  open: boolean
}

export function MfaVerificationModal({ open }: MfaVerificationModalProps) {
  const { user } = useAuthStore()
  const {
    form,
    otpCode,
    onOtpCodeChange,
    mfaState,
    provisioning,
    provisioningLoading,
    provisioningError,
    failedAttempts,
    isLocked,
    verifying,
    handleVerify,
    refreshProvisioning,
    lockMessage,
  } = useMfaVerification({ open })

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      closable={false}
      maskClosable={false}
      width={480}
      centered
      styles={{
        body: {
          padding: '32px 24px',
        },
      }}
    >
      <MfaModalHeader accountLabel={mfaState?.accountLabel} />

      {lockMessage && (
        <Alert type="error" description={lockMessage} style={{ marginBottom: 24 }} showIcon />
      )}

      {mfaState?.challengeUuid && mfaState.mfaMethod === 'LOCAL_TEST_CODE' && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="로컬 테스트 MFA"
          description={
            <>
              API 로그인 후 아래 고정 코드를 입력하세요:{' '}
              <Text code copyable={{ text: ADMIN_MFA_LOCAL_TEST_CODE }}>
                {ADMIN_MFA_LOCAL_TEST_CODE}
              </Text>
            </>
          }
        />
      )}

      {provisioningError && (
        <Alert type="warning" description={provisioningError} style={{ marginBottom: 16 }} showIcon />
      )}

      <div
        style={{
          textAlign: 'center',
          marginBottom: 20,
          minHeight: mfaState?.challengeUuid ? 0 : 220,
        }}
      >
        {provisioningLoading ? (
          <Spin tip="QR 코드 생성 중…" />
        ) : provisioning ? (
          <>
            <img
              src={provisioning.qrDataUrl}
              alt="TOTP QR"
              width={220}
              height={220}
              style={{ display: 'inline-block' }}
            />
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
        <MfaOtpInput onChange={onOtpCodeChange} disabled={isLocked} />

        <MfaOtpStatus failedAttempts={failedAttempts} />

        <MfaActionButtons
          otpCode={otpCode}
          verifying={verifying}
          qrLoading={provisioningLoading}
          isLocked={isLocked}
          onRefreshQr={() => void refreshProvisioning()}
        />
      </Form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {mfaState?.challengeUuid
            ? '서버에서 발급한 인증 코드를 입력하세요.'
            : '개발용: 시크릿은 Mock 데이터에 고정되어 있습니다. 운영 환경에서는 서버에서만 검증해야 합니다.'}
        </Text>
      </div>
    </Modal>
  )
}
