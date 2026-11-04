/**
 * MFA/OTP 인증 모달
 */

import { useEffect, useState } from 'react'
import { Modal, Form, Alert, Spin } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { trimQrImagePadding } from '@/features/auth/lib/trim-qr-image-padding'
import { useMfaVerification } from '@/features/auth/hooks/use-mfa-verification'
import { ADMIN_MFA_LOCAL_TEST_CODE } from '@/shared/constants/mfa-policy'
import { MfaModalHeader } from './mfa-modal-header'
import { MfaOtpInput } from './mfa-otp-input'
import { MfaOtpStatus } from './mfa-otp-status'
import { ModalCloseIcon } from '@/shared/ui/icons/ModalCloseIcon'
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
    showQrSetup,
    verifyNotice,
    isLocalTestMfa,
    failedAttempts,
    isLocked,
    handleVerify,
    lockMessage,
    otpResetToken,
  } = useMfaVerification({ open })
  const qrSource = provisioning?.qrDataUrl
  const [qrSrc, setQrSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!qrSource) {
      setQrSrc(null)
      return
    }

    let cancelled = false
    void trimQrImagePadding(qrSource).then(next => {
      if (!cancelled) setQrSrc(next)
    })

    return () => {
      cancelled = true
    }
  }, [qrSource])

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
          <ModalCloseIcon width={24} height={24} />
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
        <MfaModalHeader isLocalTest={isLocalTestMfa} showQrSetup={showQrSetup} />

        {lockMessage && (
          <Alert
            type="error"
            description={lockMessage}
            showIcon
            className="mfa-verification-modal__alert"
          />
        )}

        {verifyNotice && !lockMessage && (
          <Alert
            type="error"
            description={verifyNotice}
            showIcon
            className="mfa-verification-modal__alert"
          />
        )}

        {isLocalTestMfa && (
          <Alert
            type="info"
            description={`테스트 코드 ${ADMIN_MFA_LOCAL_TEST_CODE} 을 입력해 주세요. (백엔드 mfaMethod: LOCAL_TEST_CODE)`}
            showIcon
            className="mfa-verification-modal__alert"
          />
        )}

        {provisioningError && (
          <Alert
            type="warning"
            description={provisioningError}
            showIcon
            className="mfa-verification-modal__alert"
          />
        )}

        {showQrSetup && (
          <div className="mfa-verification-modal__qr">
            {provisioningLoading ? (
              <Spin tip="QR 코드 생성 중…" />
            ) : provisioning?.qrDataUrl || provisioning?.manualSecret ? (
              <>
                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt="TOTP QR"
                    className="mfa-verification-modal__qr-image"
                    width={160}
                    height={160}
                  />
                ) : (
                  <Spin />
                )}
              </>
            ) : provisioningError ? null : (
              <Spin tip="QR 코드 생성 중…" />
            )}
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerify}
          className="mfa-verification-modal__form"
        >
          <MfaOtpInput
            onChange={onOtpCodeChange}
            disabled={isLocked}
            failedAttempts={failedAttempts}
            resetToken={otpResetToken}
          />
          {failedAttempts === 0 ? <MfaOtpStatus /> : null}
        </Form>
      </div>
    </Modal>
  )
}
