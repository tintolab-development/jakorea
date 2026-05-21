/**
 * 임시 권한 관리 Hook
 * Phase 0.5.2: 권한 요청 UX
 */

import { useState, useEffect, useCallback } from 'react'
import { getTemporaryPermissions, checkPermission } from '@/entities/permission-request/api/permission-request-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { TemporaryPermission, PermissionAction } from '@/types/permission-request'

interface UseTemporaryPermissionsOptions {
  programId?: string
  activeOnly?: boolean
}

interface UseTemporaryPermissionsResult {
  permissions: TemporaryPermission[]
  loading: boolean
  error: Error | null
  fetchPermissions: () => Promise<void>
  canAccess: (programId: string, action: PermissionAction) => Promise<boolean>
  hasActivePermission: (programId: string, action: PermissionAction) => boolean
}

/**
 * 임시 권한 관리 Hook
 */
export function useTemporaryPermissions(
  options: UseTemporaryPermissionsOptions = {}
): UseTemporaryPermissionsResult {
  const { programId, activeOnly = true } = options
  const { user } = useAuthStore()
  const [permissions, setPermissions] = useState<TemporaryPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPermissions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const data = await getTemporaryPermissions({
        userId: user.id,
        programId,
        activeOnly,
      })
      setPermissions(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('임시 권한 조회에 실패했습니다.')
      setError(errorObj)
      } finally {
      setLoading(false)
    }
  }, [user, programId, activeOnly])

  useEffect(() => {
    if (user) {
      fetchPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, programId, activeOnly])

  const canAccess = useCallback(async (
    targetProgramId: string,
    action: PermissionAction
  ): Promise<boolean> => {
    if (!user) return false

    try {
      return await checkPermission(user.id, targetProgramId, action)
    } catch {
      return false
    }
  }, [user])

  const hasActivePermission = useCallback((
    targetProgramId: string,
    action: PermissionAction
  ): boolean => {
    const now = new Date()
    return permissions.some(p => {
      const isExpired = new Date(p.expiresAt) <= now
      return !isExpired &&
             p.programId === targetProgramId &&
             p.grantedActions.includes(action)
    })
  }, [permissions])

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    canAccess,
    hasActivePermission,
  }
}
