import { describe, expect, it, vi } from 'vitest'
import { buildMeDashboardPreferencesRequest } from './dashboard-me-preferences-adapters'

vi.mock('@/features/dashboard/model/dashboard-settings-store', () => ({
  useDashboardSettingsStore: {
    getState: () => ({
      shortcutEnabled: { notices: true },
      widgetProgramIds: { 'recruitment-status-widget': ['p-1'] },
      inquiryNotificationReadProgramKeys: {},
    }),
  },
}))

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
