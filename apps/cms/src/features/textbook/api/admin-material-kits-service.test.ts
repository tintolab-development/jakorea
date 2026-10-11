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

  it('null 레벨은 기본값을 유지한다', () => {
    const values = materialKitCurrentConfigToQuantities({ infant: 0 })
    expect(values.kindergarten).toBe('0')
    expect(values.elementary).toBeDefined()
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
        kindergarten: '0',
        elementary: '0',
        middle: '0',
        high: '0',
        university: '0',
      },
      { effectiveFrom: '2026-01-01' }
    )
    expect(body.effectiveFrom).toBe('2026-01-01')
  })
})
