import { describe, expect, it } from 'vitest'
import { applySettlementPolicyToCommonInfo } from './settlement-policy-to-wage-rows'

describe('applySettlementPolicyToCommonInfo — 지급 항목', () => {
  it('settlementPolicy.paymentItems가 빈 배열이고 원문이 「해당없음」이면 「해당없음」을 유지한다', () => {
    const result = applySettlementPolicyToCommonInfo(
      { paymentItems: '해당없음', deductionItems: '해당없음' },
      { paymentItems: [] }
    )
    expect(result?.paymentItems).toBe('해당없음')
  })

  it('「해당 없음」(띄어쓰기) 원문도 「해당없음」으로 유지한다', () => {
    const result = applySettlementPolicyToCommonInfo(
      { paymentItems: '해당 없음' },
      { paymentItems: [] }
    )
    expect(result?.paymentItems).toBe('해당없음')
  })

  it('빈 배열이면 이전 실제 항목 원문(숙박비)은 버린다', () => {
    const result = applySettlementPolicyToCommonInfo(
      { paymentItems: '숙박비' },
      { paymentItems: [] }
    )
    expect(result?.paymentItems).toBeUndefined()
  })

  it('구조화 항목이 있으면 원문 「해당없음」보다 우선한다', () => {
    const result = applySettlementPolicyToCommonInfo(
      { paymentItems: '해당없음' },
      { paymentItems: [{ itemType: 'LODGING', useYn: true }] }
    )
    expect(result?.paymentItems).toBe('숙박비')
  })
})
