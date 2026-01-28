/**
 * MFA 모달 헤더 컴포넌트
 * Phase 0.5.1: MFA/OTP UX
 * 시니어 개발자 관점: UI 컴포넌트 분리
 */

import { Typography } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface MfaModalHeaderProps {
  phoneNumber?: string
}

export function MfaModalHeader({ phoneNumber }: MfaModalHeaderProps) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
      <Title level={3} style={{ marginBottom: 8 }}>
        2단계 인증
      </Title>
      <Text type="secondary">
        등록된 휴대폰으로 발송된 인증번호를 입력하세요.
      </Text>
      {phoneNumber && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {phoneNumber}
        </Text>
      )}
    </div>
  )
}
