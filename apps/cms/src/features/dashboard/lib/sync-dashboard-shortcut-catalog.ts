import type { DashboardShortcutItem } from '@/features/dashboard/api/admin-dashboard-service'
import {
  restrictShortcutVisibilityToCatalog,
} from '@/features/dashboard/model/dashboard-shortcut-contract'
import { useDashboardSettingsStore } from '@/features/dashboard/model/dashboard-settings-store'

/** GET /api/admin/dashboard/shortcuts 수신 후 catalog·visibility 동기화 */
export function syncDashboardShortcutCatalogFromApi(items: DashboardShortcutItem[]): void {
  const activeItems = items.filter(item => item.useYn)
  const catalogKeys = activeItems.map(item => item.id)
  useDashboardSettingsStore.setState(state => ({
    shortcutCatalogKeys: catalogKeys,
    shortcutEnabled: restrictShortcutVisibilityToCatalog(state.shortcutEnabled, catalogKeys),
  }))
}
