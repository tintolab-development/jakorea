/**
 * 다운로드 쿼터 Hook
 * Phase 0.5.3: 다운로드 보호 UX
 */

import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { DOWNLOAD_LIMITS } from '@/shared/constants/download-policy'
import { getCurrentUserDownloadQuota, updateMockDownloadQuota } from '@/data/mock/download-quota'
import type { DownloadQuota, DownloadCheckResult } from '@/types/download'

interface UseDownloadQuotaResult {
  quota: DownloadQuota
  loading: boolean
  canDownload: (rowCount: number) => DownloadCheckResult
  recordDownload: (rowCount: number) => void
  refreshQuota: () => void
}

/**
 * 다운로드 쿼터 Hook
 */
export function useDownloadQuota(): UseDownloadQuotaResult {
  const [quota, setQuota] = useState<DownloadQuota>(() => getCurrentUserDownloadQuota())
  const [loading, setLoading] = useState(false)

  const refreshQuota = useCallback(() => {
    setLoading(true)
    try {
      const newQuota = getCurrentUserDownloadQuota()
      setQuota(newQuota)
    } catch {
      message.error('다운로드 쿼터 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshQuota()
  }, [refreshQuota])

  const canDownload = useCallback((rowCount: number): DownloadCheckResult => {
    // 행수 제한 체크
    if (rowCount > DOWNLOAD_LIMITS.maxRowsPerDownload) {
      return {
        allowed: false,
        reason: `최대 ${DOWNLOAD_LIMITS.maxRowsPerDownload}행까지 다운로드 가능합니다.`,
        quota,
      }
    }

    // 일일 쿼터 체크
    if (quota.todayDownloads + rowCount > quota.dailyQuota) {
      return {
        allowed: false,
        reason: '일일 다운로드 한도를 초과했습니다.',
        quota,
      }
    }

    // 레이트 리밋 체크
    if (quota.lastDownloadAt) {
      const lastDownloadTime = new Date(quota.lastDownloadAt).getTime()
      const now = Date.now()
      const timeSinceLastDownload = now - lastDownloadTime

      if (timeSinceLastDownload < DOWNLOAD_LIMITS.rateLimitWindowMs) {
        const remainingSeconds = Math.ceil(
          (DOWNLOAD_LIMITS.rateLimitWindowMs - timeSinceLastDownload) / 1000
        )
        return {
          allowed: false,
          reason: `잠시 후 다시 시도해주세요. (${remainingSeconds}초 후 가능)`,
          quota,
        }
      }
    }

    return {
      allowed: true,
      quota,
    }
  }, [quota])

  const recordDownload = useCallback((rowCount: number) => {
    const { user } = useAuthStore.getState()
    if (!user) return

    updateMockDownloadQuota(user.id, rowCount)
    refreshQuota()
  }, [refreshQuota])

  return {
    quota,
    loading,
    canDownload,
    recordDownload,
    refreshQuota,
  }
}
