import { describe, expect, it } from 'vitest'
import type { NotificationTemplateVariableCatalogResponse } from '@/shared/api/generated/notifications/schemas'
import { mapTemplateVariablesCatalog } from './alimtalk-send-batch-adapters'
import { R7_LIVE_CATALOG_ROWS } from './r7-live-catalog-rows'
import { canUseAlimtalkSendTemplateForManualSend as canUsePicker } from '@/features/notifications/model/alimtalk-send/manual-send-usable'
import { canUseNotificationSendTemplateForProgram } from '@/features/notifications/model/shared/template-usable-for-program'

function liveCatalogResponse(): NotificationTemplateVariableCatalogResponse {
  const categories = new Map<
    string,
    NonNullable<NotificationTemplateVariableCatalogResponse['categories']>[number]
  >()
  for (const row of R7_LIVE_CATALOG_ROWS) {
    const current = categories.get(row.categoryCode) ?? {
      categoryCode: row.categoryCode,
      categoryLabel: row.categoryCode,
      variables: [],
    }
    current.variables = [
      ...(current.variables ?? []),
      {
        key: row.key,
        token: `#{${row.key}}`,
        requiresProgram: row.requiresProgram,
        enabled: row.enabled,
        programGroups: [],
        recruitmentTypes: [],
        participantTypes: [],
        memberTypes: [],
        sourceMode: row.sourceMode,
      },
    ]
    categories.set(row.categoryCode, current)
  }
  return {
    totalCount: R7_LIVE_CATALOG_ROWS.length,
    systemManualSendQaEnabled: true,
    categories: [...categories.values()],
  }
}

describe('R7 live catalog sourceMode mapping', () => {
  it('104개 변수의 sourceMode를 누락 없이 매핑한다', () => {
    expect(R7_LIVE_CATALOG_ROWS).toHaveLength(104)
    const mapped = mapTemplateVariablesCatalog(liveCatalogResponse())
    expect(mapped.variables).toHaveLength(104)
    expect(mapped.variables.every(item => item.sourceMode)).toBe(true)
    const counts = mapped.variables.reduce<Record<string, number>>((acc, item) => {
      const mode = item.sourceMode ?? 'null'
      acc[mode] = (acc[mode] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({
      SERVER_RESOLVED: 75,
      EVENT_ONLY: 28,
      MANUAL_ALLOWED: 1,
    })
    expect(mapped.variables.find(item => item.key === '알림 링크 경로')?.sourceMode).toBe(
      'MANUAL_ALLOWED'
    )
    expect(mapped.variables.find(item => item.key === '서비스 탈퇴일시')?.sourceMode).toBe(
      'EVENT_ONLY'
    )
    expect(mapped.variables.find(item => item.key === '회원명')?.sourceMode).toBe('SERVER_RESOLVED')
  })

  it('template 78 링크 키는 프로그램 유무와 무관하게 수동 발송 가능하다', () => {
    const catalog = mapTemplateVariablesCatalog(liveCatalogResponse()).variables
    expect(
      canUsePicker({
        usedKeys: ['알림 링크 경로'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(true)
    expect(
      canUsePicker({
        usedKeys: ['알림 링크 경로'],
        catalog,
        programNumericId: 186412,
      })
    ).toBe(true)
  })

  it('template 4 EVENT_ONLY는 QA enabled=true여도 피커에서 차단한다', () => {
    const catalog = mapTemplateVariablesCatalog(liveCatalogResponse()).variables
    expect(
      canUsePicker({
        usedKeys: ['회원명', '사용자 이메일', '서비스 탈퇴일시'],
        catalog,
        programNumericId: undefined,
      })
    ).toBe(false)
    expect(
      canUseNotificationSendTemplateForProgram({
        usedKeys: ['서비스 탈퇴일시'],
        catalog,
        programNumericId: 10,
      })
    ).toBe(true)
  })
})
