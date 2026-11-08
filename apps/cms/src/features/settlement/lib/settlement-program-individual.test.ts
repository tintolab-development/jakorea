import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { isIndividualProgramForSettlement } from './settlement-program-individual'

describe('isIndividualProgramForSettlement', () => {
  it('서버 programType이 GENERAL_INDIVIDUAL이면 서비스 상세 audience가 organization이어도 개인형', () => {
    expect(
      isIndividualProgramForSettlement({
        backendProgramType: 'GENERAL_INDIVIDUAL',
        generalProgramAudience: 'organization',
      } as Program)
    ).toBe(true)
  })

  it('서버 programType이 기관형이면 개인형 아님', () => {
    expect(
      isIndividualProgramForSettlement({
        backendProgramType: 'GENERAL_ORGANIZATION',
        generalProgramAudience: 'individual',
      } as Program)
    ).toBe(false)
  })

  it('programType이 없으면 기존 audience 판정', () => {
    expect(isIndividualProgramForSettlement({ generalProgramAudience: 'individual' } as Program)).toBe(true)
  })
})
