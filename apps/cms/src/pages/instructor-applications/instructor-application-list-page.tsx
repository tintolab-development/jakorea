/**
 * 강사 신청 목록 페이지
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import { useState, useEffect, useCallback } from 'react'
import { Space, Select, Button, Modal, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSearchParams, useLocation } from 'react-router-dom'
import { InstructorApplicationList } from '@/features/instructor-application/ui/instructor-application-list'
import { ManualAssignmentModal } from '@/features/instructor-application/ui/manual-assignment-modal'
import { useInstructorApplicationReview } from '@/features/instructor-application/hooks/use-instructor-application-review'
import { createManualAssignment, type ManualAssignmentData } from '@/entities/instructor-application/api/instructor-application-service'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { programService } from '@/entities/program/api/program-service'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import './instructor-application-list-page.css'

const { Option } = Select
const { TextArea } = Input

export function InstructorApplicationListPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사 신청 관리'
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)

  const {
    applications,
    loading,
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
  } = useInstructorApplicationReview()

  // 필터 상태
  const programFilter = searchParams.get('programId') || undefined
  const statusFilter = (searchParams.get('status') || 'ALL') as
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CLOSED'
    | 'ALL'

  // 프로그램 목록
  const programs = programService.getAllSync()

  // 초기 로드 및 필터 변경 시 데이터 불러오기
  useEffect(() => {
    fetchApplications({
      programId: programFilter,
      status: statusFilter,
    })
  }, [programFilter, statusFilter, fetchApplications])

  // 필터 변경 핸들러
  const handleProgramFilterChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'ALL') {
      newParams.delete('programId')
    } else {
      newParams.set('programId', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleStatusFilterChange = (
    value: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'ALL'
  ) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'ALL') {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleView = useCallback((item: typeof applications[0]) => {
    setSelectedApplication(item)
    // TODO: 상세 Drawer 구현
    message.info('상세 보기 기능은 추후 구현 예정입니다.')
  }, [setSelectedApplication])

  const handleApprove = useCallback(
    async (item: typeof applications[0]) => {
      await approveApplication(item.id)
    },
    [approveApplication]
  )

  const handleReject = useCallback(
    (item: typeof applications[0]) => {
      requestReject(item)
    },
    [requestReject]
  )

  const handleClose = useCallback(
    async (item: typeof applications[0]) => {
      await closeApplication(item.id)
    },
    [closeApplication]
  )

  return (
    <div>
      <Space className="instructor-application-list-header">
        <h1 className="instructor-application-list-title">{categoryName}</h1>
      </Space>

      <Space className="instructor-application-list-filters" size="middle" wrap>
        <Select
          placeholder="프로그램 선택"
          value={programFilter || 'ALL'}
          onChange={handleProgramFilterChange}
          style={{ width: 200 }}
          allowClear
        >
          <Option value="ALL">전체 프로그램</Option>
          {programs.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="상태 선택"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          style={{ width: 150 }}
        >
          <Option value="ALL">전체</Option>
          <Option value="PENDING">대기</Option>
          <Option value="APPROVED">승인</Option>
          <Option value="REJECTED">거절</Option>
          <Option value="CLOSED">마감</Option>
        </Select>
        <Button onClick={() => fetchApplications({ programId: programFilter, status: statusFilter })}>
          새로고침
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAssignmentModalOpen(true)}
        >
          추가 배정
        </Button>
      </Space>

      <InstructorApplicationList
        data={applications}
        loading={loading}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={handleClose}
      />

      {/* 거절 사유 입력 모달 */}
      <Modal
        title="강사 신청 거절"
        open={rejectModalOpen}
        onOk={confirmReject}
        onCancel={cancelReject}
        okText="거절하기"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>거절 사유를 입력해주세요:</strong>
          </div>
          <TextArea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="거절 사유를 입력해주세요"
            rows={4}
            required
          />
        </Space>
      </Modal>

      {/* 추가 배정 모달 */}
      <ManualAssignmentModal
        open={assignmentModalOpen}
        onCancel={() => setAssignmentModalOpen(false)}
        onSuccess={async (data: ManualAssignmentData) => {
          setAssignmentLoading(true)
          try {
            await createManualAssignment(data)
            showSuccessMessage('추가 배정이 완료되었습니다.')
            setAssignmentModalOpen(false)
            await fetchApplications({ programId: programFilter, status: statusFilter })
          } catch (error) {
            handleError(error, { defaultMessage: '추가 배정 중 오류가 발생했습니다' })
          } finally {
            setAssignmentLoading(false)
          }
        }}
        loading={assignmentLoading}
      />
    </div>
  )
}
