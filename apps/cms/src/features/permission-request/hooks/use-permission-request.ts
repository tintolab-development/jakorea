/**
 * 권한 요청 제출 Hook
 * Phase 0.5.2: 권한 요청 UX
 */

import { useState, useCallback } from 'react'
import { message } from 'antd'
import { createPermissionRequest } from '@/entities/permission-request/api/permission-request-service'
import type { CreatePermissionRequestInput, PermissionRequest } from '@/types/permission-request'

interface UsePermissionRequestResult {
  submitting: boolean
  submitRequest: (input: CreatePermissionRequestInput) => Promise<PermissionRequest | null>
}

/**
 * 권한 요청 제출 Hook
 */
export function usePermissionRequest(): UsePermissionRequestResult {
  const [submitting, setSubmitting] = useState(false)

  const submitRequest = useCallback(async (
    input: CreatePermissionRequestInput
  ): Promise<PermissionRequest | null> => {
    setSubmitting(true)
    try {
      const request = await createPermissionRequest(input)
      message.success(MESSAGES.success.permissionRequestSubmitted)
      return request
    } catch (error: any) {
      message.error(error.message || '권한 요청 제출에 실패했습니다.')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [])

  return {
    submitting,
    submitRequest,
  }
}
