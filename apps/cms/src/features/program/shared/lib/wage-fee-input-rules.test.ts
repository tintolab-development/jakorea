import { describe, expect, it } from 'vitest'
import {
  isWageFeeOutOfRange,
  resolveWageFeeInputMessage,
  wageFeeMaxDigits,
} from './wage-fee-input-rules'

describe('강사비 입력 규칙 (QA-0383-ab40)', () => {
  it('자릿수 상한은 최댓값 자릿수다', () => {
    expect(wageFeeMaxDigits(500_000)).toBe(6)
    expect(wageFeeMaxDigits(300_000)).toBe(6)
  })

  it('범위 밖 값은 바꾸지 않고 오류로 판정한다', () => {
    expect(isWageFeeOutOfRange(500_001, 500_000)).toBe(true)
    expect(isWageFeeOutOfRange(-1, 500_000)).toBe(true)
    expect(isWageFeeOutOfRange(500_000, 500_000)).toBe(false)
    expect(isWageFeeOutOfRange(0, 500_000)).toBe(false)
  })

  it('빈 값은 범위 검사 대상이 아니다(필수 검사가 따로 막는다)', () => {
    expect(isWageFeeOutOfRange(null, 500_000)).toBe(false)
    expect(isWageFeeOutOfRange(undefined, 500_000)).toBe(false)
  })

  it('안내 문구 — 거부 사유가 우선, 그다음 범위 초과', () => {
    expect(resolveWageFeeInputMessage(100, 400_000, 'invalid-char')).toBe(
      '숫자만 입력해 주세요.'
    )
    expect(resolveWageFeeInputMessage(100, 400_000, 'too-long')).toBe(
      '최대 6자리(400,000원)까지 입력할 수 있습니다.'
    )
    expect(resolveWageFeeInputMessage(450_000, 400_000, null)).toBe(
      '0원 이상 400,000원 이하로 입력해 주세요.'
    )
    expect(resolveWageFeeInputMessage(300_000, 400_000, null)).toBeUndefined()
  })
})
