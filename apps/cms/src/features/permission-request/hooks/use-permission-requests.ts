/**
 * 권한 요청 목록 Hook (마스터용)
 * Phase 0.5.2: 권한 요청 UX
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getPermissionRequests,
  reviewPermissionRequest,
} from '@/entities/permission-request/api/permission-request-service'
import { handleError } from '@/shared/utils/error-handler'
import type { PermissionRequest, ReviewPermissionRequestInput } from '@/types/permission-request'

interface UsePermissionRequestsOptions {
  status?: PermissionRequest['status']
  autoFetch?: boolean
}

interface UsePermissionRequestsResult {
  requests: PermissionRequest[]
  loading: boolean
  error: Error | null
  fetchRequests: () => Promise<void>
  approveRequest: (input: ReviewPermissionRequestInput) => Promise<void>
  rejectRequest: (input: ReviewPermissionRequestInput) => Promise<void>
  pendingCount: number
}

/**
 * 권한 요청 목록 Hook (마스터용)
 */
export function usePermissionRequests(
  options: UsePermissionRequestsOptions = {}
): UsePermissionRequestsResult {
  const { status, autoFetch = true } = options
  const [requests, setRequests] = useState<PermissionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPermissionRequests({ status })
      setRequests(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('권한 요청 목록 조회에 실패했습니다.')
      setError(error)
      } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (autoFetch) {
      fetchRequests()
    }
  }, [autoFetch, fetchRequests])

  const approveRequest = useCallback(
    async (input: ReviewPermissionRequestInput) => {
      try {
        // Phase 0.5.2: 승인 시 임시 권한 부여
        await reviewPermissionRequest({ ...input, approved: true })

        await fetchRequests()
      } catch (err: unknown) {
        handleError(err)
      }
    },
    [fetchRequests]
  )

  const rejectRequest = useCallback(
    async (input: ReviewPermissionRequestInput) => {
      try {
        await reviewPermissionRequest({ ...input, approved: false })
        await fetchRequests()
      } catch (err: unknown) {
        handleError(err, { context: 'usePermissionRequests.rejectRequest' })
      }
    },
    [fetchRequests]
  )

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return {
    requests,
    loading,
    error,
    fetchRequests,
    approveRequest,
    rejectRequest,
    pendingCount,
  }
}
