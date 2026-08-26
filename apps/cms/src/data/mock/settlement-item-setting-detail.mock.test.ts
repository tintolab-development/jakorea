import { describe, expect, it } from 'vitest'
import { getSettlementItemSettingDetail } from './settlement-item-setting-detail.mock'

describe('임금 항목 상세 mock (시안 6장)', () => {
  it('1~3급은 가로 조건·산정 표(tier1)와 시안 한도·지급 요건을 갖는다', () => {
    const w1 = getSettlementItemSettingDetail('w-1')
    const w2 = getSettlementItemSettingDetail('w-2')
    const w3 = getSettlementItemSettingDetail('w-3')

    expect(w1.layout).toBe('tier1')
    expect(w1.maxLimitWon).toBe(500_000)
    expect(w1.basisHours).toBe(1)
    expect(w1.qualificationLines.at(-1)).toContain('교육운영본부 사무총장')

    expect(w2.layout).toBe('tier1')
    expect(w2.maxLimitWon).toBe(400_000)

    expect(w3.layout).toBe('tier1')
    expect(w3.maxLimitWon).toBe(300_000)
  })

  it('특강은 조건 표만(specialLecture), 기타 인건비는 빈 지급 요건·비고', () => {
    const special = getSettlementItemSettingDetail('w-4')
    const otherLabor = getSettlementItemSettingDetail('w-5')

    expect(special.layout).toBe('specialLecture')
    expect(special.qualificationLines).toEqual([
      '국내외 해당 분야 최고 권위자로 총장이 인정하는 자',
    ])

    expect(otherLabor.layout).toBe('specialLecture')
    expect(otherLabor.qualificationLines).toEqual([])
    expect(otherLabor.remarkLines).toEqual([])
  })

  it('제미나이는 gemini layout과 1~4차시 고정액이다', () => {
    const gemini = getSettlementItemSettingDetail('w-gemini')

    expect(gemini.layout).toBe('gemini')
    expect(gemini.qualificationLines).toEqual(['제미나이 프로그램에서 사용되는 강사 임금'])
    expect(gemini.remarkLines).toHaveLength(2)
    expect(gemini.geminiSession1Won).toBe(0)
    expect(gemini.geminiSession2Won).toBe(170_000)
    expect(gemini.geminiSession3Won).toBe(220_000)
    expect(gemini.geminiSession4Won).toBe(270_000)
  })
})
