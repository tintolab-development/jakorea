import { describe, expect, it } from 'vitest'
import {
  materialKitCurrentConfigToQuantities,
  quantitiesToMaterialKitCurrentConfigRequest,
} from './admin-material-kits-service'

describe('materialKitCurrentConfigToQuantities', () => {
  it('infant를 kindergarten으로 매핑한다', () => {
    const values = materialKitCurrentConfigToQuantities({
      infant: 3,
      elementary: 4,
      middle: 5,
      high: 6,
      university: 7,
    })
    expect(values.kindergarten).toBe('3')
    expect(values.elementary).toBe('4')
    expect(values.university).toBe('7')
  })

  it('없는 레벨을 24·32로 채우지 않는다', () => {
    const values = materialKitCurrentConfigToQuantities({ infant: 0 })
    expect(values.kindergarten).toBe('0')
    expect(values.elementary).toBe('')
    expect(values.high).toBe('')
  })
})

describe('quantitiesToMaterialKitCurrentConfigRequest', () => {
  it('kindergarten을 infant로 매핑한다', () => {
    const body = quantitiesToMaterialKitCurrentConfigRequest({
      kindergarten: '1',
      elementary: '2',
      middle: '3',
      high: '4',
      university: '5',
    })
    expect(body.infant).toBe(1)
    expect(body.university).toBe(5)
  })

  it('effectiveFrom을 전달한다', () => {
    const body = quantitiesToMaterialKitCurrentConfigRequest(
      {
        kindergarten: '24',
        elementary: '24',
        middle: '24',
        high: '32',
        university: '32',
      },
      { effectiveFrom: '2026-01-01' }
    )
    expect(body.effectiveFrom).toBe('2026-01-01')
  })

  it('0·소수·공란을 거부한다', () => {
    const invalid = {
      kindergarten: '0',
      elementary: '24',
      middle: '24',
      high: '32',
      university: '32',
    }
    expect(() => quantitiesToMaterialKitCurrentConfigRequest(invalid)).toThrow(/1~999 사이의 정수/)
    expect(() =>
      quantitiesToMaterialKitCurrentConfigRequest({ ...invalid, kindergarten: '1.5' })
    ).toThrow(/1~999 사이의 정수/)
    expect(() =>
      quantitiesToMaterialKitCurrentConfigRequest({ ...invalid, kindergarten: '' })
    ).toThrow(/1~999 사이의 정수/)
  })
})
