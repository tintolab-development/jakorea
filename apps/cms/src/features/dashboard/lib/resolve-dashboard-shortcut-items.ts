import { DASHBOARD_HOME_PATH } from '@/features/dashboard/model/dashboard-settings-store'
import {
  isDashboardShortcutSettingsDisabled,
  isShortcutItemEnabled,
  type DashboardShortcutSessionOptions,
} from '@/features/dashboard/model/dashboard-shortcut-contract'
import { sessionDashboardShortcutOptions } from '@/features/dashboard/lib/dashboard-shortcut-master'
import type { DashboardShortcutItem } from '@/features/dashboard/api/admin-dashboard-service'
import { resolveShortcutRoutePath } from '@/features/dashboard/lib/shortcut-navigation'
import { SHORTCUT_ITEMS } from '@/features/dashboard/model/dashboard-settings-store'

export interface ResolvedShortcutItem {
  id: string
  label: string
  path: string
}

function isShortcutAllowedOnHome(
  item: DashboardShortcutItem,
  options: DashboardShortcutSessionOptions
): boolean {
  if (!item.useYn) return false
  if (item.permissionAllowed === false) return false
  if (isDashboardShortcutSettingsDisabled(item.id, options)) return false
  return true
}

/** remote: API catalog 순서·라벨·URL. mock: SHORTCUT_ITEMS */
export function resolveDashboardShortcutItems(
  apiItems: DashboardShortcutItem[] | undefined,
  shortcutEnabled: Record<string, boolean>,
  options: DashboardShortcutSessionOptions = sessionDashboardShortcutOptions()
): ResolvedShortcutItem[] {
  if (apiItems != null && apiItems.length > 0) {
    return apiItems
      .filter(item => isShortcutAllowedOnHome(item, options))
      .filter(item => isShortcutItemEnabled(shortcutEnabled, item.id))
      .map(item => ({
        id: item.id,
        label: item.label,
        path: resolveShortcutRoutePath(item.id, item.path || DASHBOARD_HOME_PATH),
      }))
  }

  return SHORTCUT_ITEMS.filter(
    item =>
      !isDashboardShortcutSettingsDisabled(item.id, options) &&
      isShortcutItemEnabled(shortcutEnabled, item.id)
  ).map(item => ({
    id: item.id,
    label: item.label,
    path: resolveShortcutRoutePath(item.id, item.path || DASHBOARD_HOME_PATH),
  }))
}

export function mapDashboardShortcutSettingsCatalogItems(
  apiItems: DashboardShortcutItem[] | undefined,
  options: DashboardShortcutSessionOptions = sessionDashboardShortcutOptions()
): Array<{
  id: string
  label: string
  path: string
  settingsDisabled: boolean
  permissionAllowed: boolean
}> {
  if (apiItems != null && apiItems.length > 0) {
    return apiItems
      .filter(item => item.useYn)
      .map(item => ({
        id: item.id,
        label: item.label,
        path: resolveShortcutRoutePath(item.id, item.path || DASHBOARD_HOME_PATH),
        // 마스터는 6건도 설정 가능 — 활성 여부는 BE permissionAllowed로만 판정
        settingsDisabled: isDashboardShortcutSettingsDisabled(item.id, options),
        permissionAllowed: item.permissionAllowed !== false,
      }))
  }

  return SHORTCUT_ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    path: resolveShortcutRoutePath(item.id, item.path),
    settingsDisabled: isDashboardShortcutSettingsDisabled(item.id, options),
    permissionAllowed: true,
  }))
}
