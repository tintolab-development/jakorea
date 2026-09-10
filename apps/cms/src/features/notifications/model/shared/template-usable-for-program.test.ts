import { describe, expect, it } from 'vitest'
import {
  canUseNotificationSendTemplateForProgram,
  formatNotificationSendTemplateDisabledKeysWarning,
  listNotificationSendTemplateDisabledKeysForProgram,
} from './template-usable-for-program'

describe('canUseNotificationSendTemplateForProgram (메일·문자·알림톡 피커)', () => {
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

  it('catalog 미로드면 true (로딩 중 선택본을 지우지 않음)', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{배정 기관명}'],
        catalog: null,
        programNumericId: 164003,
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

  it('카탈로그에 없는 키는 프로그램 지정 시 false', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{알 수 없는 키}'],
        catalog,
        programNumericId: 164003,
      })
    ).toBe(false)
  })

  it('메가 템플릿처럼 비활성 키가 섞이면 false (일반 프로그램 정상)', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{교육 진행 수업 시간} #{배정 기관명}'],
        catalog,
        programNumericId: 164003,
      })
    ).toBe(false)
  })
})

describe('listNotificationSendTemplateDisabledKeysForProgram', () => {
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

  it('lists disabled and unknown keys for unusable reason copy', () => {
    expect(
      listNotificationSendTemplateDisabledKeysForProgram({
        texts: ['#{교육 진행 수업 시간} #{배정 기관명} #{커스텀}'],
        catalog,
        programNumericId: 164003,
      })
    ).toEqual(['배정 기관명', '커스텀'])
  })

  it('formats warning copy with keys preserved', () => {
    expect(formatNotificationSendTemplateDisabledKeysWarning(['배정 기관명', '모집유형'])).toBe(
      [
        '이 템플릿에는 현재 프로그램·참여유형에서 비활성인 변수가 포함되어 있습니다.',
        '발송 시 값이 없으면 실패할 수 있습니다: 배정 기관명, 모집유형',
      ].join('\n')
    )
  })
})
