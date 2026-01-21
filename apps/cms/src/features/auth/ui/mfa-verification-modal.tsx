/**
 * MFA/OTP 인증 모달
 * Phase 0.5.1: MFA/OTP UX (NFR-SEC-AUT-01)
 * 시니어 개발자 관점: 컴포넌트 및 Hook 분리로 관심사 분리
 */

import { Modal, Form, Alert, Typography, App } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfaVerification } from '@/features/auth/hooks/use-mfa-verification'
import { MfaModalHeader } from './mfa-modal-header'
import { MfaOtpInput } from './mfa-otp-input'
import { MfaOtpStatus } from './mfa-otp-status'
import { MfaActionButtons } from './mfa-action-buttons'

const { Text } = Typography

interface MfaVerificationModalProps {
  open: boolean
}

export function MfaVerificationModal({ open }: MfaVerificationModalProps) {
  const { message } = App.useApp()
  const { user } = useAuthStore()
  const {
    form,
    otpCode,
    setOtpCode,
    mfaState,
    remainingSeconds,
    isExpired,
    canResend,
    resendCooldownSeconds,
    failedAttempts,
    isLocked,
    sending,
    verifying,
    handleVerify,
    handleResend,
    lockMessage,
  } = useMfaVerification({ open, messageApi: message })

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
      <MfaModalHeader phoneNumber={mfaState?.phoneNumber} />

      {lockMessage && (
        <Alert
          type="error"
          message={lockMessage}
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleVerify}
      >
        <MfaOtpInput
          onChange={setOtpCode}
          disabled={isLocked || isExpired}
        />

        <MfaOtpStatus
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          failedAttempts={failedAttempts}
        />

        <MfaActionButtons
          otpCode={otpCode}
          verifying={verifying}
          sending={sending}
          canResend={canResend}
          resendCooldownSeconds={resendCooldownSeconds}
          isLocked={isLocked}
          isExpired={isExpired}
          onResend={handleResend}
        />
      </Form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          인증번호가 오지 않나요? 재전송 버튼을 클릭하세요.
          <br />
          테스트용 인증번호: <Text code>123456</Text> 또는 <Text code>000000</Text>
        </Text>
      </div>
    </Modal>
  )
}
