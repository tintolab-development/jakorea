/**
 * 강사 신청 관리 훅 (면접/승인 흐름 포함)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getInterviews,
  scheduleInterview,
  submitInterviewResult,
  approveOrRejectInterview,
} from '@/entities/interview/api/interview-service'
import type { Interview } from '@/types/interview'
import type { InterviewStatus, UserRole } from '@/types/user'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import { MESSAGES } from '@/shared/constants'

interface InterviewFilters {
  status: InterviewStatus | 'ALL'
  role: UserRole | 'ALL'
}

interface UseInstructorApplicationsResult {
  interviews: Interview[]
  loading: boolean
  filters: InterviewFilters
  selectedInterview: Interview | null
  drawerOpen: boolean
  scheduleModalOpen: boolean
  resultModalOpen: boolean
  approvalModalOpen: boolean
  rejectModalOpen: boolean
  setStatusFilter: (value: InterviewStatus | null) => void
  setRoleFilter: (value: UserRole | null) => void
  resetFilters: () => void
  openDetail: (interview: Interview) => void
  closeDetail: () => void
  openSchedule: (interview: Interview) => void
  openApprove: (interview: Interview) => void
  openReject: (interview: Interview) => void
  submitSchedule: (data: {
    scheduledAt: string
    location?: string
    notes?: string
  }) => Promise<void>
  submitResult: (data: { result: 'PASS' | 'FAIL'; notes?: string }) => Promise<void>
  submitApproval: (approved: boolean, reason?: string) => Promise<void>
  closeScheduleModal: () => void
  closeResultModal: () => void
  closeApprovalModal: () => void
  closeRejectModal: () => void
  refresh: () => Promise<void>
}

export function useInstructorApplications(): UseInstructorApplicationsResult {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const statusFilter = useMemo(() => {
    const status = searchParams.get('status')
    return (status || 'ALL') as InterviewStatus | 'ALL'
  }, [searchParams])

  const roleFilter = useMemo(() => {
    const role = searchParams.get('role')
    return (role || 'INSTRUCTOR') as UserRole | 'ALL'
  }, [searchParams])

  const selectedInterviewId = useMemo(() => searchParams.get('id'), [searchParams])

  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  const fetchInterviews = useCallback(async () => {
    setLoading(true)
    try {
      const filters: {
        status?: InterviewStatus
        userRole?: 'INSTRUCTOR' | 'INDIVIDUAL' | 'SCHOOL'
      } = {}
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter
      }
      if (roleFilter !== 'ALL') {
        filters.userRole = roleFilter as 'INSTRUCTOR' | 'INDIVIDUAL' | 'SCHOOL'
      }
      const data = await getInterviews(filters)
      setInterviews(data)
      return data // 업데이트된 데이터 반환
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.interviewListLoadFailed })
      return []
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  useEffect(() => {
    if (!selectedInterviewId) return

    const interview = interviews.find(item => item.id === selectedInterviewId)
    if (interview) {
      setSelectedInterview(interview)
      setDrawerOpen(true)
    }
  }, [interviews, selectedInterviewId])

  const setStatusFilter = useCallback(
    (value: InterviewStatus | null) => {
      const newParams = new URLSearchParams(searchParams)
      if (!value) {
        newParams.delete('status')
      } else {
        newParams.set('status', value)
      }
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setRoleFilter = useCallback(
    (value: UserRole | null) => {
      const newParams = new URLSearchParams(searchParams)
      if (!value) {
        newParams.delete('role')
      } else {
        newParams.set('role', value)
      }
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const openDetail = useCallback(
    (interview: Interview) => {
      setSelectedInterview(interview)
      setDrawerOpen(true)
      const newParams = new URLSearchParams(searchParams)
      newParams.set('id', interview.id)
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setDrawerOpen(false)
    setSelectedInterview(null)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('id')
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  const openSchedule = useCallback((interview: Interview) => {
    setSelectedInterview(interview)
    setScheduleModalOpen(true)
  }, [])

  const openApprove = useCallback((interview: Interview) => {
    setSelectedInterview(interview)
    setApprovalModalOpen(true)
  }, [])

  const openReject = useCallback((interview: Interview) => {
    setSelectedInterview(interview)
    setRejectModalOpen(true)
  }, [])

  const submitSchedule = useCallback(
    async (data: { scheduledAt: string; location?: string; notes?: string }) => {
      if (!selectedInterview) return

      try {
        await scheduleInterview(selectedInterview.id, {
          ...data,
          interviewerId: user?.id,
        })
        showSuccessMessage(MESSAGES.success.interviewScheduleRegistered)
        setScheduleModalOpen(false)
        // 상태 변경 후 업데이트된 interview로 갱신
        const updatedInterviews = await fetchInterviews()
        if (updatedInterviews) {
          const updatedInterview = updatedInterviews.find(i => i.id === selectedInterview.id)
          if (updatedInterview) {
            setSelectedInterview(updatedInterview)
          }
        }
      } catch (error) {
        handleError(error, { defaultMessage: MESSAGES.error.interviewScheduleRegisterFailed })
      }
    },
    [fetchInterviews, selectedInterview, user?.id]
  )

  const submitResult = useCallback(
    async (data: { result: 'PASS' | 'FAIL'; notes?: string }) => {
      if (!selectedInterview) return

      try {
        await submitInterviewResult(selectedInterview.id, data)
        showSuccessMessage(MESSAGES.success.interviewResultRegistered)
        setResultModalOpen(false)
        // 상태 변경 후 업데이트된 interview로 갱신
        const updatedInterviews = await fetchInterviews()
        if (updatedInterviews) {
          const updatedInterview = updatedInterviews.find(i => i.id === selectedInterview.id)
          if (updatedInterview) {
            setSelectedInterview(updatedInterview)
          }
        }
      } catch (error) {
        handleError(error, { defaultMessage: '면접 결과 등록에 실패했습니다' })
      }
    },
    [fetchInterviews, selectedInterview]
  )

  const submitApproval = useCallback(
    async (approved: boolean, reason?: string) => {
      if (!selectedInterview || !user) return

      try {
        await approveOrRejectInterview(selectedInterview.id, {
          approved,
          reason,
          approvedBy: user.id,
        })
        showSuccessMessage(approved ? '승인되었습니다' : '반려되었습니다')
        setApprovalModalOpen(false)
        setRejectModalOpen(false)
        // 상태 변경 후 업데이트된 interview로 갱신
        const updatedInterviews = await fetchInterviews()
        if (updatedInterviews) {
          const updatedInterview = updatedInterviews.find(i => i.id === selectedInterview.id)
          if (updatedInterview) {
            setSelectedInterview(updatedInterview)
          }
        }
      } catch (error) {
        handleError(error, { defaultMessage: '처리에 실패했습니다' })
      }
    },
    [fetchInterviews, selectedInterview, user]
  )

  return {
    interviews,
    loading,
    filters: { status: statusFilter, role: roleFilter },
    selectedInterview,
    drawerOpen,
    scheduleModalOpen,
    resultModalOpen,
    approvalModalOpen,
    rejectModalOpen,
    setStatusFilter,
    setRoleFilter,
    resetFilters,
    openDetail,
    closeDetail,
    openSchedule,
    openApprove,
    openReject,
    submitSchedule,
    submitResult,
    submitApproval,
    closeScheduleModal: () => setScheduleModalOpen(false),
    closeResultModal: () => setResultModalOpen(false),
    closeApprovalModal: () => setApprovalModalOpen(false),
    closeRejectModal: () => setRejectModalOpen(false),
    refresh: async () => {
      await fetchInterviews()
    },
  }
}
