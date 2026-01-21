/**
 * 다운로드 쿼터 Mock 데이터
 * Phase 0.5.3: 다운로드 보호 UX
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import type { DownloadQuota } from '@/types/download'

/**
 * 사용자별 다운로드 쿼터 Mock 데이터 (메모리 기반)
 */
const userQuotaMap = new Map<string, {
  todayDownloads: number
  lastDownloadAt: string | null
  lastResetDate: string
}>()

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 사용자별 다운로드 쿼터 조회 (Mock)
 */
export function getMockDownloadQuota(userId: string): DownloadQuota {
  const today = getTodayString()
  const quota = userQuotaMap.get(userId)

  // 오늘 첫 조회이거나 날짜가 바뀐 경우 초기화
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

/**
 * 다운로드 쿼터 업데이트 (Mock)
 */
export function updateMockDownloadQuota(
  userId: string,
  rowCount: number
): void {
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

/**
 * 현재 사용자의 다운로드 쿼터 조회
 */
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
  return getMockDownloadQuota(user.id)
}
