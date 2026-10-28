import { describe, expect, it } from 'vitest'
import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
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
    {
      key: '방문 안내',
      token: '#{방문 안내}',
      enabled: true,
      requiresProgram: false,
    },
  ]

  it('FE-VAR-14 프로그램 미지정에서 requiresProgram 변수는 false', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{교육 진행 수업 시간}'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(false)
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{배정 기관명}'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(false)
  })

  it('FE-VAR-02 수신자 전·프로그램 선택 시 공통 변수 템플릿은 활성', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{방문 안내}'],
        catalog,
        programNumericId: 164003,
      })
    ).toBe(true)
  })

  it('FE-VAR-13 catalog 미로드면 false', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{배정 기관명}'],
        catalog: null,
        programNumericId: 164003,
      })
    ).toBe(false)
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

  it('R7-FE-01 카탈로그에 없는 키는 프로그램 미지정도 false', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        texts: ['#{알 수 없는 키}'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(false)
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

  it('FE-VAR-12 버튼 URL 변수도 usedKeys 검사에 포함한다', () => {
    const usedKeys = collectTemplatePlaceholderKeys({
      content: '본문',
      buttons: [
        {
          name: '자세히',
          destinations: { mobile: 'https://example.com/#{담당교사명}' },
        },
      ],
    })
    expect(
      canUseNotificationSendTemplateForProgram({
        usedKeys,
        catalog: [
          ...catalog,
          { key: '담당교사명', token: '#{담당교사명}', enabled: false, requiresProgram: true },
        ],
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

  it('프로그램 미선택에서는 requiresProgram·미등록 키를 나열한다', () => {
    expect(
      listNotificationSendTemplateDisabledKeysForProgram({
        texts: ['#{교육 진행 수업 시간} #{커스텀}'],
        catalog,
        programNumericId: undefined,
      })
    ).toEqual(['교육 진행 수업 시간', '커스텀'])
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
