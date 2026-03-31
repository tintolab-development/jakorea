/**
 * 신청 Mock 서비스
 * Phase 2.2: Mock API 서비스
 */

import type { Application, ApplicationStatus } from '@/types/domain'
import { mockApplications, mockApplicationsMap } from '@/data/mock'
import {
  getWaitingList,
  getNextWaitingListOrder,
  isCapacityFull,
} from '@/features/program/lib/program-helpers'
import { mockPrograms } from '@/data/mock'
import { appendReceivedLog } from '@/entities/application-progress/api/status-change-service'
import { createAuditLog } from '@/entities/audit-log/api/audit-log-service'
import { getNotificationStatus } from './application-notification-service'

export const applicationService = {
  getAll: async (): Promise<Application[]> => {
    // 알림 발송 상태를 함께 조회하여 Application에 포함
    const applicationsWithNotificationStatus = await Promise.all(
      mockApplications.map(async app => {
        if (app.status === 'approved' || app.status === 'rejected') {
          try {
            const notificationStatus = await getNotificationStatus(app.id)
            return {
              ...app,
              notificationSent: notificationStatus.notificationSent,
            }
          } catch (error) {
            console.warn(`Failed to get notification status for application ${app.id}:`, error)
            return app
          }
        }
        return app
      })
    )
    return Promise.resolve(applicationsWithNotificationStatus)
  },

  getById: async (id: string): Promise<Application> => {
    const application = mockApplicationsMap.get(id)
    if (!application) {
      throw new Error(`Application not found: ${id}`)
    }
    return Promise.resolve(application)
  },

  create: async (
    data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt'>
  ): Promise<Application> => {
    const newApplication: Application = {
      ...data,
      id: `application-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockApplications.push(newApplication)
    mockApplicationsMap.set(newApplication.id, newApplication)
    return Promise.resolve(newApplication)
  },

  update: async (
    id: string,
    data: Partial<Omit<Application, 'id' | 'createdAt'>>
  ): Promise<Application> => {
    const application = mockApplicationsMap.get(id)
    if (!application) {
      throw new Error(`Application not found: ${id}`)
    }

    // reviewedAt 설정: reviewing, approved, rejected 상태로 변경될 때만 설정
    let reviewedAt = application.reviewedAt
    if (data.status && data.status !== application.status) {
      if (data.status === 'reviewing' || data.status === 'approved' || data.status === 'rejected') {
        reviewedAt = new Date().toISOString()
      }
    }

    const updatedApplication: Application = {
      ...application,
      ...data,
      reviewedAt: data.reviewedAt !== undefined ? data.reviewedAt : reviewedAt,
      updatedAt: new Date().toISOString(),
    }
    const index = mockApplications.findIndex(a => a.id === id)
    if (index !== -1) {
      mockApplications[index] = updatedApplication
    }
    mockApplicationsMap.set(id, updatedApplication)

    // FR-F01: 신청서 오기재 사항 수정 이력 기록 (감사 로그)
    const editedFields = Object.keys(data).filter(k => !['updatedAt', 'reviewedAt'].includes(k))
    if (editedFields.length > 0) {
      try {
        await createAuditLog({
          eventType: 'APPLICATION_EDIT',
          targetId: id,
          targetType: 'application',
          targetName: `신청 ${id}`,
          details: {
            applicationId: id,
            programId: application.programId,
            subjectType: application.subjectType,
            editedFields,
            previousStatus: application.status,
            newStatus: data.status ?? application.status,
          },
        })
      } catch (e) {
        console.warn('[ApplicationService] 감사 로그 기록 실패:', e)
      }
    }

    return Promise.resolve(updatedApplication)
  },

  updateStatus: async (
    id: string,
    status: ApplicationStatus,
    rejectionReason?: string
  ): Promise<Application> => {
    const application = mockApplicationsMap.get(id)
    if (!application) {
      throw new Error(`Application not found: ${id}`)
    }

    // 신청 취소 시 대기 목록 자동 승인 (Phase 3)
    if (
      status === 'cancelled' &&
      (application.status === 'approved' || application.status === 'reviewing')
    ) {
      const program = mockPrograms.find(p => p.id === application.programId)
      if (program) {
        // 정원이 가득 찬 경우에만 대기 목록 자동 승인
        if (isCapacityFull(program, application.roundId)) {
          const waitingList = getWaitingList(application.programId, application.roundId)
          if (waitingList.length > 0) {
            // 첫 번째 대기 신청을 승인
            const firstWaiting = waitingList[0]
            await applicationService.update(firstWaiting.id, {
              status: 'approved',
              waitingListOrder: undefined, // 대기 순번 제거
            })
          }
        }
      }
    }

    // Phase 0.3.2: 승인 시 progressStatus 초기화 (타임라인용)
    const updates: Partial<Application> = {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      waitingListOrder:
        status === 'waiting'
          ? getNextWaitingListOrder(application.programId, application.roundId)
          : undefined,
      ...(status !== 'waiting' && application.waitingListOrder !== undefined
        ? { waitingListOrder: undefined }
        : {}),
    }
    if (status === 'approved') {
      updates.progressStatus = 'RECEIVED'
      appendReceivedLog(id, application.submittedAt as string)
    } else if (status === 'rejected' || status === 'cancelled') {
      updates.progressStatus = undefined
    }

    return applicationService.update(id, updates)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockApplications.findIndex(a => a.id === id)
    if (index === -1) {
      throw new Error(`Application not found: ${id}`)
    }
    mockApplications.splice(index, 1)
    mockApplicationsMap.delete(id)
    return Promise.resolve()
  },

  /**
   * 사용자별 신청 이력 조회
   * 회원 상세 탭용 표시 필드(lectureAttendance, hasAssignmentSubmission, managerName)를 함께 채워 반환
   * @param userId 사용자 ID
   * @param subjectType 주체 유형 (선택)
   * @returns 신청 목록
   */
  getByUserId: async (
    userId: string,
    subjectType?: Application['subjectType']
  ): Promise<Application[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))

    const filtered = mockApplications.filter(app => {
      // subjectId가 사용자 ID와 일치하는 경우
      if (app.subjectId === userId) {
        // subjectType 필터가 있으면 추가 필터링
        if (subjectType) {
          return app.subjectType === subjectType
        }
        return true
      }
      return false
    })

    // 최신순 정렬
    filtered.sort((a, b) => {
      const aTime = new Date(a.submittedAt).getTime()
      const bTime = new Date(b.submittedAt).getTime()
      return bTime - aTime
    })

    const enriched = filtered.map(app => enrichApplicationForMemberDetail(app, userId))
    return Promise.resolve(enriched)
  },
}

const MOCK_MANAGER_NAMES = ['이순신 매니저', '홍길동 매니저', '김담당 매니저', '박운영 매니저', '최지원 매니저']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

/** 회원 상세 탭용: Application에 lectureAttendance, hasAssignmentSubmission, managerName 채움 */
function enrichApplicationForMemberDetail(app: Application, userId: string): Application {
  const totalRounds = 4
  const attended = hash(`${app.id}-${userId}`) % (totalRounds + 1)
  const lectureAttendance = `${attended}/${totalRounds}`
  const hasAssignmentSubmission = hash(`${app.id}-${userId}-sub`) % 2 === 0
  const hasLectureReportSubmission =
    app.hasLectureReportSubmission ?? hash(`${app.id}-${userId}-lec`) % 3 !== 0
  const managerName =
    app.managerName?.trim() ||
    MOCK_MANAGER_NAMES[hash(app.programId) % MOCK_MANAGER_NAMES.length]
  return {
    ...app,
    lectureAttendance,
    hasAssignmentSubmission,
    hasLectureReportSubmission,
    managerName,
  }
}
