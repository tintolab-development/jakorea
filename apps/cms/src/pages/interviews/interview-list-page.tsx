/**
 * 면접 관리 페이지 (관리자용)
 * Phase 4.3.2: 면접 관리
 */

import { useState, useEffect, useMemo } from 'react'
import { Space, Select, Button, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { InterviewList } from '@/features/interview/ui/interview-list'
import { InterviewDetailDrawer } from '@/features/interview/ui/interview-detail-drawer'
import { InterviewScheduleForm } from '@/features/interview/ui/interview-schedule-form'
import { InterviewResultForm } from '@/features/interview/ui/interview-result-form'
import { ApprovalModal } from '@/features/interview/ui/approval-modal'
import {
  getInterviews,
  scheduleInterview,
  submitInterviewResult,
  approveOrRejectInterview,
} from '@/entities/interview/api/interview-service'
import type { Interview } from '@/types/interview'
import type { InterviewStatus } from '@/types/user'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'

const { Option } = Select

export function InterviewListPage() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  // 쿼리 파라미터에서 필터 값 읽기
  const statusFilter = useMemo(() => {
    const status = searchParams.get('status')
    return (status || 'ALL') as InterviewStatus | 'ALL'
  }, [searchParams])

  const roleFilter = useMemo(() => {
    return searchParams.get('role') || 'ALL'
  }, [searchParams])

  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  // 쿼리 파라미터에서 선택된 면접 ID 읽기
  const selectedInterviewId = useMemo(() => {
    return searchParams.get('id')
  }, [searchParams])

  useEffect(() => {
    fetchInterviews()
  }, [statusFilter, roleFilter])

  // 쿼리 파라미터에서 면접 ID가 있으면 Drawer 열기
  useEffect(() => {
    if (selectedInterviewId) {
      const interview = interviews.find(i => i.id === selectedInterviewId)
      if (interview) {
        setSelectedInterview(interview)
        setDrawerOpen(true)
      }
    }
  }, [selectedInterviewId, interviews])

  const fetchInterviews = async () => {
    setLoading(true)
    try {
      const filters: { status?: InterviewStatus; userRole?: 'INSTRUCTOR' | 'VOLUNTEER' } = {}
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter
      }
      if (roleFilter !== 'ALL') {
        filters.userRole = roleFilter as 'INSTRUCTOR' | 'VOLUNTEER'
      }
      const data = await getInterviews(filters)
      setInterviews(data)
    } catch (error) {
      handleError(error, { defaultMessage: '면접 목록을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }

  // 필터 변경 핸들러
  const handleStatusFilterChange = (value: InterviewStatus | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value) {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleRoleFilterChange = (value: string | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value) {
      newParams.delete('role')
    } else {
      newParams.set('role', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleResetFilters = () => {
    setSearchParams({}, { replace: true })
  }

  const handleView = (interview: Interview) => {
    setSelectedInterview(interview)
    setDrawerOpen(true)
    // 쿼리 파라미터에 면접 ID 추가
    const newParams = new URLSearchParams(searchParams)
    newParams.set('id', interview.id)
    setSearchParams(newParams, { replace: true })
  }

  const handleRowClick = (interview: Interview) => {
    handleView(interview)
  }

  const handleSchedule = (interview: Interview) => {
    setSelectedInterview(interview)
    setScheduleModalOpen(true)
  }

  const handleScheduleSubmit = async (data: {
    scheduledAt: string
    location?: string
    notes?: string
  }) => {
    if (!selectedInterview) return

    try {
      await scheduleInterview(selectedInterview.id, {
        ...data,
        interviewerId: user?.id,
      })
      showSuccessMessage('면접 일정이 등록되었습니다')
      setScheduleModalOpen(false)
      setSelectedInterview(null)
      fetchInterviews()
    } catch (error) {
      handleError(error, { defaultMessage: '면접 일정 등록에 실패했습니다' })
    }
  }

  const handleResultSubmit = async (data: { result: 'PASS' | 'FAIL'; notes?: string }) => {
    if (!selectedInterview) return

    try {
      await submitInterviewResult(selectedInterview.id, data)
      showSuccessMessage('면접 결과가 등록되었습니다')
      setResultModalOpen(false)
      setSelectedInterview(null)
      fetchInterviews()
    } catch (error) {
      handleError(error, { defaultMessage: '면접 결과 등록에 실패했습니다' })
    }
  }

  const handleApprove = (interview: Interview) => {
    setSelectedInterview(interview)
    setApprovalModalOpen(true)
  }

  const handleReject = (interview: Interview) => {
    setSelectedInterview(interview)
    setRejectModalOpen(true)
  }

  const handleApprovalSubmit = async (approved: boolean, reason?: string) => {
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
      setSelectedInterview(null)
      fetchInterviews()
    } catch (error) {
      handleError(error, { defaultMessage: '처리에 실패했습니다' })
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>면접 관리</h1>
      </Space>

      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        <Select
          value={statusFilter === 'ALL' ? undefined : statusFilter}
          onChange={handleStatusFilterChange}
          style={{ width: 180 }}
          placeholder="상태 선택"
          allowClear
        >
          <Option value="PENDING">면접 필요</Option>
          <Option value="SCHEDULED">면접 일정 확정</Option>
          <Option value="COMPLETED">면접 완료</Option>
          <Option value="APPROVED">승인 완료</Option>
          <Option value="REJECTED">반려</Option>
          <Option value="NOT_REQUIRED">면접 불필요</Option>
        </Select>
        <Select
          value={roleFilter === 'ALL' ? undefined : roleFilter}
          onChange={handleRoleFilterChange}
          style={{ width: 150 }}
          placeholder="신청 유형"
          allowClear
        >
          <Option value="INSTRUCTOR">강사</Option>
          <Option value="VOLUNTEER">봉사자</Option>
        </Select>
        {(statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
          <Button onClick={handleResetFilters}>필터 초기화</Button>
        )}
      </Space>

      <InterviewList
        data={interviews}
        loading={loading}
        onView={handleView}
        onSchedule={handleSchedule}
        onApprove={handleApprove}
        onReject={handleReject}
        onRowClick={handleRowClick}
      />

      <InterviewDetailDrawer
        open={drawerOpen}
        interview={selectedInterview}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedInterview(null)
          // 쿼리 파라미터에서 면접 ID 제거
          const newParams = new URLSearchParams(searchParams)
          newParams.delete('id')
          setSearchParams(newParams, { replace: true })
        }}
      />

      <Modal
        open={scheduleModalOpen}
        title="일정 등록"
        onCancel={() => {
          setScheduleModalOpen(false)
          setSelectedInterview(null)
        }}
        footer={null}
        width={600}
      >
        <InterviewScheduleForm
          interview={selectedInterview}
          onSubmit={handleScheduleSubmit}
          onCancel={() => {
            setScheduleModalOpen(false)
            setSelectedInterview(null)
          }}
        />
      </Modal>

      <Modal
        open={resultModalOpen}
        title="면접 결과 입력"
        onCancel={() => {
          setResultModalOpen(false)
          setSelectedInterview(null)
        }}
        footer={null}
        width={600}
      >
        <InterviewResultForm
          interview={selectedInterview}
          onSubmit={handleResultSubmit}
          onCancel={() => {
            setResultModalOpen(false)
            setSelectedInterview(null)
          }}
        />
      </Modal>

      <ApprovalModal
        open={approvalModalOpen}
        interview={selectedInterview}
        onApprove={reason => handleApprovalSubmit(true, reason)}
        onCancel={() => {
          setApprovalModalOpen(false)
          setSelectedInterview(null)
        }}
      />

      <ApprovalModal
        open={rejectModalOpen}
        interview={selectedInterview}
        onApprove={reason => handleApprovalSubmit(false, reason)}
        onCancel={() => {
          setRejectModalOpen(false)
          setSelectedInterview(null)
        }}
        isReject
      />
    </div>
  )
}
