/**
 * MFA OTP 상태 표시 컴포넌트
 * Phase 0.5.1: MFA/OTP UX
 * 시니어 개발자 관점: UI 컴포넌트 분리
 */

import { Typography } from 'antd'
import { OTP_POLICY } from '@/shared/constants/mfa-policy'

const { Text } = Typography

interface MfaOtpStatusProps {
  remainingSeconds: number
  isExpired: boolean
  failedAttempts: number
}

export function MfaOtpStatus({ remainingSeconds, isExpired, failedAttempts }: MfaOtpStatusProps) {
  return (
    <div style={{ marginBottom: 16, textAlign: 'center' }}>
      <Text type={isExpired ? 'danger' : 'secondary'}>
        유효시간: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
      </Text>
      {failedAttempts > 0 && (
        <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
          실패 횟수: {failedAttempts} / {OTP_POLICY.maxFailedAttempts}
        </Text>
      )}
    </div>
  )
}
