/**
 * 위젯 순서·너비 변경 후 Me preferences PUT을 디바운스.
 * 제스처 중 호출해도 마지막 커밋만 저장하고, 레이아웃이 같으면 skip.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useSaveDashboardPreferences } from '@/features/dashboard/hooks/use-dashboard-preferences'
import {
  serializeDashboardLayoutSnapshot,
  shouldSkipLayoutPersist,
  snapshotDashboardLayoutForRole,
} from '@/features/dashboard/lib/layout-snapshot'
import type { UserRole } from '@/types/user'

export const LAYOUT_PERSIST_DEBOUNCE_MS = 400

export function usePersistDashboardLayout(
  enabled: boolean,
  userRole: UserRole | null
) {
  const { mutate: persistPreferences } = useSaveDashboardPreferences({
    invalidateShortcutBadges: false,
  })
  const lastSnapshotRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !userRole) return
    lastSnapshotRef.current = serializeDashboardLayoutSnapshot(
      snapshotDashboardLayoutForRole(userRole)
    )
  }, [enabled, userRole])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return useCallback(() => {
    if (!enabled || !userRole) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const next = snapshotDashboardLayoutForRole(userRole)
      if (shouldSkipLayoutPersist(lastSnapshotRef.current, next)) return
      persistPreferences(undefined, {
        onSuccess: () => {
          lastSnapshotRef.current = serializeDashboardLayoutSnapshot(
            snapshotDashboardLayoutForRole(userRole)
          )
        },
      })
    }, LAYOUT_PERSIST_DEBOUNCE_MS)
  }, [enabled, userRole, persistPreferences])
}
