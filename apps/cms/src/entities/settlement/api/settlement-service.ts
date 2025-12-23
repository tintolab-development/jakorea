/**
 * 정산 Mock 서비스
 * Phase 4: Mock API 서비스
 */

import type { Settlement } from '@/types/domain'
import { mockSettlements, mockSettlementsMap } from '@/data/mock'

export const settlementService = {
  getAll: async (): Promise<Settlement[]> => {
    return Promise.resolve(mockSettlements)
  },

  getById: async (id: string): Promise<Settlement> => {
    const settlement = mockSettlementsMap.get(id)
    if (!settlement) {
      throw new Error(`Settlement not found: ${id}`)
    }
    return Promise.resolve(settlement)
  },

  create: async (data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>): Promise<Settlement> => {
    // totalAmount는 items에서 자동 계산
    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)

    const newSettlement: Settlement = {
      ...data,
      totalAmount,
      id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockSettlements.push(newSettlement)
    mockSettlementsMap.set(newSettlement.id, newSettlement)
    return Promise.resolve(newSettlement)
  },

  update: async (id: string, data: Partial<Omit<Settlement, 'id' | 'createdAt'>>): Promise<Settlement> => {
    const settlement = mockSettlementsMap.get(id)
    if (!settlement) {
      throw new Error(`Settlement not found: ${id}`)
    }

    // items가 업데이트되면 totalAmount 재계산
    const items = data.items || settlement.items
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    const updatedSettlement: Settlement = {
      ...settlement,
      ...data,
      totalAmount,
      updatedAt: new Date().toISOString(),
    }
    const index = mockSettlements.findIndex(s => s.id === id)
    if (index !== -1) {
      mockSettlements[index] = updatedSettlement
    }
    mockSettlementsMap.set(id, updatedSettlement)
    return Promise.resolve(updatedSettlement)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockSettlements.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Settlement not found: ${id}`)
    }
    mockSettlements.splice(index, 1)
    mockSettlementsMap.delete(id)
    return Promise.resolve()
  },
}




