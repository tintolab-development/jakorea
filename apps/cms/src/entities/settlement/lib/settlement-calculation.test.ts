import { describe, expect, it } from 'vitest'
import { calculateSettlement, isLongDistanceFeeApplied } from './settlement-calculation'
import { INSTRUCTOR_FEE_TABLE } from '@/shared/constants/settlement-rules'

const baseParams = {
  sessions: 1 as const,
  fuelCost: 0,
  tollFee: 0,
  accommodationRequired: false,
  isBusinessIncome: true,
}

describe('isLongDistanceFeeApplied', () => {
  it('applies only for 1사1교 (special) and distance > 200', () => {
    expect(isLongDistanceFeeApplied(199, true)).toBe(false)
    expect(isLongDistanceFeeApplied(200, true)).toBe(false)
    expect(isLongDistanceFeeApplied(201, true)).toBe(true)
  })

  it('never applies for general programs even at 250km', () => {
    expect(isLongDistanceFeeApplied(250, false)).toBe(false)
    expect(isLongDistanceFeeApplied(250)).toBe(false)
  })
})

describe('calculateSettlement long-distance fee', () => {
  it('keeps base fee for general program at 250km', () => {
    const result = calculateSettlement({
      ...baseParams,
      distance: 250,
      isSpecialProgram: false,
    })
    expect(result.instructorFee).toBe(INSTRUCTOR_FEE_TABLE[1].base)
    expect(result.breakdown.isLongDistance).toBe(false)
  })

  it('applies long-distance fee only for 1사1교 above 200km', () => {
    const at199 = calculateSettlement({
      ...baseParams,
      distance: 199,
      isSpecialProgram: true,
    })
    const at200 = calculateSettlement({
      ...baseParams,
      distance: 200,
      isSpecialProgram: true,
    })
    const at201 = calculateSettlement({
      ...baseParams,
      distance: 201,
      isSpecialProgram: true,
    })
    expect(at199.instructorFee).toBe(INSTRUCTOR_FEE_TABLE[1].base)
    expect(at199.breakdown.isLongDistance).toBe(false)
    expect(at200.instructorFee).toBe(INSTRUCTOR_FEE_TABLE[1].base)
    expect(at200.breakdown.isLongDistance).toBe(false)
    expect(at201.instructorFee).toBe(INSTRUCTOR_FEE_TABLE[1].longDistance)
    expect(at201.breakdown.isLongDistance).toBe(true)
  })
})
