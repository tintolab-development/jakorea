import { DASHBOARD_HOME_PATH } from '@/features/dashboard/model/dashboard-settings-store'
import {
  isDashboardShortcutSettingsDisabled,
  isShortcutItemEnabled,
} from '@/features/dashboard/model/dashboard-shortcut-contract'
import type { DashboardShortcutItem } from '@/features/dashboard/api/admin-dashboard-service'
import { resolveShortcutRoutePath } from '@/features/dashboard/lib/shortcut-navigation'
import {
  SHORTCUT_ITEMS,
  isShortcutSettingsDisabled,
} from '@/features/dashboard/model/dashboard-settings-store'

export interface ResolvedShortcutItem {
  id: string
  label: string
  path: string
}

function isShortcutAllowedOnHome(item: DashboardShortcutItem): boolean {
  if (!item.useYn) return false
  if (item.permissionAllowed === false) return false
  if (isDashboardShortcutSettingsDisabled(item.id)) return false
  return true
}

/** remote: API catalog 순서·라벨·URL. mock: SHORTCUT_ITEMS */
export function resolveDashboardShortcutItems(
  apiItems: DashboardShortcutItem[] | undefined,
  shortcutEnabled: Record<string, boolean>
): ResolvedShortcutItem[] {
  if (apiItems != null && apiItems.length > 0) {
    return apiItems
      .filter(isShortcutAllowedOnHome)
      .filter(item => isShortcutItemEnabled(shortcutEnabled, item.id))
      .map(item => ({
        id: item.id,
        label: item.label,
        path: resolveShortcutRoutePath(item.id, item.path || DASHBOARD_HOME_PATH),
      }))
  }

  return SHORTCUT_ITEMS.filter(
    item => !item.settingsDisabled && isShortcutItemEnabled(shortcutEnabled, item.id)
  ).map(item => ({
    id: item.id,
    label: item.label,
    path: resolveShortcutRoutePath(item.id, item.path || DASHBOARD_HOME_PATH),
  }))
}

export function mapDashboardShortcutSettingsCatalogItems(
  apiItems: DashboardShortcutItem[] | undefined
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
        settingsDisabled: isDashboardShortcutSettingsDisabled(item.id),
        permissionAllowed: item.permissionAllowed !== false,
      }))
  }

  return SHORTCUT_ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    path: resolveShortcutRoutePath(item.id, item.path),
    settingsDisabled: isShortcutSettingsDisabled(item.id),
    permissionAllowed: true,
  }))
}
