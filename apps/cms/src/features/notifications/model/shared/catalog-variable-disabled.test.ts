import { describe, expect, it } from 'vitest'
import { isNotificationCatalogVariableDisabled } from './catalog-variable-disabled'
import { formatNotificationFailedReason } from './format-notification-failed-reason'

describe('isNotificationCatalogVariableDisabled', () => {
  it('BE enabled=false 이면 비활성', () => {
    expect(
      isNotificationCatalogVariableDisabled({ enabled: false, requiresProgram: false }, 1)
    ).toBe(true)
  })

  it('enabled=true 이고 프로그램 있으면 활성', () => {
    expect(
      isNotificationCatalogVariableDisabled({ enabled: true, requiresProgram: true }, 10)
    ).toBe(false)
  })

  it('requiresProgram 인데 programId 없으면 FE 가드', () => {
    expect(
      isNotificationCatalogVariableDisabled({ enabled: true, requiresProgram: true }, null)
    ).toBe(true)
  })
})

describe('formatNotificationFailedReason', () => {
  it('누락 코드+키를 사용자 문구로 변환한다', () => {
    expect(
      formatNotificationFailedReason(
        'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:교육 진행 수업 시간'
      )
    ).toBe('템플릿 필수 변수가 없습니다: 교육 진행 수업 시간')
  })

  it('복수 키는 쉼표+공백으로 표시한다', () => {
    expect(
      formatNotificationFailedReason(
        'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:교육 진행 수업 시간,배정 기관명'
      )
    ).toBe('템플릿 필수 변수가 없습니다: 교육 진행 수업 시간, 배정 기관명')
  })
})
