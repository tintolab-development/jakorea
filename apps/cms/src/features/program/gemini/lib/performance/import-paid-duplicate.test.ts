import { describe, expect, it } from 'vitest'
import {
  hasPaidBlockedImportFailures,
  hasPaidDuplicateImportResults,
  isGeminiPerformanceAccountPaid,
  isGeminiPerformancePaidBlockedError,
  isGeminiPerformancePaidBlockedText,
  isGeminiPerformancePaidRegisterBlocked,
} from './import-paid-duplicate'
import { formatGeminiImportPreviewFailures } from './import-preview-failure'

const ACCOUNT_PAID_MESSAGE =
  'GEMINI_TRAINING_REPORT_ACCOUNT_PAID: 중복된 데이터에 이미 지급조서 확인 또는 계좌 지급이 완료된 연수 실적이 포함되어 있습니다. 지급조서 확인 또는 계좌 지급이 완료된 항목은 신규 데이터를 덮어쓸 수 없습니다.'

describe('gemini performance paid duplicate', () => {
  it('keeps accountPaymentId parsing isolated from import protection', () => {
    expect(isGeminiPerformanceAccountPaid(12)).toBe(true)
    expect(isGeminiPerformanceAccountPaid(undefined)).toBe(false)
    expect(isGeminiPerformanceAccountPaid(null)).toBe(false)
    expect(isGeminiPerformanceAccountPaid(0)).toBe(false)
  })

  it('does not infer protected import duplicates from accountPaymentId alone', () => {
    expect(
      hasPaidDuplicateImportResults([
        { rowNumber: 1, duplicate: true, accountPaymentId: 88 },
        { rowNumber: 2, duplicate: true },
      ])
    ).toBe(false)
    expect(hasPaidDuplicateImportResults([{ rowNumber: 1, duplicate: true }])).toBe(false)
  })

  it('detects the backend protection code regardless of payment state', () => {
    const results = [
      {
        rowNumber: 1,
        status: 'FAILED' as const,
        message: ACCOUNT_PAID_MESSAGE,
        trainingReportId: 185986,
        accountPaymentId: 185986,
        duplicate: true,
      },
    ]
    expect(hasPaidDuplicateImportResults(results)).toBe(true)
    expect(hasPaidBlockedImportFailures(results)).toBe(true)
    expect(isGeminiPerformancePaidRegisterBlocked(results)).toBe(true)
    expect(formatGeminiImportPreviewFailures(results)).toBeUndefined()
  })

  it('detects the protection code even when accountPaymentId is omitted', () => {
    expect(
      hasPaidDuplicateImportResults([
        {
          rowNumber: 1,
          status: 'FAILED',
          duplicate: true,
          message: ACCOUNT_PAID_MESSAGE,
        },
      ])
    ).toBe(true)
  })

  it('does not treat an ordinary duplicate as a protected register block', () => {
    const unpaid = [
      {
        rowNumber: 1,
        status: 'SUCCESS' as const,
        duplicate: true,
        accountPaymentId: undefined,
      },
    ]
    expect(hasPaidDuplicateImportResults(unpaid)).toBe(false)
    expect(isGeminiPerformancePaidRegisterBlocked(unpaid)).toBe(false)
  })

  it('detects only the backend machine code', () => {
    expect(
      hasPaidBlockedImportFailures([
        {
          rowNumber: 1,
          status: 'FAILED',
          message: ACCOUNT_PAID_MESSAGE,
        },
      ])
    ).toBe(true)
    expect(
      hasPaidBlockedImportFailures([
        {
          rowNumber: 1,
          status: 'FAILED',
          message: '계좌 지급이 완료된 항목은 신규 데이터를 덮어쓸 수 없습니다.',
        },
      ])
    ).toBe(false)
    expect(
      hasPaidBlockedImportFailures([
        { rowNumber: 1, status: 'FAILED', message: 'programId is required' },
      ])
    ).toBe(false)
  })

  it('maps paid blocked errors from the server message or exact code', () => {
    expect(isGeminiPerformancePaidBlockedText('ACCOUNT_PAID')).toBe(false)
    expect(isGeminiPerformancePaidBlockedText('GEMINI_TRAINING_REPORT_ACCOUNT_PAID')).toBe(true)
    expect(isGeminiPerformancePaidBlockedText(ACCOUNT_PAID_MESSAGE)).toBe(true)
    expect(isGeminiPerformancePaidBlockedError(new Error(ACCOUNT_PAID_MESSAGE))).toBe(true)
    expect(isGeminiPerformancePaidBlockedError(new Error('계좌 지급이 완료된 항목'))).toBe(false)
    expect(isGeminiPerformancePaidBlockedError(new Error('programId is required'))).toBe(false)
  })
})
