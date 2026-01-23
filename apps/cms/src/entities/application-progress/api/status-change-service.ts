/**
 * 신청 진행 상태 변경 서비스
 * Phase 4.6: 상태 운영 관리
 */

import type { ApplicationProgressStatus } from '@/types/application-progress'
import { APPLICATION_PROGRESS_ORDER } from '@/types/application-progress'
import { mockApplications } from '@/data/mock/applications'
import { showSuccessMessage } from '@/shared/utils/error-handler'
import dayjs from 'dayjs'

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

let seedDone = false

/** Phase 0.2.4: 승인된 신청에 Mock 타임라인 이력 시드 (FR-D01) */
function seedMockStatusHistory(): void {
  if (seedDone) return
  seedDone = true
  const approved = mockApplications.filter(
    (a): a is typeof a & { progressStatus: ApplicationProgressStatus } =>
      a.status === 'approved' && !!a.progressStatus
  )
  for (const app of approved) {
    const base = dayjs(app.submittedAt)
    let from: ApplicationProgressStatus = 'RECEIVED'
    statusChangeLogs.push({
      id: `seed-${app.id}-RECEIVED`,
      applicationId: app.id,
      fromStatus: 'RECEIVED',
      toStatus: 'RECEIVED',
      changedBy: 'system',
      changedAt: base.toISOString(),
      notificationSent: false,
    })
    if (app.progressStatus === 'RECEIVED') continue
    for (let i = 1; i < APPLICATION_PROGRESS_ORDER.length; i++) {
      const to = APPLICATION_PROGRESS_ORDER[i] as ApplicationProgressStatus
      statusChangeLogs.push({
        id: `seed-${app.id}-${to}`,
        applicationId: app.id,
        fromStatus: from,
        toStatus: to,
        changedBy: 'system',
        changedAt: base.add(i, 'day').toISOString(),
        notificationSent: false,
      })
      if (to === app.progressStatus) break
      from = to
    }
  }
}

seedMockStatusHistory()

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

  const application = mockApplications.find(app => app.id === applicationId)
  if (!application) {
    throw new Error('신청을 찾을 수 없습니다')
  }

  const currentStatus = application.progressStatus

  // 상태 전이 규칙 확인
  if (currentStatus) {
    const { canTransitionProgressStatus } = await import('@/types/application-progress')
    const canTransition = canTransitionProgressStatus(currentStatus, newStatus)
    if (!canTransition) {
      throw new Error('유효하지 않은 상태 전이입니다')
    }
  }

  // Phase 0.3.6: 상태 변경 시 알림 발송 트리거 (Mock)
  let notificationSent = false
  try {
    // 특정 상태 변경 시 자동 알림 발송
    const shouldAutoNotify = ['MATCHING_COMPLETED', 'MATERIAL_SHIPPED', 'IN_PROGRESS'].includes(
      newStatus
    )
    if (shouldAutoNotify) {
      // Mock: 실제로는 알림 서비스 호출
      // await sendApplicationProgressNotification(application, newStatus, changedBy)
      notificationSent = true
    }
  } catch (error) {
    console.error('알림 발송 실패:', error)
    // 알림 발송 실패해도 상태 변경은 진행
  }

  // 상태 변경 이력 기록
  const log: StatusChangeLog = {
    id: `log-${Date.now()}-${Math.random()}`,
    applicationId,
    fromStatus: currentStatus || 'RECEIVED',
    toStatus: newStatus,
    changedBy,
    changedAt: new Date().toISOString(),
    notificationSent, // Phase 0.3.6: 자동 알림 발송 여부
    reason,
  }
  statusChangeLogs.push(log)

  // Phase 0.3.6: Application 상태 업데이트 (Mock)
  application.progressStatus = newStatus
  application.updatedAt = new Date().toISOString()

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
