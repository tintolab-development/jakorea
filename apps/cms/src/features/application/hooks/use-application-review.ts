/**
 * 신청 승인/반려 전용 훅 (관리자 UI용)
 */

import { useCallback, useEffect, useState } from 'react'
import { useApplicationStore } from '@/features/application/model/application-store'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { Application } from '@/types/domain'
import type { UserRole } from '@/types/user'
import type { ApplicationFormData } from '@/entities/application/model/schema'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'

interface UseApplicationReviewResult {
  applications: Application[]
  selectedApplication: Application | null
  loading: boolean
  isAdmin: boolean
  currentUser: { id: string; role: UserRole; instructorId?: string } | null
  drawerOpen: boolean
  formModalOpen: boolean
  deleteModalOpen: boolean
  editingApplication: Application | null
  applicationToDelete: Application | null
  rejectModalOpen: boolean
  rejectionReason: string
  setRejectionReason: (value: string) => void
  openDrawer: (application: Application) => void
  closeDrawer: () => void
  openForm: (application?: Application) => void
  closeForm: () => void
  openDeleteConfirm: (application: Application) => void
  closeDeleteConfirm: () => void
  confirmDelete: () => Promise<void>
  submitForm: (data: ApplicationFormData) => Promise<void>
  changeStatus: (application: Application, status: Application['status'], reason?: string) => Promise<void>
  requestReject: (application: Application) => void
  confirmReject: () => Promise<void>
  cancelReject: () => void
}

export function useApplicationReview(): UseApplicationReviewResult {
  const {
    applications,
    selectedApplication,
    loading,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    updateStatus,
    setSelectedApplication,
  } = useApplicationStore()
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN'

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [pendingRejection, setPendingRejection] = useState<Application | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const openDrawer = useCallback((application: Application) => {
    setSelectedApplication(application)
    setDrawerOpen(true)
  }, [setSelectedApplication])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedApplication(null)
  }, [setSelectedApplication])

  const openForm = useCallback((application?: Application) => {
    setEditingApplication(application || null)
    setFormModalOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setFormModalOpen(false)
    setEditingApplication(null)
  }, [])

  const submitForm = useCallback(async (data: ApplicationFormData) => {
    try {
      if (editingApplication) {
        await updateApplication(editingApplication.id, data)
        showSuccessMessage('신청이 수정되었습니다')
      } else {
        await createApplication(data)
        showSuccessMessage('신청이 등록되었습니다')
      }
      closeForm()
      fetchApplications()
    } catch (error) {
      handleError(error, {
        defaultMessage: editingApplication ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다',
        context: 'ApplicationFormSubmit',
      })
    }
  }, [closeForm, createApplication, editingApplication, fetchApplications, updateApplication])

  const openDeleteConfirm = useCallback((application: Application) => {
    setApplicationToDelete(application)
    setDeleteModalOpen(true)
  }, [])

  const closeDeleteConfirm = useCallback(() => {
    setDeleteModalOpen(false)
    setApplicationToDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!applicationToDelete) return

    try {
      await deleteApplication(applicationToDelete.id)
      showSuccessMessage('신청이 삭제되었습니다')
      closeDeleteConfirm()
      const { selectedApplication } = useApplicationStore.getState()
      if (selectedApplication?.id === applicationToDelete.id) {
        closeDrawer()
      }
    } catch (error) {
      handleError(error, {
        defaultMessage: '삭제 중 오류가 발생했습니다',
        context: 'ApplicationDelete',
      })
    }
  }, [applicationToDelete, closeDeleteConfirm, closeDrawer, deleteApplication])

  const changeStatus = useCallback(async (
    application: Application,
    status: Application['status'],
    reason?: string
  ) => {
    try {
      await updateStatus(application.id, status, reason)
      showSuccessMessage(`상태가 "${status}"로 변경되었습니다`)
    } catch (error) {
      handleError(error, {
        defaultMessage: '상태 변경 중 오류가 발생했습니다',
        context: 'ApplicationStatusChange',
      })
    }
  }, [updateStatus])

  const requestReject = useCallback((application: Application) => {
    setPendingRejection(application)
    setRejectionReason('')
    setRejectModalOpen(true)
  }, [])

  const confirmReject = useCallback(async () => {
    if (!pendingRejection) return

    await changeStatus(pendingRejection, 'rejected', rejectionReason)
    setRejectModalOpen(false)
    setRejectionReason('')
    setPendingRejection(null)
  }, [changeStatus, pendingRejection, rejectionReason])

  const cancelReject = useCallback(() => {
    setRejectModalOpen(false)
    setRejectionReason('')
    setPendingRejection(null)
  }, [])

  return {
    applications,
    selectedApplication,
    loading,
    isAdmin,
    currentUser: user ? { id: user.id, role: user.role, instructorId: user.instructorId } : null,
    drawerOpen,
    formModalOpen,
    deleteModalOpen,
    editingApplication,
    applicationToDelete,
    rejectModalOpen,
    rejectionReason,
    setRejectionReason,
    openDrawer,
    closeDrawer,
    openForm,
    closeForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    submitForm,
    changeStatus,
    requestReject,
    confirmReject,
    cancelReject,
  }
}
