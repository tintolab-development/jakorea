import { describe, expect, it } from 'vitest'

import type { DashboardShortcutItem } from '@/features/dashboard/api/admin-dashboard-service'
import { DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS } from '@/features/dashboard/model/dashboard-shortcut-contract'
import {
  mapDashboardShortcutSettingsCatalogItems,
  resolveDashboardShortcutItems,
} from './resolve-dashboard-shortcut-items'

function item(id: string, permissionAllowed = true): DashboardShortcutItem {
  return { id, label: id, path: `/${id}`, useYn: true, permissionAllowed }
}

const API_ITEMS: DashboardShortcutItem[] = [
  item('notices'),
  ...DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS.map(key => item(key)),
  item('bug-issue-history-denied-sample', false),
]

describe('mapDashboardShortcutSettingsCatalogItems — 설정 모달 목록', () => {
  it('마스터는 6건이 설정 가능(settingsDisabled=false)하고 활성 여부는 BE permissionAllowed로만 판정한다', () => {
    const rows = mapDashboardShortcutSettingsCatalogItems(
      [...API_ITEMS, item('privacy-query-history-like', false)],
      { isMaster: true }
    )
    for (const key of DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS) {
      const row = rows.find(r => r.id === key)
      expect(row?.settingsDisabled).toBe(false)
      expect(row?.permissionAllowed).toBe(true)
    }
    expect(rows.find(r => r.id === 'privacy-query-history-like')?.permissionAllowed).toBe(false)
  })

  it('마스터라도 BE가 권한 없음으로 준 6건 항목은 비활성', () => {
    const rows = mapDashboardShortcutSettingsCatalogItems([item('admin-permission-settings', false)], {
      isMaster: true,
    })
    expect(rows[0].settingsDisabled).toBe(false)
    expect(rows[0].permissionAllowed).toBe(false)
  })

  it('다른 역할은 6건이 계속 설정 불가', () => {
    const rows = mapDashboardShortcutSettingsCatalogItems(API_ITEMS, { isMaster: false })
    for (const key of DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS) {
      expect(rows.find(r => r.id === key)?.settingsDisabled).toBe(true)
    }
    expect(rows.find(r => r.id === 'notices')?.settingsDisabled).toBe(false)
  })
})

describe('resolveDashboardShortcutItems — 홈 바로가기', () => {
  const enabled = Object.fromEntries(API_ITEMS.map(i => [i.id, true]))

  it('마스터는 켠 6건을 홈에 보여 준다', () => {
    const ids = resolveDashboardShortcutItems(API_ITEMS, enabled, { isMaster: true }).map(i => i.id)
    for (const key of DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS) {
      expect(ids).toContain(key)
    }
    expect(ids).not.toContain('bug-issue-history-denied-sample')
  })

  it('다른 역할은 6건을 홈에 보여 주지 않는다', () => {
    const ids = resolveDashboardShortcutItems(API_ITEMS, enabled, { isMaster: false }).map(i => i.id)
    for (const key of DASHBOARD_SETTINGS_DISABLED_SHORTCUT_KEYS) {
      expect(ids).not.toContain(key)
    }
    expect(ids).toContain('notices')
  })
})
