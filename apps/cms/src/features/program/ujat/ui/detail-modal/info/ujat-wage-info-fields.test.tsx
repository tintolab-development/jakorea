/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

vi.mock('@/features/program/shared/lib/program-wage-payment-item-helpers', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/shared/lib/program-wage-payment-item-helpers')>()
  return {
    ...actual,
    useProgramWagePaymentItemOptionsState: () => ({
      ready: true,
      options: [{ value: 'pay-1', label: '학생 교통비' }],
    }),
    useNormalizeProgramPaymentItemValues: () => undefined,
  }
})

import { UjatWageInfoFields } from './ujat-wage-info-fields'

function EditHarness() {
  const form = useForm<ProgramDetailEditFormValues>({
    defaultValues: { wagePaymentItemIds: [] } as Partial<ProgramDetailEditFormValues>,
  })
  return (
    <DetailInfoForm title="임금 정보" mode="edit">
      <UjatWageInfoFields mode="edit" form={form} />
    </DetailInfoForm>
  )
}

describe('UjatWageInfoFields', () => {
  afterEach(() => {
    cleanup()
  })

  it('시안대로 지급 항목이 비어 있어도 `기본 항목 추가` 버튼을 보여 주지 않는다', () => {
    render(<EditHarness />)

    expect(screen.getByText('지급 항목')).toBeTruthy()
    expect(screen.getByText('공제 항목')).toBeTruthy()
    // 수정 슬롯이 실제로 그려졌는지(선택 박스 placeholder) 먼저 확인해야 버튼 부재 검증이 의미가 있다.
    expect(screen.getByText('선택해 주세요')).toBeTruthy()
    expect(screen.queryByText('기본 항목 추가')).toBeNull()
    expect(screen.queryByRole('button', { name: '기본 항목 추가' })).toBeNull()
  })
})
