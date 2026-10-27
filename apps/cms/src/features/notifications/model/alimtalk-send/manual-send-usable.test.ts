import { describe, expect, it } from 'vitest'
import { collectTemplatePlaceholderKeys } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import {
  canUseAlimtalkSendTemplateForManualSend,
  diagnoseAlimtalkManualSendUnusable,
  formatAlimtalkManualSendUnusableMessage,
  formatAlimtalkManualSendUnusableReasonView,
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
    const reasons = diagnoseAlimtalkManualSendUnusable({
      usedKeys: ['회원명', '사용자 이메일', '서비스 탈퇴일시'],
      catalog: withdrawalCatalog,
      programNumericId: 10,
    })
    expect(reasons[0]?.code).toBe('EVENT_ONLY')
    expect(reasons[0]?.summary).toBe(
      '시스템 이벤트 전용 변수가 포함되어 수동 발송할 수 없습니다.'
    )
    expect(formatAlimtalkManualSendUnusableReasonView(reasons)?.summary).toContain(
      '시스템 이벤트 전용'
    )
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

  it('R8 미등록 변수 사유를 UNREGISTERED로 구분한다', () => {
    const reasons = diagnoseAlimtalkManualSendUnusable({
      usedKeys: ['없는 변수'],
      catalog: linkCatalog,
      programNumericId: 10,
    })
    expect(reasons.map(reason => reason.code)).toEqual(['UNREGISTERED'])
    expect(reasons[0]?.summary).toBe(
      '자동입력 항목에 등록되지 않은 변수가 포함되어 있습니다.'
    )
    expect(reasons[0]?.detail).toContain('없는 변수')
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['없는 변수'],
        catalog: linkCatalog,
        programNumericId: 10,
      })
    ).toBe(false)
  })

  it('R8 프로그램 필수 변수 사유를 PROGRAM_REQUIRED로 구분한다', () => {
    const catalog = [
      {
        key: '프로그램명',
        enabled: true,
        requiresProgram: true,
        sourceMode: 'SERVER_RESOLVED' as const,
      },
    ]
    const reasons = diagnoseAlimtalkManualSendUnusable({
      usedKeys: ['프로그램명'],
      catalog,
      programNumericId: undefined,
    })
    expect(reasons.map(reason => reason.code)).toEqual(['PROGRAM_REQUIRED'])
    expect(reasons[0]?.summary).toBe(
      '이 템플릿을 사용하려면 프로그램을 먼저 선택해 주세요.'
    )
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['프로그램명'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(false)
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['프로그램명'],
        catalog,
        programNumericId: 10,
      })
    ).toBe(true)
  })

  it('R8 enabled=false 사유를 CATALOG_DISABLED로 구분한다', () => {
    const catalog = [
      {
        key: '방문 안내',
        enabled: false,
        requiresProgram: false,
        sourceMode: 'SERVER_RESOLVED' as const,
      },
    ]
    const reasons = diagnoseAlimtalkManualSendUnusable({
      usedKeys: ['방문 안내'],
      catalog,
      programNumericId: 10,
    })
    expect(reasons.map(reason => reason.code)).toEqual(['CATALOG_DISABLED'])
    expect(reasons[0]?.summary).toBe(
      '현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다.'
    )
    expect(
      canUseAlimtalkSendTemplateForManualSend({
        usedKeys: ['방문 안내'],
        catalog,
        programNumericId: 10,
      })
    ).toBe(false)
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
