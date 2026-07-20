import {
  DASHBOARD_HOME_PATH,
  SHORTCUT_ITEMS,
  isShortcutItemEnabled,
} from '@/features/dashboard/model/dashboard-settings-store'
import type { DashboardShortcutItem } from '@/features/dashboard/api/admin-dashboard-service'

export interface ResolvedShortcutItem {
  id: string
  label: string
  path: string
}

/** API shortcuts + 로컬 상수 merge. visibility는 preferences shortcutEnabled */
export function resolveDashboardShortcutItems(
  apiItems: DashboardShortcutItem[] | undefined,
  shortcutEnabled: Record<string, boolean>
): ResolvedShortcutItem[] {
  const localById = new Map(SHORTCUT_ITEMS.map(item => [item.id, item]))

  if (!apiItems || apiItems.length === 0) {
    return SHORTCUT_ITEMS.filter(item => isShortcutItemEnabled(shortcutEnabled, item.id))
  }

  return apiItems
    .filter(item => item.useYn && isShortcutItemEnabled(shortcutEnabled, item.id))
    .map(item => {
      const local = localById.get(item.id)
      return {
        id: item.id,
        label: item.label || local?.label || item.id,
        path: item.path || local?.path || DASHBOARD_HOME_PATH,
      }
    })
}
