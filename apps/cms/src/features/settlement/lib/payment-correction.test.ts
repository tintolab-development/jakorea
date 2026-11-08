import { describe, expect, it } from 'vitest'
import {
  buildPaymentCorrectionApprovalRequest,
  canProcessPaymentCorrection,
  EMPTY_PAYMENT_CORRECTION_FORM,
} from './payment-correction'

describe('buildPaymentCorrectionApprovalRequest', () => {
  it('방식 미선택이면 막는다', () => {
    expect(buildPaymentCorrectionApprovalRequest(EMPTY_PAYMENT_CORRECTION_FORM)).toEqual({
      ok: false,
      message: '강사비 책정 방식을 선택해 주세요.',
    })
  })

  it('프로그램 기준 적용은 TIER만 보내고 단가·지급 기준은 보내지 않는다', () => {
    expect(
      buildPaymentCorrectionApprovalRequest({
        ...EMPTY_PAYMENT_CORRECTION_FORM,
        pricingMode: 'PROGRAM_STANDARD',
        standardWageType: 'TIER2',
        calculationUnit: 'PER_CLASS',
        unitAmount: '50000',
      })
    ).toEqual({ ok: true, body: { pricingMode: 'PROGRAM_STANDARD', wageItemType: 'TIER2' } })
  })

  it('프로그램 기준 적용에서 강사비 유형이 없으면 막는다', () => {
    const result = buildPaymentCorrectionApprovalRequest({
      ...EMPTY_PAYMENT_CORRECTION_FORM,
      pricingMode: 'PROGRAM_STANDARD',
    })
    expect(result.ok).toBe(false)
  })

  it('특강 강사비는 지급 기준·단가·wageItemType=SPECIAL_LECTURE를 보낸다', () => {
    expect(
      buildPaymentCorrectionApprovalRequest({
        ...EMPTY_PAYMENT_CORRECTION_FORM,
        pricingMode: 'SPECIAL_LECTURE',
        calculationUnit: 'PER_LECTURE',
        unitAmount: '200,000',
      })
    ).toEqual({
      ok: true,
      body: {
        pricingMode: 'SPECIAL_LECTURE',
        wageItemType: 'SPECIAL_LECTURE',
        calculationUnit: 'PER_LECTURE',
        unitAmount: 200000,
      },
    })
  })

  it('기타 인건비는 1차시당 기준으로 보낼 수 있다', () => {
    const result = buildPaymentCorrectionApprovalRequest({
      ...EMPTY_PAYMENT_CORRECTION_FORM,
      pricingMode: 'OTHER_LABOR',
      calculationUnit: 'PER_CLASS',
      unitAmount: '30000',
    })
    expect(result).toEqual({
      ok: true,
      body: {
        pricingMode: 'OTHER_LABOR',
        wageItemType: 'OTHER_LABOR',
        calculationUnit: 'PER_CLASS',
        unitAmount: 30000,
      },
    })
  })

  it('수기 방식에서 지급 기준·단가가 없거나 0이면 막는다', () => {
    const base = { ...EMPTY_PAYMENT_CORRECTION_FORM, pricingMode: 'SPECIAL_LECTURE' as const }
    expect(buildPaymentCorrectionApprovalRequest({ ...base, unitAmount: '1000' })).toEqual({
      ok: false,
      message: '지급 기준을 선택해 주세요.',
    })
    expect(
      buildPaymentCorrectionApprovalRequest({ ...base, calculationUnit: 'PER_CLASS', unitAmount: '0' })
    ).toEqual({ ok: false, message: '강사비를 입력해 주세요.' })
  })
})

describe('canProcessPaymentCorrection', () => {
  const base = {
    enabled: true,
    paymentOrdersRemote: true,
    processingStatusClass: 'correction' as const,
    correctionRequestId: 11,
  }

  it('정정 요청 상태 + id + 정산 관리 진입이면 노출', () => {
    expect(canProcessPaymentCorrection(base)).toBe(true)
  })

  it('다른 상태·id 없음·다른 진입 경로·mock이면 미노출', () => {
    expect(canProcessPaymentCorrection({ ...base, processingStatusClass: 'pending' })).toBe(false)
    expect(canProcessPaymentCorrection({ ...base, correctionRequestId: undefined })).toBe(false)
    expect(canProcessPaymentCorrection({ ...base, enabled: false })).toBe(false)
    expect(canProcessPaymentCorrection({ ...base, paymentOrdersRemote: false })).toBe(false)
  })
})
