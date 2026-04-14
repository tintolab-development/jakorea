/**
 * 정산 현황 배지 — StatusBadge(settlement) 위임
 */

import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import { StatusBadge } from './status-badge'

export type { SettlementStatusKey }

interface SettlementStatusBadgeProps {
  status: SettlementStatusKey
  className?: string
}

export function SettlementStatusBadge({ status, className }: SettlementStatusBadgeProps) {
  return <StatusBadge domain="settlement" status={status} variant="badge" className={className} />
}
