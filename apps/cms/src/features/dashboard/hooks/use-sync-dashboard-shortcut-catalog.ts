import { useEffect } from 'react'
import { useDashboardShortcuts } from '@/features/dashboard/hooks/use-dashboard-shortcuts'
import { syncDashboardShortcutCatalogFromApi } from '@/features/dashboard/lib/sync-dashboard-shortcut-catalog'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'

/** shortcuts GET 수신 시 catalogKeys·visibility를 API 기준으로 동기화 */
export function useSyncDashboardShortcutCatalog(enabled = true): void {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)
  const { data: shortcuts } = useDashboardShortcuts(remoteEnabled)

  useEffect(() => {
    if (!remoteEnabled || !shortcuts?.length) return
    syncDashboardShortcutCatalogFromApi(shortcuts)
  }, [remoteEnabled, shortcuts])
}
