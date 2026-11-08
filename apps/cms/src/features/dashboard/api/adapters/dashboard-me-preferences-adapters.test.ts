import { describe, expect, it, vi } from 'vitest'
import {
  buildMeDashboardPreferencesRequest,
  fingerprintMePreferencesRequest,
  shouldApplyPreferencesSaveToClient,
} from './dashboard-me-preferences-adapters'

vi.mock('@/features/dashboard/model/dashboard-settings-store', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/dashboard/model/dashboard-settings-store')>()
  return {
    ...actual,
    useDashboardSettingsStore: {
      getState: () => ({
        shortcutEnabled: { notices: true },
        shortcutCatalogKeys: ['notices'],
        widgetProgramIds: { 'recruitment-status-widget': ['p-1'] },
        inquiryNotificationReadProgramKeys: {},
      }),
    },
  }
})

vi.mock('@/features/dashboard/model/dashboard-widget-order-store', () => ({
  stripRemovedDashboardWidgetIds: (ids: string[]) => ids,
  stripRemovedDashboardWidgetWidths: (widths: unknown) => widths,
  useDashboardWidgetOrderStore: {
    getState: () => ({
      orderByRole: { ADMIN: ['menu-shortcut-widget'] },
      widthByRole: { ADMIN: { 'menu-shortcut-widget': 24 } },
    }),
  },
}))

describe('buildMeDashboardPreferencesRequest', () => {
  it('레이아웃은 UserRole 키를 읽고, request.role은 실제 관리자 역할을 보낸다', () => {
    const body = buildMeDashboardPreferencesRequest('ADMIN', 'VIEWER')
    expect(body.role).toBe('VIEWER')
    expect(body.layout?.orderedWidgetIds).toEqual(['menu-shortcut-widget'])
    expect(body.layout?.widgetWidths).toEqual({ 'menu-shortcut-widget': 24 })
    expect(body.settings?.widgetProgramFilters).toEqual({
      'recruitment-status-widget': ['p-1'],
    })
  })

  it('request.role을 MASTER로 바꿔 보내지 않는다', () => {
    const body = buildMeDashboardPreferencesRequest('ADMIN', 'VIEWER')
    expect(body.role).not.toBe('MASTER')
    expect(body.role).not.toBe('ADMIN')
  })
})

describe('preferences save stale apply', () => {
  it('보낸 fingerprint와 현재 fingerprint가 다르면 로컬에 적용하지 않는다', () => {
    expect(shouldApplyPreferencesSaveToClient('sent-a', 'current-b')).toBe(false)
    expect(shouldApplyPreferencesSaveToClient('same', 'same')).toBe(true)
  })

  it('필터 id 순서가 달라도 동일 fingerprint', () => {
    const a = fingerprintMePreferencesRequest({
      schemaVersion: 1,
      layout: { orderedWidgetIds: ['w'], widgetWidths: { w: 24 } },
      settings: { widgetProgramFilters: { k: ['b', 'a'] } },
    })
    const b = fingerprintMePreferencesRequest({
      schemaVersion: 1,
      layout: { orderedWidgetIds: ['w'], widgetWidths: { w: 24 } },
      settings: { widgetProgramFilters: { k: ['a', 'b'] } },
    })
    expect(a).toBe(b)
  })
})
