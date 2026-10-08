import { afterEach, describe, expect, it } from 'vitest'
import {
  clearOperationalSeedDefaultSuppression,
  readOperationalOverlayKvValue,
  suppressOperationalSeedDefaults,
} from './operational-seed-default-suppression'

describe('readOperationalOverlayKvValue', () => {
  afterEach(() => {
    clearOperationalSeedDefaultSuppression()
  })

  it('템플릿 변경 후에도 빈 객체 기본값은 undefined가 되지 않는다', () => {
    suppressOperationalSeedDefaults('general-application', ['application.economy'])
    const answers = readOperationalOverlayKvValue<Record<string, string>>(
      'general-application',
      {},
      'application.economy.guidanceAnswers',
      {}
    )
    expect(answers).toEqual({})
    expect(answers['computer-in-room']).toBeUndefined()
  })

  it('빈 칸만 있는 일정 객체는 형태를 유지한다', () => {
    suppressOperationalSeedDefaults('general-application', ['application.economy'])
    const block = {
      date: null,
      session: undefined,
      times: [{ classPeriod: '', start: null, end: null }],
    }
    expect(
      readOperationalOverlayKvValue(
        'general-application',
        {},
        'application.economy.schedule.first',
        block
      )
    ).toBe(block)
  })

  it('채워진 선택 목록 시드는 템플릿 변경 후 비운다', () => {
    suppressOperationalSeedDefaults('general-recruit', ['recruit.instructor'])
    expect(
      readOperationalOverlayKvValue(
        'general-recruit',
        {},
        'recruit.instructor.recruitTargets',
        ['성인']
      )
    ).toEqual([])
  })

  it('채워진 숫자 시드는 템플릿 변경 후 비운다', () => {
    suppressOperationalSeedDefaults('institution-recruit', ['*'])
    expect(
      readOperationalOverlayKvValue(
        'institution-recruit',
        {},
        'recruit.maxAssignableInstructors',
        2
      )
    ).toBeUndefined()
  })
})
