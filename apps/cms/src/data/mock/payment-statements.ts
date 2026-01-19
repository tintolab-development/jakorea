/**
 * 지급조서 Mock 데이터
 */

import type { PaymentStatement, Settlement } from '@/types/domain'
import type { UUID } from '@/types'
import { mockSettlements } from './settlements'

function createPaymentStatement(settlement: Settlement, index: number): PaymentStatement {
  const generatedAt = settlement.documentGeneratedAt || settlement.updatedAt
  const isPaid = settlement.status === 'paid'
  const status: PaymentStatement['status'] = settlement.status === 'cancelled'
    ? 'cancelled'
    : isPaid
      ? 'downloaded'
      : 'ready'

  const lastDownloadedAt = isPaid
    ? new Date(generatedAt).toISOString()
    : undefined

  return {
    id: `ps-${settlement.id}-${String(index).padStart(3, '0')}`,
    settlementId: settlement.id,
    programId: settlement.programId,
    instructorId: settlement.instructorId,
    period: settlement.period,
    totalAmount: settlement.totalAmount,
    status,
    generatedAt,
    lastDownloadedAt,
    createdAt: settlement.createdAt,
    updatedAt: settlement.updatedAt,
  }
}

const eligibleSettlements = mockSettlements.filter(
  settlement => settlement.documentGeneratedAt || ['approved', 'paid'].includes(settlement.status)
)

export const mockPaymentStatements: PaymentStatement[] = eligibleSettlements
  .slice(0, 40)
  .map(createPaymentStatement)

export const mockPaymentStatementsMap = new Map<UUID, PaymentStatement>()
mockPaymentStatements.forEach(statement => {
  mockPaymentStatementsMap.set(statement.id, statement)
})
