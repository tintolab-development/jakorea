/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SettlementItemSettingDetailModal } from './settlement-item-setting-detail-modal'

vi.mock('./settlement-item-setting-detail-source', () => {
  const detail = {
    layout: 'withholdingDailyWorker',
    basisUnit: '전체',
    basisHours: 1,
    compareKind: 'standard',
    maxLimitWon: null,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines: [],
    remarkLines: [],
    withholdingExclusionMaxWon: null,
    withholdingEarnedIncomeDeductionWon: null,
    withholdingTaxRateBusiness: null,
    withholdingTaxRateOther: null,
    withholdingTaxRatePrize: null,
    withholdingTaxRateInterview: null,
  } as const

  return {
    useSettlementItemSettingDetailSource: () => detail,
    useSettlementItemSettingLayout: () => 'withholdingDailyWorker',
    usePersistSettlementItemSettingDetail: () => vi.fn(),
  }
})

afterEach(cleanup)

describe('SettlementItemSettingDetailModal 원천징수 금액 입력', () => {
  it('3.333을 3333으로 바꾸지 않고 오류 표시와 함께 저장을 비활성화한다', () => {
    render(
      <SettlementItemSettingDetailModal
        open
        item={{
          id: 'deduction-1',
          title: '원천징수',
          description: '',
          iconKey: 'deduct_business_33',
        }}
        onCancel={vi.fn()}
      />
    )

    const amountInput = screen.getByRole('textbox', {
      name: '소액 부징수 원천징수세액 한도(원)',
    })
    const saveButton = screen.getByRole('button', { name: '저장' })

    fireEvent.change(amountInput, { target: { value: '3.333' } })

    expect(amountInput).toHaveValue('3.333')
    expect(screen.getByText(/정수.*입력/)).toBeInTheDocument()
    expect(saveButton).toBeDisabled()
  })
})
