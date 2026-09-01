import { describe, expect, it } from 'vitest'
import { WageItemResponseWageItemType } from '@/shared/api/generated/settlement/schemas/wageItemResponseWageItemType'
import { mapWageItemToSettingDetail } from './map-settlement-config-item-detail'

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
    expect(detail.maxLimitWon).toBe(500_000)
    expect(detail.qualificationLines).toEqual([
      '해당분야 최고의 전문가',
      '전·현직 장관(급) 및 대학총장(급)',
      '전·현직 국회의원, 대기업 총수, 국영기업체',
      '정부 출연 연구기관장, 기업·기관, 단체의 장',
      '사회 통념상 상기 자격에 준하는 자로서 교육운영본부 사무총장이 인정하는 자',
    ])
    expect(detail.remarkLines).toEqual([
      '유급의 내부직원에게는 지급 불가',
      '강의에 필요한 교재의 원고료, 강사 교통비(실비)는 필요사유에 따라 별도 지급 가능',
    ])
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
