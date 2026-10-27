import { describe, expect, it } from 'vitest'
import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  canUseAlimtalkSendTemplateForManualSend,
  formatAlimtalkManualSendUnusableMessage,
  listAlimtalkManualSendUnusableKeys,
} from './manual-send-usable'
import { canUseNotificationSendTemplateForProgram } from '@/features/notifications/model/shared/template-usable-for-program'

const linkCatalog = [
  {
    key: '알림 링크 경로',
    token: '#{알림 링크 경로}',
    enabled: true,
    requiresProgram: false,
    sourceMode: 'MANUAL_ALLOWED' as const,
  },
]

const withdrawalCatalog = [
  {
    key: '회원명',
    token: '#{회원명}',
    enabled: true,
    requiresProgram: false,
    sourceMode: 'SERVER_RESOLVED' as const,
  },
  {
    key: '사용자 이메일',
    token: '#{사용자 이메일}',
    enabled: true,
    requiresProgram: false,
    categoryCode: 'SYSTEM',
    sourceMode: 'EVENT_ONLY' as const,
  },
  {
    key: '서비스 탈퇴일시',
    token: '#{서비스 탈퇴일시}',
    enabled: true,
    requiresProgram: false,
    categoryCode: 'SYSTEM',
    sourceMode: 'EVENT_ONLY' as const,
  },
]

describe('canUseAlimtalkSendTemplateForManualSend', () => {
  it('R7-FE-01 프로그램 미선택 + 미등록 변수 차단', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['알림 링크 경로'],
        catalog: [],
        programNumericId: undefined,
      })
    ).toBe(false)
  })

  it('R7-FE-02 프로그램 선택 + 미등록 변수 차단', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['알림 링크 경로'],
        catalog: [],
        programNumericId: 10,
      })
    ).toBe(false)
  })

  it('R7-FE-03 알림 링크 경로가 카탈로그에 있으면 프로그램 유무와 무관하게 사용 가능', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['알림 링크 경로'],
        catalog: linkCatalog,
        programNumericId: undefined,
      })
    ).toBe(true)
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['알림 링크 경로'],
        catalog: linkCatalog,
        programNumericId: 10,
      })
    ).toBe(true)
  })

  it('R7-FE-05 버튼 URL 변수만 있어도 인식한다', () => {
    const usedKeys = collectTemplatePlaceholderKeys({
      content: '본문',
      buttons: [{ name: '이동', destinations: { mobile: 'https://x/#{알림 링크 경로}' } }],
    })
    expect([...usedKeys]).toEqual(['알림 링크 경로'])
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys,
        catalog: linkCatalog,
        programNumericId: 10,
      })
    ).toBe(true)
  })

  it('R7-FE-06 퀵리플라이 변수를 인식한다', () => {
    const usedKeys = collectTemplatePlaceholderKeys({
      content: '본문',
      quickLinks: [{ name: '퀵', destinations: { pc: '/#{알림 링크 경로}' } }],
    })
    expect([...usedKeys]).toEqual(['알림 링크 경로'])
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys,
        catalog: linkCatalog,
        programNumericId: undefined,
      })
    ).toBe(true)
  })

  it('R7-FE-07 홈페이지 탈퇴 완료 EVENT_ONLY 차단', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['회원명', '사용자 이메일', '서비스 탈퇴일시'],
        catalog: withdrawalCatalog,
        programNumericId: undefined,
      })
    ).toBe(false)
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['회원명', '사용자 이메일', '서비스 탈퇴일시'],
        catalog: withdrawalCatalog,
        programNumericId: 10,
      })
    ).toBe(false)
    const message = formatAlimtalkManualSendUnusableMessage(
      listAlimtalkManualSendUnusableKeys({
        usedKeys: ['회원명', '사용자 이메일', '서비스 탈퇴일시'],
        catalog: withdrawalCatalog,
        programNumericId: 10,
      })
    )
    expect(message).toContain('이벤트 전용')
    expect(message).toContain('서비스 탈퇴일시')
  })

  it('R7-FE-08 SYSTEM enabled=true(local QA)만으로 사용 가능 처리하지 않는다', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['서비스 탈퇴일시'],
        catalog: [
          {
            key: '서비스 탈퇴일시',
            enabled: true,
            requiresProgram: false,
            categoryCode: 'SYSTEM',
            sourceMode: 'EVENT_ONLY',
          },
        ],
        programNumericId: 10,
      })
    ).toBe(false)
  })

  it('categoryCode가 SYSTEM이 아니어도 sourceMode=EVENT_ONLY면 차단한다', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['이벤트 전용 키'],
        catalog: [
          {
            key: '이벤트 전용 키',
            enabled: true,
            categoryCode: 'STATUS',
            sourceMode: 'EVENT_ONLY',
          },
        ],
        programNumericId: 10,
      })
    ).toBe(false)
  })

  it('sourceMode 누락은 메일 공통 판정과 달리 알림톡 피커에서 차단한다', () => {
    const catalog = [
      { key: '방문 안내', enabled: true, requiresProgram: false },
    ]
    expect(
      canUseNotificationSendTemplateForProgram({
        usedKeys: ['방문 안내'],
        catalog,
        programNumericId: 10,
      })
    ).toBe(true)
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['방문 안내'],
        catalog,
        programNumericId: 10,
      })
    ).toBe(false)
    expect(
      listAlimtalkManualSendUnusableKeys({
        usedKeys: ['방문 안내'],
        catalog,
        programNumericId: 10,
      }).unknownSourceMode
    ).toEqual(['방문 안내'])
  })

  it('R7-FE-15 카탈로그 미로드는 사용 불가다', () => {
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['방문 안내'],
        catalog: null,
        programNumericId: 10,
      })
    ).toBe(false)
  })

  it('R7-FE-14 메일·문자 공통 함수는 EVENT_ONLY 추가 차단을 하지 않는다', () => {
    expect(
      canUseNotificationSendTemplateForProgram({
        usedKeys: ['서비스 탈퇴일시'],
        catalog: [
          {
            key: '서비스 탈퇴일시',
            enabled: true,
            requiresProgram: false,
          },
        ],
        programNumericId: 10,
      })
    ).toBe(true)
  })
})
