/**
 * 접근 권한 체크 Hook
 * Phase 0.5.2: 권한 요청 UX
 */

import { useState, useEffect } from 'react'
import { useTemporaryPermissions } from './use-temporary-permissions'
import type { PermissionAction } from '@/types/permission-request'
import type { UUID } from '@/types'

interface UseCanAccessOptions {
  programId: UUID
  action: PermissionAction
  autoCheck?: boolean
}

interface UseCanAccessResult {
  canAccess: boolean
  loading: boolean
  checkAccess: () => Promise<void>
}

/**
 * 특정 프로그램에 대한 접근 권한 확인 Hook
 */
export function useCanAccess({ programId, action, autoCheck = true }: UseCanAccessOptions): UseCanAccessResult {
  const { canAccess: checkPermission, hasActivePermission, loading } = useTemporaryPermissions({
    programId,
    activeOnly: true,
  })
  const [canAccess, setCanAccess] = useState(false)

  const checkAccess = async () => {
    const hasPermission = hasActivePermission(programId, action) || await checkPermission(programId, action)
    setCanAccess(hasPermission)
  }

  useEffect(() => {
    if (autoCheck) {
      checkAccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheck, programId, action])

  return {
    canAccess,
    loading,
    checkAccess,
  }
}
