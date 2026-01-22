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

export const applicationService = {
  getAll: async (): Promise<Application[]> => {
    return Promise.resolve(mockApplications)
  },

  getById: async (id: string): Promise<Application> => {
    const application = mockApplicationsMap.get(id)
    if (!application) {
      throw new Error(`Application not found: ${id}`)
    }
    return Promise.resolve(application)
  },

  create: async (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt'>): Promise<Application> => {
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

  update: async (id: string, data: Partial<Omit<Application, 'id' | 'createdAt'>>): Promise<Application> => {
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
    return Promise.resolve(updatedApplication)
  },

  updateStatus: async (id: string, status: ApplicationStatus, rejectionReason?: string): Promise<Application> => {
    const application = mockApplicationsMap.get(id)
    if (!application) {
      throw new Error(`Application not found: ${id}`)
    }

    // 신청 취소 시 대기 목록 자동 승인 (Phase 3)
    if (status === 'cancelled' && (application.status === 'approved' || application.status === 'reviewing')) {
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
      waitingListOrder: status === 'waiting' ? getNextWaitingListOrder(application.programId, application.roundId) : undefined,
      ...(status !== 'waiting' && application.waitingListOrder !== undefined ? { waitingListOrder: undefined } : {}),
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
}








