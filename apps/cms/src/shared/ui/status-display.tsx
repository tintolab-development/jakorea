/**
 * 상태 표시 컴포넌트
 * 공통 UI 원칙: 상태는 반드시 문장으로 설명, 단일 상태만 표시
 */

import { Badge, Space, Typography } from 'antd'

const { Text } = Typography

interface StatusDisplayProps {
  status: string
  statusLabels: Record<string, string>
  statusColors?: Record<string, string>
  showBadge?: boolean
}

export function StatusDisplay({ 
  status, 
  statusLabels, 
  statusColors,
  showBadge = true 
}: StatusDisplayProps) {
  const label = statusLabels[status] || status
  const color = statusColors?.[status] || 'default'

  return (
    <Space>
      {showBadge && <Badge status={color as any} />}
      <Text>{label}</Text>
    </Space>
  )
}


