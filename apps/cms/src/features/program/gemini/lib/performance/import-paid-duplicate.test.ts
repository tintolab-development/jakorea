import { describe, expect, it } from 'vitest'
import {
  hasPaidBlockedImportFailures,
  hasPaidDuplicateImportResults,
  isGeminiPerformanceAccountPaid,
  isGeminiPerformancePaidBlockedError,
  isGeminiPerformancePaidBlockedText,
} from './import-paid-duplicate'

describe('gemini performance paid duplicate', () => {
  it('treats finite accountPaymentId as paid', () => {
    expect(isGeminiPerformanceAccountPaid(12)).toBe(true)
    expect(isGeminiPerformanceAccountPaid(undefined)).toBe(false)
    expect(isGeminiPerformanceAccountPaid(null)).toBe(false)
    expect(isGeminiPerformanceAccountPaid(0)).toBe(false)
  })

  it('detects preview duplicate with accountPaymentId', () => {
    expect(
      hasPaidDuplicateImportResults([
        { rowNumber: 1, duplicate: true, accountPaymentId: 88 },
        { rowNumber: 2, duplicate: true },
      ])
    ).toBe(true)
    expect(hasPaidDuplicateImportResults([{ rowNumber: 1, duplicate: true }])).toBe(false)
  })

  it('detects paid blocked failure messages', () => {
    expect(
      hasPaidBlockedImportFailures([
        {
          rowNumber: 1,
          status: 'FAILED',
          message: '계좌 지급이 완료된 항목은 신규 데이터를 덮어쓸 수 없습니다.',
        },
      ])
    ).toBe(true)
    expect(
      hasPaidBlockedImportFailures([{ rowNumber: 1, status: 'FAILED', message: 'programId is required' }])
    ).toBe(false)
  })

  it('maps paid blocked errors from message or code', () => {
    expect(isGeminiPerformancePaidBlockedText('ACCOUNT_PAID')).toBe(true)
    expect(isGeminiPerformancePaidBlockedText('GEMINI_TRAINING_REPORT_ACCOUNT_PAID')).toBe(true)
    expect(
      isGeminiPerformancePaidBlockedError(
        new Error('중복된 데이터에 계좌 지급이 완료된 연수 실적이 포함되어 있습니다.')
      )
    ).toBe(true)
    expect(isGeminiPerformancePaidBlockedError(new Error('programId is required'))).toBe(false)
  })
})
