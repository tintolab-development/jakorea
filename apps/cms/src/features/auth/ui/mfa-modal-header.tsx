/**
 * MFA 모달 헤더 컴포넌트
 * Phase 0.5.1: MFA/OTP UX — TOTP
 */

import { Typography } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface MfaModalHeaderProps {
  accountLabel?: string
}

export function MfaModalHeader({ accountLabel }: MfaModalHeaderProps) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
      <Title level={3} style={{ marginBottom: 8 }}>
        2단계 인증
      </Title>
      <Text type="secondary">
        Microsoft Authenticator(또는 Google Authenticator 등)로 QR을 등록한 뒤, 앱에 표시된 6자리 코드를
        입력하세요.
      </Text>
      {accountLabel && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {accountLabel}
        </Text>
      )}
    </div>
  )
}
