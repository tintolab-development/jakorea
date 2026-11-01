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
import { GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE } from './import-popup-copy'

const ACCOUNT_PAID_MESSAGE =
  'GEMINI_TRAINING_REPORT_ACCOUNT_PAID: 중복된 데이터에 계좌 지급이 완료된 연수 실적이 포함되어 있습니다. 계좌 지급이 완료된 항목은 신규 데이터로 덮어쓸 수 없습니다.'

describe('gemini performance paid duplicate', () => {
  it('treats finite accountPaymentId as paid', () => {
    expect(isGeminiPerformanceAccountPaid(12)).toBe(true)
    expect(isGeminiPerformanceAccountPaid(undefined)).toBe(false)
    expect(isGeminiPerformanceAccountPaid(null)).toBe(false)
    expect(isGeminiPerformanceAccountPaid(0)).toBe(false)
  })

  it('detects preview duplicate with accountPaymentId regardless of strategy context', () => {
    expect(
      hasPaidDuplicateImportResults([
        { rowNumber: 1, duplicate: true, accountPaymentId: 88 },
        { rowNumber: 2, duplicate: true },
      ])
    ).toBe(true)
    expect(hasPaidDuplicateImportResults([{ rowNumber: 1, duplicate: true }])).toBe(false)
  })

  it('detects BE ACCOUNT_PAID FAILED + duplicate sample (append/overwrite 무관)', () => {
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
    // 일반 행 실패 문구에는 섞지 않음 → UI는 REGISTER_BLOCKED 전용
    expect(formatGeminiImportPreviewFailures(results)).toBeUndefined()
  })

  it('detects paid duplicate from FAILED message when accountPaymentId omitted', () => {
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

  it('does not treat unpaid duplicate as paid register block', () => {
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

  it('detects paid blocked failure messages', () => {
    expect(
      hasPaidBlockedImportFailures([
        {
          rowNumber: 1,
          status: 'FAILED',
          message: '계좌 지급이 완료된 항목은 신규 데이터로 덮어쓸 수 없습니다.',
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
    expect(isGeminiPerformancePaidBlockedText(ACCOUNT_PAID_MESSAGE)).toBe(true)
    expect(
      isGeminiPerformancePaidBlockedError(
        new Error('중복된 데이터에 계좌 지급이 완료된 연수 실적이 포함되어 있습니다.')
      )
    ).toBe(true)
    expect(
      isGeminiPerformancePaidBlockedError(new Error(GEMINI_PERFORMANCE_REGISTER_BLOCKED_MESSAGE))
    ).toBe(true)
    expect(isGeminiPerformancePaidBlockedError(new Error('programId is required'))).toBe(false)
  })
})
