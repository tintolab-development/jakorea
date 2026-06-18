/**
 * MFA 액션 버튼 컴포넌트
 * Phase 0.5.1: MFA/OTP UX — TOTP
 */

import { Space } from 'antd'
import { SafetyOutlined, ReloadOutlined } from '@ant-design/icons'
import { OTP_LENGTH } from '@/shared/constants/mfa-policy'
import { AuthLoadingButton } from '@/features/auth/ui/auth-loading-button'

interface MfaActionButtonsProps {
  otpCode: string
  verifying: boolean
  qrLoading: boolean
  isLocked: boolean
  onRefreshQr: () => void
}

export function MfaActionButtons({
  otpCode,
  verifying,
  qrLoading,
  isLocked,
  onRefreshQr,
}: MfaActionButtonsProps) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <AuthLoadingButton
        type="primary" htmlType="submit"
        block
        size="large"
        loading={verifying}
        disabled={isLocked || otpCode.length !== OTP_LENGTH}
        icon={<SafetyOutlined />}
      >
        인증하기
      </AuthLoadingButton>

      <AuthLoadingButton
        type="default"
        onClick={onRefreshQr}
        block
        size="large"
        loading={qrLoading}
        disabled={isLocked}
        icon={<ReloadOutlined />}
      >
        QR 코드 다시 불러오기
      </AuthLoadingButton>
    </Space>
  )
}
