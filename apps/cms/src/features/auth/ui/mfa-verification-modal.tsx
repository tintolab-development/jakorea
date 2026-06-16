/**
 * MFA/OTP 인증 모달
 */

import { Modal, Form, Alert, Spin } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMfaVerification } from '@/features/auth/hooks/use-mfa-verification'
import { MfaModalHeader } from './mfa-modal-header'
import { MfaOtpInput } from './mfa-otp-input'
import { MfaOtpStatus } from './mfa-otp-status'
import { MfaModalCloseIcon } from '@/shared/ui/icons/MfaModalCloseIcon'
import './mfa-verification-modal.css'

interface MfaVerificationModalProps {
  open: boolean
  onClose?: () => void
}

export function MfaVerificationModal({ open, onClose }: MfaVerificationModalProps) {
  const { user } = useAuthStore()
  const {
    form,
    onOtpCodeChange,
    provisioning,
    provisioningLoading,
    provisioningError,
    failedAttempts,
    isLocked,
    handleVerify,
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
      closable
      closeIcon={
        <span className="mfa-verification-modal__close-icon">
          <MfaModalCloseIcon />
        </span>
      }
      onCancel={onClose}
      maskClosable={false}
      width={600}
      centered
      className="mfa-verification-modal"
      styles={{
        content: {
          padding: 0,
          borderRadius: 16,
        },
        body: {
          padding: 0,
        },
      }}
    >
      <div className="mfa-verification-modal__body">
        <MfaModalHeader />

        {lockMessage && (
          <Alert type="error" description={lockMessage} showIcon className="mfa-verification-modal__alert" />
        )}

        {provisioningError && (
          <Alert
            type="warning"
            description={provisioningError}
            showIcon
            className="mfa-verification-modal__alert"
          />
        )}

        <div className="mfa-verification-modal__qr">
          {provisioningLoading ? (
            <Spin tip="QR 코드 생성 중…" />
          ) : provisioning ? (
            <img
              src={provisioning.qrDataUrl}
              alt="TOTP QR"
              className="mfa-verification-modal__qr-image"
              width={220}
              height={220}
            />
          ) : null}
        </div>

        <Form form={form} layout="vertical" onFinish={handleVerify} className="mfa-verification-modal__form">
          <MfaOtpInput
            onChange={onOtpCodeChange}
            disabled={isLocked}
            failedAttempts={failedAttempts}
          />
          {failedAttempts === 0 ? <MfaOtpStatus /> : null}
        </Form>
      </div>
    </Modal>
  )
}
