import { describe, expect, it } from 'vitest'
import {
  displayGeminiPaymentExclusionCell,
  formatGeminiPaymentExclusionReason,
  isGeminiInstructorExternalPayeeExclusion,
  isGeminiInstructorIdentityBlankExclusion,
  isGeminiInstructorPerformanceOnlyExclusion,
} from './payment-exclusion'

describe('payment-exclusion', () => {
  it('labels IDENTITY_BLANK as performance-only', () => {
    expect(formatGeminiPaymentExclusionReason('GEMINI_INSTRUCTOR_IDENTITY_BLANK')).toBe(
      '강사 정보 미기재 (실적만 등록, 계좌 지급 제외)'
    )
    expect(isGeminiInstructorIdentityBlankExclusion('GEMINI_INSTRUCTOR_IDENTITY_BLANK')).toBe(
      true
    )
    expect(isGeminiInstructorExternalPayeeExclusion('GEMINI_INSTRUCTOR_IDENTITY_BLANK')).toBe(false)
  })

  it('labels EXTERNAL_PAYEE as performance-only without opening payout flow', () => {
    expect(formatGeminiPaymentExclusionReason('GEMINI_INSTRUCTOR_EXTERNAL_PAYEE')).toBe(
      '외부 지급처 (실적만 등록, 계좌 지급 제외)'
    )
    expect(displayGeminiPaymentExclusionCell('GEMINI_INSTRUCTOR_EXTERNAL_PAYEE')).toBe(
      '외부 지급처 (실적만 등록, 계좌 지급 제외)'
    )
    expect(isGeminiInstructorExternalPayeeExclusion('GEMINI_INSTRUCTOR_EXTERNAL_PAYEE')).toBe(true)
    expect(isGeminiInstructorIdentityBlankExclusion('GEMINI_INSTRUCTOR_EXTERNAL_PAYEE')).toBe(false)
    expect(isGeminiInstructorPerformanceOnlyExclusion('GEMINI_INSTRUCTOR_EXTERNAL_PAYEE')).toBe(true)
  })

  it('does not treat NOT_MATCHED as a payment exclusion', () => {
    expect(formatGeminiPaymentExclusionReason('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBeUndefined()
    expect(isGeminiInstructorPerformanceOnlyExclusion('GEMINI_INSTRUCTOR_NOT_MATCHED')).toBe(false)
  })

  it('shows dash when paymentExclusionReason is null', () => {
    expect(displayGeminiPaymentExclusionCell(null)).toBe('-')
    expect(displayGeminiPaymentExclusionCell(undefined)).toBe('-')
  })
})
