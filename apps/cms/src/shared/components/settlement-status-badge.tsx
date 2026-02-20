/**
 * 정산 현황 배지 컴포넌트
 * 프로그램 진행현황(강사 정보) 등에서 재사용
 */

import { Tag } from 'antd'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import { SETTLEMENT_STATUS_LABELS } from '@/data/mock/participating-instructors'
import './settlement-status-badge.css'

export type { SettlementStatusKey }

interface SettlementStatusBadgeProps {
  status: SettlementStatusKey
  className?: string
}

export function SettlementStatusBadge({ status, className }: SettlementStatusBadgeProps) {
  const label = SETTLEMENT_STATUS_LABELS[status]
  return (
    <Tag
      className={`settlement-status-badge settlement-status-badge--${status} ${className ?? ''}`.trim()}
      style={{ margin: 0 }}
    >
      {label}
    </Tag>
  )
}
