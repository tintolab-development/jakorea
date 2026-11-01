import { describe, expect, it } from 'vitest'
import {
  displayGeminiPaymentExclusionCell,
  formatGeminiPaymentExclusionReason,
  isGeminiInstructorIdentityBlankExclusion,
  isGeminiInstructorNotMatchedExclusion,
  isGeminiInstructorSoftPaymentExclusion,
} from './payment-exclusion'

describe('payment-exclusion', () => {
  it('labels IDENTITY_BLANK as performance-only', () => {
    expect(formatGeminiPaymentExclusionReason('GEMINI_INSTRUCTOR_IDENTITY_BLANK')).toBe(
      '강사 정보 미기재 (실적만 등록, 지급 없음)'
    )
    expect(isGeminiInstructorIdentityBlankExclusion('GEMINI_INSTRUCTOR_IDENTITY_BLANK')).toBe(
      true
    )
    expect(isGeminiInstructorNotMatchedExclusion('GEMINI_INSTRUCTOR_IDENTITY_BLANK')).toBe(false)
  })

  it('labels NOT_MATCHED separately from IDENTITY_BLANK', () => {
    expect(formatGeminiPaymentExclusionReason('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBe(
      '강사 회원 미매칭 (실적만 등록, 지급·정산 없음)'
    )
    expect(displayGeminiPaymentExclusionCell('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBe(
      '강사 회원 미매칭 (실적만 등록, 지급·정산 없음)'
    )
    expect(isGeminiInstructorNotMatchedExclusion('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBe(true)
    expect(isGeminiInstructorIdentityBlankExclusion('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBe(false)
    expect(isGeminiInstructorSoftPaymentExclusion('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBe(true)
  })

  it('shows dash when paymentExclusionReason is null', () => {
    expect(displayGeminiPaymentExclusionCell(null)).toBe('-')
    expect(displayGeminiPaymentExclusionCell(undefined)).toBe('-')
  })
})
