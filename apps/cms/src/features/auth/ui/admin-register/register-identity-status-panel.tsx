import { Alert } from 'antd'
import type { ReactNode } from 'react'

import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'

import type { IdentityVerificationHookStatus } from '@/features/auth/identity-verification'

import './register-identity-status-panel.css'

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
  idleTitle = IDENTITY_MODULE_IDLE_TITLE,
  idleDescription = IDENTITY_MODULE_IDLE_DESCRIPTION,
}: RegisterIdentityStatusPanelProps) {
  const rootClass = className ? `register-identity-module ${className}` : 'register-identity-module'

  if (status === 'error' && errorMessage) {
    return (
      <div
        className={`${rootClass} register-identity-module--error`}
        role="region"
        aria-label="본인인증 오류"
      >
        <Alert type="error" message={errorMessage} showIcon />
      </div>
    )
  }

  if (verifiedName || verifiedPhone) {
    const meta =
      verifiedName && verifiedPhone
        ? `${verifiedName} · ${maskPhone(verifiedPhone)}`
        : (verifiedName ?? (verifiedPhone ? maskPhone(verifiedPhone) : '본인인증 완료'))

    return (
      <div
        className={`${rootClass} register-identity-module--verified`}
        role="region"
        aria-label="본인인증 완료"
      >
        <p className="register-identity-module__title">본인인증이 완료되었습니다</p>
        <p className="register-identity-module__meta">{meta}</p>
      </div>
    )
  }

  // 인증 창이 열려 있거나(popup_open) 결과를 처리 중(completing)이어도 안내 문구는 idle과 동일하게 유지한다.
  return (
    <div className={rootClass} role="region" aria-label="통신사 본인인증 안내">
      <p className="register-identity-module__title">{idleTitle}</p>
      {idleDescription != null ? (
        <p className="register-identity-module__meta">{idleDescription}</p>
      ) : null}
    </div>
  )
}
