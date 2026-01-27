/**
 * 지급조서 Mock 서비스
 */

import type { PaymentStatement } from '@/types/domain'
import { mockPaymentStatements, mockPaymentStatementsMap } from '@/data/mock'
import { settlementService } from './settlement-service'

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

  /**
   * 강사 ID로 지급조서 조회 (강사용)
   */
  getByInstructorId: async (instructorId: string): Promise<PaymentStatement[]> => {
    return Promise.resolve(mockPaymentStatements.filter(ps => ps.instructorId === instructorId))
  },

  /**
   * 정산 ID로 지급조서 조회
   */
  getBySettlementId: async (settlementId: string): Promise<PaymentStatement | null> => {
    const statement = mockPaymentStatements.find(ps => ps.settlementId === settlementId)
    return Promise.resolve(statement || null)
  },

  update: async (
    id: string,
    data: Partial<Omit<PaymentStatement, 'id' | 'createdAt'>>
  ): Promise<PaymentStatement> => {
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

  /**
   * 강사 확인 완료 처리
   * 확인 완료 시 정산 상태를 'paid'로 변경하고 계좌 지급 프로세스 시작
   */
  confirmByInstructor: async (id: string): Promise<PaymentStatement> => {
    const statement = mockPaymentStatementsMap.get(id)
    if (!statement) {
      throw new Error(`PaymentStatement not found: ${id}`)
    }

    if (statement.instructorConfirmed) {
      throw new Error('이미 확인 완료된 지급조서입니다.')
    }

    const now = new Date().toISOString()
    const updatedStatement: PaymentStatement = {
      ...statement,
      instructorConfirmed: true,
      instructorConfirmedAt: now,
      updatedAt: now,
    }

    const index = mockPaymentStatements.findIndex(s => s.id === id)
    if (index !== -1) {
      mockPaymentStatements[index] = updatedStatement
    }
    mockPaymentStatementsMap.set(id, updatedStatement)

    // 강사 확인 완료 시 정산 상태를 'paid'로 변경
    try {
      await settlementService.updateStatus(statement.settlementId, 'paid')
    } catch (error) {
      console.error('Failed to update settlement status:', error)
      // 정산 상태 업데이트 실패해도 지급조서 확인은 완료 처리
    }

    return Promise.resolve(updatedStatement)
  },

  /**
   * 계좌 지급 완료 처리 (관리자용)
   */
  completePayment: async (id: string): Promise<PaymentStatement> => {
    const statement = mockPaymentStatementsMap.get(id)
    if (!statement) {
      throw new Error(`PaymentStatement not found: ${id}`)
    }

    if (!statement.instructorConfirmed) {
      throw new Error('강사 확인이 완료되지 않았습니다.')
    }

    if (statement.paymentCompleted) {
      throw new Error('이미 지급 완료된 지급조서입니다.')
    }

    const now = new Date().toISOString()
    const updatedStatement: PaymentStatement = {
      ...statement,
      paymentCompleted: true,
      paymentCompletedAt: now,
      updatedAt: now,
    }

    const index = mockPaymentStatements.findIndex(s => s.id === id)
    if (index !== -1) {
      mockPaymentStatements[index] = updatedStatement
    }
    mockPaymentStatementsMap.set(id, updatedStatement)

    return Promise.resolve(updatedStatement)
  },
}
