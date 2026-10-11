/**
 * 신청 진행 상태 변경 서비스
 * Phase 4.6: 상태 운영 관리
 */

import type { ApplicationProgressStatus } from '@/types/application-progress'
import { applicationService } from '@/entities/application/api/application-service'
export interface StatusChangeLog {
  id: string
  applicationId: string
  fromStatus: ApplicationProgressStatus
  toStatus: ApplicationProgressStatus
  changedBy: string
  changedAt: string
  notificationSent: boolean
  reason?: string
}

const statusChangeLogs: StatusChangeLog[] = []

/**
 * Phase 0.3.2: 승인 시 RECEIVED 로그 추가 (타임라인 표시용)
 */
export function appendReceivedLog(applicationId: string, submittedAt: string): void {
  const exists = statusChangeLogs.some(
    log => log.applicationId === applicationId && log.toStatus === 'RECEIVED'
  )
  if (exists) return
  statusChangeLogs.push({
    id: `log-approved-${applicationId}-${Date.now()}`,
    applicationId,
    fromStatus: 'RECEIVED',
    toStatus: 'RECEIVED',
    changedBy: 'system',
    changedAt: submittedAt,
    notificationSent: false,
  })
}

/**
 * 상태 변경 이력 조회
 */
export async function getStatusHistory(applicationId: string): Promise<StatusChangeLog[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return statusChangeLogs.filter(log => log.applicationId === applicationId)
}

/**
 * 상태 변경
 */
export async function changeApplicationProgressStatus(
  applicationId: string,
  newStatus: ApplicationProgressStatus,
  changedBy: string,
  reason?: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const application = await applicationService.getById(applicationId)

  const currentStatus = application.progressStatus

  if (currentStatus) {
    const { canTransitionProgressStatus } = await import('@/types/application-progress')
    const canTransition = canTransitionProgressStatus(currentStatus, newStatus)
    if (!canTransition) {
      throw new Error('유효하지 않은 상태 전이입니다')
    }
  }

  let notificationSent = false
  try {
    const shouldAutoNotify = ['MATCHING_COMPLETED', 'MATERIAL_SHIPPED', 'IN_PROGRESS'].includes(
      newStatus
    )
    if (shouldAutoNotify) {
      notificationSent = true
    }
  } catch (error) {
    console.error('알림 발송 실패:', error)
  }

  const log: StatusChangeLog = {
    id: `log-${Date.now()}-${Math.random()}`,
    applicationId,
    fromStatus: currentStatus || 'RECEIVED',
    toStatus: newStatus,
    changedBy,
    changedAt: new Date().toISOString(),
    notificationSent,
    reason,
  }
  statusChangeLogs.push(log)

  await applicationService.update(applicationId, {
    progressStatus: newStatus,
  })
}

/**
 * 상태 변경 이력에 알림 발송 상태 업데이트
 */
export async function updateNotificationStatus(
  logId: string,
  notificationSent: boolean
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100))
  const log = statusChangeLogs.find(l => l.id === logId)
  if (log) {
    log.notificationSent = notificationSent
  }
}
