/**
 * 권한 요청 목록 Hook (마스터용)
 * Phase 0.5.2: 권한 요청 UX
 */

import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import {
  getPermissionRequests,
  reviewPermissionRequest,
} from '@/entities/permission-request/api/permission-request-service'
import type {
  PermissionRequest,
  ReviewPermissionRequestInput,
} from '@/types/permission-request'

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
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (autoFetch) {
      fetchRequests()
    }
  }, [autoFetch, fetchRequests])

  const approveRequest = useCallback(async (input: ReviewPermissionRequestInput) => {
    try {
      // Phase 0.5.2: 승인 시 임시 권한 부여
      const { temporaryPermission } = await reviewPermissionRequest({ ...input, approved: true })
      
      if (temporaryPermission) {
        const expiresAt = new Date(temporaryPermission.expiresAt).toLocaleDateString('ko-KR')
        message.success(MESSAGES.success.permissionRequestApprovedWithExpiry(expiresAt))
      } else {
        message.success(MESSAGES.success.permissionRequestApproved)
      }
      
      await fetchRequests()
    } catch (err: any) {
      message.error(err.message || '권한 요청 승인에 실패했습니다.')
    }
  }, [fetchRequests])

  const rejectRequest = useCallback(async (input: ReviewPermissionRequestInput) => {
    try {
      await reviewPermissionRequest({ ...input, approved: false })
      message.success(MESSAGES.success.permissionRequestRejected)
      await fetchRequests()
    } catch (err: any) {
      message.error(err.message || '권한 요청 거부에 실패했습니다.')
    }
  }, [fetchRequests])

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
