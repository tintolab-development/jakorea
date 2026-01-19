/**
 * 지급조서 Mock 서비스
 */

import type { PaymentStatement } from '@/types/domain'
import { mockPaymentStatements, mockPaymentStatementsMap } from '@/data/mock'

export const paymentStatementService = {
  getAll: async (): Promise<PaymentStatement[]> => {
    return Promise.resolve(mockPaymentStatements)
  },

  getById: async (id: string): Promise<PaymentStatement> => {
    const statement = mockPaymentStatementsMap.get(id)
    if (!statement) {
      throw new Error(`PaymentStatement not found: ${id}`)
    }
    return Promise.resolve(statement)
  },

  update: async (id: string, data: Partial<Omit<PaymentStatement, 'id' | 'createdAt'>>): Promise<PaymentStatement> => {
    const statement = mockPaymentStatementsMap.get(id)
    if (!statement) {
      throw new Error(`PaymentStatement not found: ${id}`)
    }

    const updatedStatement: PaymentStatement = {
      ...statement,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    const index = mockPaymentStatements.findIndex(s => s.id === id)
    if (index !== -1) {
      mockPaymentStatements[index] = updatedStatement
    }
    mockPaymentStatementsMap.set(id, updatedStatement)
    return Promise.resolve(updatedStatement)
  },
}
