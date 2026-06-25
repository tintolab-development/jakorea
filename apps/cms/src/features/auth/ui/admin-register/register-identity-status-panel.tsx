import { CheckCircleFilled } from '@ant-design/icons'
import { Alert } from 'antd'
import type { ReactNode } from 'react'

import type { IdentityVerificationHookStatus } from '@/features/auth/identity-verification'

interface RegisterIdentityStatusPanelProps {
  status: IdentityVerificationHookStatus
  errorMessage?: string | null
  verifiedName?: string
  verifiedPhone?: string
  className?: string
  idleTitle?: string
  /** `null`이면 본문(meta)을 숨깁니다. */
  idleDescription?: ReactNode | null
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) {
    return phone
  }
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
}

export function RegisterIdentityStatusPanel({
  status,
  errorMessage,
  verifiedName,
  verifiedPhone,
  className,
  idleTitle = '휴대폰 본인인증',
  idleDescription,
}: RegisterIdentityStatusPanelProps) {
  const defaultIdleDescription = (
    <>
      버튼을 누르면 인증 창이 열립니다.
      <br />
      인증이 완료되면 다음 단계로 이동할 수 있어요.
    </>
  )
  const resolvedIdleDescription =
    idleDescription === undefined ? defaultIdleDescription : idleDescription

  const rootClass = className
    ? `register-identity-module ${className}`
    : 'register-identity-module'

  if (status === 'error' && errorMessage) {
    return (
      <div className={`${rootClass} register-identity-module--error`} role="region" aria-label="본인인증 오류">
        <Alert type="error" message={errorMessage} showIcon />
      </div>
    )
  }

  if (verifiedName || verifiedPhone) {
    const meta =
      verifiedName && verifiedPhone
        ? `${verifiedName} · ${maskPhone(verifiedPhone)}`
        : verifiedName ?? (verifiedPhone ? maskPhone(verifiedPhone) : '본인인증 완료')

    return (
      <div
        className={`${rootClass} register-identity-module--verified`}
        role="region"
        aria-label="본인인증 완료"
      >
        <CheckCircleFilled className="register-identity-module__verified-icon" aria-hidden />
        <p className="register-identity-module__title">본인인증이 완료되었습니다</p>
        <p className="register-identity-module__meta">{meta}</p>
      </div>
    )
  }

  if (status === 'completing' || status === 'popup_open') {
    return (
      <div className={rootClass} role="region" aria-label="본인인증 진행 중">
        <p className="register-identity-module__title">본인인증을 진행하고 있어요</p>
        <p className="register-identity-module__meta">
          인증 창에서 절차를 완료해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className={rootClass} role="region" aria-label="통신사 본인인증 안내">
      <p className="register-identity-module__title">{idleTitle}</p>
      {resolvedIdleDescription != null ? (
        <p className="register-identity-module__meta">{resolvedIdleDescription}</p>
      ) : null}
    </div>
  )
}
