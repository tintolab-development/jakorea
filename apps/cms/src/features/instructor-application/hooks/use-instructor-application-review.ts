/**
 * 강사 신청 승인/마감 훅
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import { useState, useCallback } from 'react'
import {
  getInstructorApplications,
  reviewInstructorApplication,
  type InstructorApplicationItem,
  type InstructorApplicationFilters,
} from '@/entities/instructor-application/api/instructor-application-service'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'

interface UseInstructorApplicationReviewResult {
  applications: InstructorApplicationItem[]
  loading: boolean
  selectedApplication: InstructorApplicationItem | null
  currentFilters: InstructorApplicationFilters | undefined
  rejectModalOpen: boolean
  rejectionReason: string
  setRejectionReason: (value: string) => void
  fetchApplications: (filters?: InstructorApplicationFilters) => Promise<void>
  approveApplication: (applicationId: string) => Promise<void>
  requestReject: (application: InstructorApplicationItem) => void
  confirmReject: () => Promise<void>
  cancelReject: () => void
  closeApplication: (applicationId: string) => Promise<void>
  setSelectedApplication: (application: InstructorApplicationItem | null) => void
}

export function useInstructorApplicationReview(): UseInstructorApplicationReviewResult {
  const [applications, setApplications] = useState<InstructorApplicationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<InstructorApplicationFilters | undefined>(
    undefined
  )
  const [selectedApplication, setSelectedApplication] = useState<InstructorApplicationItem | null>(
    null
  )
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [pendingRejection, setPendingRejection] = useState<InstructorApplicationItem | null>(null)

  const fetchApplications = useCallback(async (filters?: InstructorApplicationFilters) => {
    setLoading(true)
    try {
      const data = await getInstructorApplications(filters)
      setApplications(data)
      setCurrentFilters(filters)
    } catch (error) {
      handleError(error, { defaultMessage: '강사 신청 목록을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [])

  const approveApplication = useCallback(
    async (applicationId: string) => {
      try {
        await reviewInstructorApplication(applicationId, 'APPROVE')
        showSuccessMessage('강사 신청이 승인되었습니다.')
        // 현재 필터로 다시 조회
        await fetchApplications(currentFilters)
      } catch (error) {
        handleError(error, { defaultMessage: '승인 처리 중 오류가 발생했습니다' })
      }
    },
    [currentFilters, fetchApplications]
  )

  const requestReject = useCallback((application: InstructorApplicationItem) => {
    setPendingRejection(application)
    setRejectionReason('')
    setRejectModalOpen(true)
  }, [])

  const confirmReject = useCallback(async () => {
    if (!pendingRejection) return

    try {
      await reviewInstructorApplication(pendingRejection.id, 'REJECT', rejectionReason)
      showSuccessMessage('강사 신청이 거절되었습니다.')
      setRejectModalOpen(false)
      setRejectionReason('')
      setPendingRejection(null)
      // 현재 필터로 다시 조회
      await fetchApplications(currentFilters)
    } catch (error) {
      handleError(error, { defaultMessage: '거절 처리 중 오류가 발생했습니다' })
    }
  }, [pendingRejection, rejectionReason, currentFilters, fetchApplications])

  const cancelReject = useCallback(() => {
    setRejectModalOpen(false)
    setRejectionReason('')
    setPendingRejection(null)
  }, [])

  const closeApplication = useCallback(
    async (applicationId: string) => {
      try {
        await reviewInstructorApplication(applicationId, 'CLOSE')
        showSuccessMessage('강사 신청이 마감되었습니다.')
        // 현재 필터로 다시 조회
        await fetchApplications(currentFilters)
      } catch (error) {
        handleError(error, { defaultMessage: '마감 처리 중 오류가 발생했습니다' })
      }
    },
    [currentFilters, fetchApplications]
  )

  return {
    applications,
    loading,
    selectedApplication,
    currentFilters,
    rejectModalOpen,
    rejectionReason,
    setRejectionReason,
    fetchApplications,
    approveApplication,
    requestReject,
    confirmReject,
    cancelReject,
    closeApplication,
    setSelectedApplication,
  }
}
