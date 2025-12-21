/**
 * 신청 Mock 서비스
 * Phase 2.2: Mock API 서비스
 */

import type { Application, ApplicationStatus } from '@/types/domain'
import { mockApplications, mockApplicationsMap } from '@/data/mock'

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
    const updatedApplication: Application = {
      ...application,
      ...data,
      reviewedAt: data.status && data.status !== application.status ? new Date().toISOString() : application.reviewedAt,
      updatedAt: new Date().toISOString(),
    }
    const index = mockApplications.findIndex(a => a.id === id)
    if (index !== -1) {
      mockApplications[index] = updatedApplication
    }
    mockApplicationsMap.set(id, updatedApplication)
    return Promise.resolve(updatedApplication)
  },

  updateStatus: async (id: string, status: ApplicationStatus): Promise<Application> => {
    return applicationService.update(id, { status })
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




