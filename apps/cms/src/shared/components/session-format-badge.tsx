/**
 * 진행 방식 배지 (온라인/오프라인)
 * 일정·강의·봉사 상세 등에서 재사용
 */

import { Tag } from 'antd'

export type SessionFormat = 'online' | 'offline'

interface SessionFormatBadgeProps {
  /** true: 온라인(녹색), false: 오프라인(기본) */
  isOnline: boolean
  className?: string
}

const LABELS: Record<SessionFormat, string> = {
  online: '온라인',
  offline: '오프라인',
}

export function SessionFormatBadge({ isOnline, className }: SessionFormatBadgeProps) {
  const format: SessionFormat = isOnline ? 'online' : 'offline'
  return (
    <Tag
      color={format === 'online' ? 'green' : 'default'}
      className={className}
      style={{ margin: 0 }}
    >
      {LABELS[format]}
    </Tag>
  )
}
