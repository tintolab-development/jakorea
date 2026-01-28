/**
 * MFA 액션 버튼 컴포넌트
 * Phase 0.5.1: MFA/OTP UX
 * 시니어 개발자 관점: UI 컴포넌트 분리
 */

import { Button, Space } from 'antd'
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons'
import { OTP_LENGTH } from '@/shared/constants/mfa-policy'

interface MfaActionButtonsProps {
  otpCode: string
  verifying: boolean
  sending: boolean
  canResend: boolean
  resendCooldownSeconds: number
  isLocked: boolean
  isExpired: boolean
  onResend: () => void
}

export function MfaActionButtons({
  otpCode,
  verifying,
  sending,
  canResend,
  resendCooldownSeconds,
  isLocked,
  isExpired,
  onResend,
}: MfaActionButtonsProps) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Button
        type="primary"
        htmlType="submit"
        block
        size="large"
        loading={verifying}
        disabled={isLocked || isExpired || otpCode.length !== OTP_LENGTH}
        icon={<SafetyOutlined />}
      >
        인증하기
      </Button>

      <Button
        onClick={onResend}
        block
        size="large"
        loading={sending}
        disabled={!canResend || isLocked}
        icon={<ReloadOutlined />}
      >
        {canResend ? '재전송' : `재전송 (${Math.ceil(resendCooldownSeconds / 60)}분 후 가능)`}
      </Button>
    </Space>
  )
}
