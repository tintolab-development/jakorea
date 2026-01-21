/**
 * 신청 진행 상태 변경 서비스
 * Phase 4.6: 상태 운영 관리
 */

import type { ApplicationProgressStatus } from '@/types/application-progress'
import { mockApplications } from '@/data/mock/applications'
import { showSuccessMessage } from '@/shared/utils/error-handler'

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

// Mock 상태 변경 이력 저장소
const statusChangeLogs: StatusChangeLog[] = []

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

  const application = mockApplications.find(app => app.id === applicationId)
  if (!application) {
    throw new Error('신청을 찾을 수 없습니다')
  }

  // 현재 진행 상태 가져오기 (Application에 progressStatus 필드가 있다고 가정)
  const currentStatus = (application as any).progressStatus as ApplicationProgressStatus | undefined

  // 상태 전이 규칙 확인
  if (currentStatus) {
    const { canTransitionProgressStatus } = await import('@/types/application-progress')
    const canTransition = canTransitionProgressStatus(currentStatus, newStatus)
    if (!canTransition) {
      throw new Error('유효하지 않은 상태 전이입니다')
    }
  }

  // 상태 변경 이력 기록
  if (currentStatus) {
    const log: StatusChangeLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      applicationId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      changedBy,
      changedAt: new Date().toISOString(),
      notificationSent: false, // 알림 발송은 별도 처리
      reason,
    }
    statusChangeLogs.push(log)
  }

  // Application 상태 업데이트 (실제로는 API 호출)
  // (application as any).progressStatus = newStatus

  showSuccessMessage(`상태가 "${newStatus}"로 변경되었습니다`)
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
