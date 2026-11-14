import { describe, expect, it } from 'vitest'
import { clampWageFee, isWageFeeOutOfRange } from './wage-fee-input-rules'

describe('강사비 입력 규칙', () => {
  it('최대 금액을 넘으면(자릿수 초과 포함) 최대 금액으로 맞춘다', () => {
    expect(clampWageFee(400_000, 300_000)).toBe(300_000)
    expect(clampWageFee(4_000_000, 300_000)).toBe(300_000)
    expect(clampWageFee(250_000, 300_000)).toBe(250_000)
    expect(clampWageFee(0, 300_000)).toBe(0)
  })

  it('등록 검사 안전장치 — 범위 밖 저장값은 오류로 판정한다', () => {
    expect(isWageFeeOutOfRange(500_001, 500_000)).toBe(true)
    expect(isWageFeeOutOfRange(-1, 500_000)).toBe(true)
    expect(isWageFeeOutOfRange(500_000, 500_000)).toBe(false)
  })

  it('빈 값은 범위 검사 대상이 아니다(필수 검사가 따로 막는다)', () => {
    expect(isWageFeeOutOfRange(null, 500_000)).toBe(false)
    expect(isWageFeeOutOfRange(undefined, 500_000)).toBe(false)
  })
})
