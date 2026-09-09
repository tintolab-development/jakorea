import { describe, expect, it } from 'vitest'
import { canUseNotificationSendTemplateForProgram } from './template-usable-for-program'

describe('canUseNotificationSendTemplateForProgram', () => {
  const catalog = [
    {
      key: '교육 진행 수업 시간',
      token: '#{교육 진행 수업 시간}',
      enabled: true,
      requiresProgram: true,
    },
    {
      key: '배정 기관명',
      token: '#{배정 기관명}',
      enabled: false,
      requiresProgram: true,
    },
  ]

  it('프로그램 미지정(전체)이면 변수 제한 없이 true', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{배정 기관명}'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(true)
  })

  it('지정 프로그램에서 enabled=false 변수 포함 시 false', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['안내 #{배정 기관명}'],
        catalog,
        programNumericId: 164003,
      })
    ).toBe(false)
  })

  it('지정 프로그램에서 enabled=true 변수만 있으면 true', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{교육 진행 수업 시간}'],
        catalog,
        programNumericId: 164003,
      })
    ).toBe(true)
  })

  it('카탈로그에 없는 키는 FE에서 막지 않는다', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{알 수 없는 키}'],
        catalog,
        programNumericId: 164003,
      })
    ).toBe(true)
  })
})
