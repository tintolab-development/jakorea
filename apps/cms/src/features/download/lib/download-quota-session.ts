/**
 * 다운로드 쿼터 — 클라이언트 세션 메모리 (API 연동 전까지)
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import type { DownloadQuota } from '@/types/download'

const userQuotaMap = new Map<
  string,
  {
    todayDownloads: number
    lastDownloadAt: string | null
    lastResetDate: string
  }
>()

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getSessionDownloadQuota(userId: string): DownloadQuota {
  const today = getTodayString()
  const quota = userQuotaMap.get(userId)

  if (!quota || quota.lastResetDate !== today) {
    userQuotaMap.set(userId, {
      todayDownloads: 0,
      lastDownloadAt: null,
      lastResetDate: today,
    })
    return {
      todayDownloads: 0,
      dailyQuota: 5000,
      remainingQuota: 5000,
      lastDownloadAt: null,
      canDownload: true,
    }
  }

  const remainingQuota = 5000 - quota.todayDownloads
  const canDownload = remainingQuota > 0

  return {
    todayDownloads: quota.todayDownloads,
    dailyQuota: 5000,
    remainingQuota,
    lastDownloadAt: quota.lastDownloadAt,
    canDownload,
    reason: !canDownload ? '일일 다운로드 한도를 초과했습니다.' : undefined,
  }
}

export function updateSessionDownloadQuota(userId: string, rowCount: number): void {
  const today = getTodayString()
  const quota = userQuotaMap.get(userId)

  if (!quota || quota.lastResetDate !== today) {
    userQuotaMap.set(userId, {
      todayDownloads: rowCount,
      lastDownloadAt: new Date().toISOString(),
      lastResetDate: today,
    })
  } else {
    userQuotaMap.set(userId, {
      ...quota,
      todayDownloads: quota.todayDownloads + rowCount,
      lastDownloadAt: new Date().toISOString(),
    })
  }
}

export function getCurrentUserDownloadQuota(): DownloadQuota {
  const { user } = useAuthStore.getState()
  if (!user) {
    return {
      todayDownloads: 0,
      dailyQuota: 5000,
      remainingQuota: 5000,
      lastDownloadAt: null,
      canDownload: false,
      reason: '로그인이 필요합니다.',
    }
  }
  return getSessionDownloadQuota(user.id)
}
