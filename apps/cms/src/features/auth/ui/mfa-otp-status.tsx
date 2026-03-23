/**
 * MFA OTP 상태 표시 컴포넌트
 * Phase 0.5.1: MFA/OTP UX — TOTP
 */

import { Typography } from 'antd'
import { OTP_POLICY } from '@/shared/constants/mfa-policy'

const { Text } = Typography

interface MfaOtpStatusProps {
  failedAttempts: number
}

export function MfaOtpStatus({ failedAttempts }: MfaOtpStatusProps) {
  return (
    <div style={{ marginBottom: 16, textAlign: 'center' }}>
      <Text type="secondary">
        앱의 코드는 약 30초마다 바뀝니다. 최신 6자리를 입력해 주세요.
      </Text>
      {failedAttempts > 0 && (
        <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
          실패 횟수: {failedAttempts} / {OTP_POLICY.maxFailedAttempts}
        </Text>
      )}
    </div>
  )
}
