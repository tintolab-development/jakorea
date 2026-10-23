import { describe, expect, it } from 'vitest'
import {
  getProgramWagePaymentItemOptions,
  mergeProgramWagePaymentItemOptions,
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
  resolveProgramPaymentItemLabel,
} from './program-wage-payment-item-helpers'

describe('지급 항목 선택 라벨', () => {
  it('p-3 코드는 숙박비 라벨로 보여 준다', () => {
    expect(resolveProgramPaymentItemLabel('p-3')).toBe('숙박비')
    expect(programPaymentItemLabelsFromIds(['p-3', 'p-1'])).toBe('숙박비, 강사 교통비')
  })

  it('저장된 값이 코드여도 선택 id로 되돌린다', () => {
    expect(resolveProgramPaymentItemIdsFromLabels('p-3, p-1')).toEqual(['p-3', 'p-1'])
    expect(resolveProgramPaymentItemIdsFromLabels('숙박비, 강사 교통비')).toEqual(['p-3', 'p-1'])
  })

  it('배열로 내려온 지급 항목도 선택 id로 되돌린다', () => {
    expect(resolveProgramPaymentItemIdsFromLabels(['숙박비', '강사 교통비'])).toEqual(['p-3', 'p-1'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([
        { itemType: 'LODGING', useYn: true },
        { itemType: 'TRANSPORTATION', useYn: true },
      ])
    ).toEqual(['p-3', 'p-1'])
  })

  it('GET TRANSPORTATION만 있으면 강사만 켜고 학생은 켜지 않는다', () => {
    expect(
      resolveProgramPaymentItemIdsFromLabels([{ itemType: 'TRANSPORTATION', useYn: true }])
    ).toEqual(['p-1'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([
        { itemType: 'TRANSPORTATION', useYn: true },
        { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
      ])
    ).toEqual(['p-1', '학생 교통비'])
  })

  it('원격 옵션 라벨이 코드여도 mock 항목명을 유지한다', () => {
    const merged = mergeProgramWagePaymentItemOptions([
      { value: 'p-3', label: 'p-3' },
    ])
    expect(merged.find(o => o.value === 'p-3')?.label).toBe('숙박비')
  })

  it('옵션 목록에 p-3이 있으면 코드가 아니라 항목명이 있다', () => {
    const options = getProgramWagePaymentItemOptions()
    expect(options.find(o => o.value === 'p-3')?.label).toBe('숙박비')
  })
})
