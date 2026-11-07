/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { SettlementItemSettingDetailModal } from './settlement-item-setting-detail-modal'

vi.mock('./settlement-item-setting-detail-source', () => {
  const withholdingDetail = {
    layout: 'withholdingDailyWorker',
    basisUnit: '전체',
    basisHours: 1,
    compareKind: 'standard',
    maxLimitWon: null,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines: ['강사비 등 임금 항목에 소득 유형별 원천징수율 적용 (지급 항목은 실비로 제외)'],
    remarkLines: [],
    withholdingExclusionMaxWon: 1000,
    withholdingEarnedIncomeDeductionWon: 150000,
    withholdingTaxRateBusiness: 3.3,
    withholdingTaxRateOther: 8.8,
    withholdingTaxRatePrize: 4.4,
    withholdingTaxRateInterview: 22,
  } as const
  const mealDetail = {
    layout: 'meal',
    basisUnit: '시간',
    basisHours: 1,
    compareKind: 'standard',
    maxLimitWon: 500000,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines: ['참여자에게 제공되는 식사비'],
    remarkLines: [],
    evidenceSubmission: 'required',
  } as const
  const unconfiguredMealDetail = { ...mealDetail, evidenceSubmission: undefined } as const
  const lodgingDetail = {
    layout: 'lodging',
    basisUnit: '박',
    basisHours: 1,
    compareKind: 'standard',
    maxLimitWon: 150000,
    basicFeeWon: null,
    longDistanceFeeWon: null,
    qualificationLines: ['실제 숙박 여부 확인'],
    remarkLines: [],
    evidenceSubmission: 'required',
  } as const

  return {
    useSettlementItemSettingDetailSource: (itemId: string) =>
      itemId === 'meal-unconfigured'
        ? unconfiguredMealDetail
        : itemId === 'meal-1'
          ? mealDetail
          : itemId === 'p-7' || itemId === 'lodging-random'
            ? lodgingDetail
            : withholdingDetail,
    useSettlementItemSettingLayout: (itemId: string) =>
      itemId === 'meal-unconfigured' || itemId === 'meal-1'
        ? 'meal'
        : itemId === 'p-7' || itemId === 'lodging-random'
          ? 'lodging'
          : 'withholdingDailyWorker',
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

  it('신규 세율 기본값을 표시하고 수정 값을 저장 요청에 포함한다', async () => {
    const onSaveRemote = vi.fn().mockResolvedValue(undefined)

    render(
      <SettlementItemSettingDetailModal
        open
        item={{
          id: 'deduction-1',
          title: '원천징수세액',
          description: '소득 유형별 원천징수 기준과 세율을 설정합니다.',
          iconKey: 'deduct_business_33',
        }}
        onCancel={vi.fn()}
        onSaveRemote={onSaveRemote}
      />
    )

    expect(screen.getByRole('textbox', { name: '공제 요건' })).toHaveValue(
      '• 강사비 등 임금 항목에 소득 유형별 원천징수율 적용 (지급 항목은 실비로 제외)'
    )
    expect(screen.getByRole('textbox', { name: '사업소득 세율' })).toHaveValue('3.3')
    expect(screen.getByRole('textbox', { name: '기타소득 세율' })).toHaveValue('8.8')
    expect(screen.getByRole('textbox', { name: '상금 기타소득 세율' })).toHaveValue('4.4')
    expect(screen.getByRole('textbox', { name: '면접비·지원금·경품 기타소득 세율' })).toHaveValue(
      '22'
    )
    expect(screen.getByRole('columnheader', { name: '소액부징수 기준' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '근로소득공제' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '소득 유형별 원천징수율' })).toBeInTheDocument()
    expect(screen.getByText('원천징수세액(소득세)이')).toBeInTheDocument()
    expect(screen.getByText('원 미만인 경우, 미징수')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: '사업소득 세율' }), {
      target: { value: '4.1' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '기타소득 세율' }), {
      target: { value: '9.9' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onSaveRemote).toHaveBeenCalled())
    const savedDetail = onSaveRemote.mock.calls[0]?.[1]
    expect(savedDetail.withholdingTaxRateBusiness).toBe(4.1)
    expect(savedDetail.withholdingTaxRateOther).toBe(9.9)
    // Figma 미표시 필드는 detail 값 그대로 보존
  })

  it('원격 저장 실패 시 성공 처리하지 않고 모달을 닫지 않는다', async () => {
    const onSaveRemote = vi.fn().mockRejectedValue(new Error('failed'))
    const onCancel = vi.fn()

    render(
      <SettlementItemSettingDetailModal
        open
        item={{
          id: 'deduction-1',
          title: '원천징수',
          description: '',
          iconKey: 'deduct_business_33',
        }}
        onCancel={onCancel}
        onSaveRemote={onSaveRemote}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onSaveRemote).toHaveBeenCalled())
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('식사비 한도·증빙 설정을 표시하고 수정 값을 저장 요청에 포함한다', async () => {
    const onSaveRemote = vi.fn().mockResolvedValue(undefined)

    render(
      <SettlementItemSettingDetailModal
        open
        item={{
          id: 'meal-1',
          title: '식사비',
          description: '',
          iconKey: 'pay_meal',
          paymentItemType: 'MEAL',
        }}
        onCancel={vi.fn()}
        onSaveRemote={onSaveRemote}
      />
    )

    expect(screen.getByRole('textbox', { name: '지급 요건' })).toHaveValue(
      '• 참여자에게 제공되는 식사비'
    )
    expect(screen.getByRole('textbox', { name: '최대 한도 금액' })).toHaveValue('500,000')
    expect(screen.getByRole('radio', { name: '필요' })).toBeChecked()

    fireEvent.change(screen.getByRole('textbox', { name: '최대 한도 금액' }), {
      target: { value: '1,000,000' },
    })
    fireEvent.click(screen.getByRole('radio', { name: '불필요' }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onSaveRemote).toHaveBeenCalled())
    const savedDetail = onSaveRemote.mock.calls[0]?.[1]
    expect(savedDetail.maxLimitWon).toBe(1_000_000)
    expect(savedDetail.evidenceSubmission).toBe('not_required')
  })

  it('식사비 서버 증빙 설정이 미지정이면 필요/불필요를 임의 선택하지 않는다', () => {
    render(
      <SettlementItemSettingDetailModal
        open
        item={{
          id: 'meal-unconfigured',
          title: '식사비',
          description: '',
          iconKey: 'pay_meal',
          paymentItemType: 'MEAL',
        }}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('radio', { name: '필요' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: '불필요' })).not.toBeChecked()
  })

  it.each([
    ['p-7', 'LODGING_GENERAL', '최대 한도 금액'],
    ['lodging-random', 'LODGING_1C1S', '지급액'],
  ])('숙박비 %s는 paymentItemType으로 금액 라벨을 분기하고 박 기준을 표시한다', (id, paymentItemType, amountLabel) => {
    render(
      <SettlementItemSettingDetailModal
        open
        item={{
          id,
          title: paymentItemType === 'LODGING_1C1S' ? '숙박비 (1사1교)' : '숙박비',
          description: '',
          iconKey: 'pay_lodging',
          paymentItemType,
        }}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('textbox', { name: amountLabel })).toBeInTheDocument()
    expect(screen.getByText('박 기준')).toBeInTheDocument()
  })
})
