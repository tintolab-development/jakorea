/**
 * 신청 Zustand 스토어
 * Phase 2.2: 상태 관리
 */

import { create } from 'zustand'
import type { Application, ApplicationStatus } from '@/types/domain'
import { applicationService } from '@/entities/application/api/application-service'

interface ApplicationState {
  applications: Application[]
  selectedApplication: Application | null
  loading: boolean
  error: Error | null
  fetchApplications: () => Promise<void>
  fetchApplicationById: (id: string) => Promise<void>
  createApplication: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt'>) => Promise<void>
  updateApplication: (id: string, data: Partial<Omit<Application, 'id' | 'createdAt'>>) => Promise<void>
  updateStatus: (id: string, status: ApplicationStatus) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  setSelectedApplication: (application: Application | null) => void
  clearError: () => void
}

export const useApplicationStore = create<ApplicationState>(set => ({
  applications: [],
  selectedApplication: null,
  loading: false,
  error: null,

  fetchApplications: async () => {
    set({ loading: true, error: null })
    try {
      const applications = await applicationService.getAll()
      set({ applications, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchApplicationById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const application = await applicationService.getById(id)
      set({ selectedApplication: application, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createApplication: async (data) => {
    set({ loading: true, error: null })
    try {
      const newApplication = await applicationService.create(data)
      set(state => ({
        applications: [...state.applications, newApplication],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateApplication: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedApplication = await applicationService.update(id, data)
      set(state => ({
        applications: state.applications.map(a => (a.id === id ? updatedApplication : a)),
        selectedApplication: state.selectedApplication?.id === id ? updatedApplication : state.selectedApplication,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const updatedApplication = await applicationService.updateStatus(id, status)
      set(state => ({
        applications: state.applications.map(a => (a.id === id ? updatedApplication : a)),
        selectedApplication: state.selectedApplication?.id === id ? updatedApplication : state.selectedApplication,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteApplication: async (id) => {
    set({ loading: true, error: null })
    try {
      await applicationService.delete(id)
      set(state => ({
        applications: state.applications.filter(a => a.id !== id),
        selectedApplication: state.selectedApplication?.id === id ? null : state.selectedApplication,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  setSelectedApplication: (application) => set({ selectedApplication: application }),

  clearError: () => set({ error: null }),
}))




