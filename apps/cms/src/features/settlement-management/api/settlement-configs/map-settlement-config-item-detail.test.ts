import { describe, expect, it } from 'vitest'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import { WageItemResponseWageItemType } from '@/shared/api/generated/settlement/schemas/wageItemResponseWageItemType'
import {
  mapPaymentItemToSettingDetail,
  mapWageItemToSettingDetail,
} from './map-settlement-config-item-detail'

describe('mapWageItemToSettingDetail', () => {
  it('GET에 지급요건·비고·한도가 없으면 1급 카탈로그 기본값을 채운다', () => {
    const detail = mapWageItemToSettingDetail({
      id: 1,
      wageItemType: WageItemResponseWageItemType.TIER1,
      name: '1급 강사비',
      description: '상세 기준에 따라 적용되는 임금입니다.',
      layout: 'tier1',
    })

    expect(detail.layout).toBe('tier1')
    expect(detail.basisHours).toBe(1)
    expect(detail.maxLimitWon).toBeNull()
    expect(detail.qualificationLines).toEqual([])
    expect(detail.remarkLines).toEqual([])
  })

  it('flat 필드가 있으면 카탈로그를 덮어쓰지 않는다', () => {
    const detail = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      basisHours: 2,
      maxLimitWon: 123_000,
      qualificationLines: ['서버 지급 요건'],
      remarkLines: ['서버 비고'],
    })

    expect(detail.basisHours).toBe(2)
    expect(detail.maxLimitWon).toBe(123_000)
    expect(detail.qualificationLines).toEqual(['서버 지급 요건'])
    expect(detail.remarkLines).toEqual(['서버 비고'])
  })

  it('detailJson 객체·문자열에서 지급요건·한도를 읽는다', () => {
    const fromObject = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      detailJson: {
        qualificationLines: ['JSON 요건'],
        remarkLines: ['JSON 비고'],
        maxLimitWon: 500_000,
      } as unknown as string,
    })
    expect(fromObject.qualificationLines).toEqual(['JSON 요건'])
    expect(fromObject.remarkLines).toEqual(['JSON 비고'])
    expect(fromObject.maxLimitWon).toBe(500_000)

    const fromString = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      detailJson: JSON.stringify({
        qualificationLines: ['문자 JSON 요건'],
        remarkLines: ['문자 JSON 비고'],
        maxLimitWon: 400_000,
      }),
    })
    expect(fromString.qualificationLines).toEqual(['문자 JSON 요건'])
    expect(fromString.maxLimitWon).toBe(400_000)
  })

  it('maxLimitWon이 없으면 amount를 한도로 쓴다', () => {
    const detail = mapWageItemToSettingDetail({
      wageItemType: WageItemResponseWageItemType.TIER1,
      layout: 'tier1',
      amount: 500_000,
      qualificationLines: ['요건'],
      remarkLines: ['비고'],
    })
    expect(detail.maxLimitWon).toBe(500_000)
  })
})

describe('mapPaymentItemToSettingDetail', () => {
  it('증빙 정책은 evidenceRequiredYn을 쓰고 detailJson.evidenceSubmission은 무시한다', () => {
    const notRequired = mapPaymentItemToSettingDetail({
      id: 166201,
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_INSTRUCTOR,
      itemName: '강사 교통비',
      evidenceRequiredYn: false,
      taxableYn: true,
      useYn: true,
      detailJson: JSON.stringify({ evidenceSubmission: 'required' }),
    })
    expect(notRequired.evidenceSubmission).toBe('not_required')

    const required = mapPaymentItemToSettingDetail({
      id: 166202,
      paymentItemType: PaymentItemResponsePaymentItemType.TRANSPORT_STUDENT,
      itemName: '학생 교통비',
      evidenceRequiredYn: true,
      taxableYn: false,
      useYn: true,
      detailJson: JSON.stringify({ evidenceSubmission: 'not_required' }),
    })
    expect(required.evidenceSubmission).toBe('required')
  })

  it('evidenceRequiredYn이 없으면 미설정으로 두고 false로 대체하지 않는다', () => {
    const unconfigured = mapPaymentItemToSettingDetail({
      paymentItemType: PaymentItemResponsePaymentItemType.MEAL,
      itemName: '식사비',
      detailJson: JSON.stringify({ evidenceSubmission: 'required' }),
    })
    expect(unconfigured.evidenceSubmission).toBeUndefined()
  })
})
