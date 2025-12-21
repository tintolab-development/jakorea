/**
 * 상태 전이 Timeline 컴포넌트
 * 공통 UI 원칙: 상태는 문장으로 설명, Enum 기반 조건 제어
 */

import { Timeline, Typography, Space } from 'antd'
import type { TimelineProps } from 'antd'

const { Text } = Typography

interface StatusTimelineItem {
  status: string
  statusLabel: string
  timestamp: string
  description?: string
  color?: string
}

interface StatusTimelineProps {
  items: StatusTimelineItem[]
  statusLabels: Record<string, string>
  statusColors?: Record<string, string>
}

export function StatusTimeline({ items, statusLabels, statusColors }: StatusTimelineProps) {
  const timelineItems: TimelineProps['items'] = items.map((item) => ({
    color: item.color || statusColors?.[item.status] || 'blue',
    children: (
      <Space direction="vertical" size={0}>
        <Text strong>{statusLabels[item.status] || item.statusLabel}</Text>
        {item.description && <Text type="secondary">{item.description}</Text>}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(item.timestamp).toLocaleString('ko-KR')}
        </Text>
      </Space>
    ),
  }))

  return <Timeline items={timelineItems} />
}

