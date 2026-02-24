/**
 * 강사 신청 목록 페이지
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Space, Button, Modal, Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'
import { InstructorApplicationList } from '@/features/instructor-application/ui/instructor-application-list'
import { InstructorApplicationDetailDrawer } from '@/features/instructor-application/ui/instructor-application-detail-drawer'
import { ManualAssignmentModal } from '@/features/instructor-application/ui/manual-assignment-modal'
import { useInstructorApplicationReview } from '@/features/instructor-application/hooks/use-instructor-application-review'
import {
  createManualAssignment,
  type ManualAssignmentData,
  type InstructorApplicationItem,
} from '@/entities/instructor-application/api/instructor-application-service'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import './instructor-application-list-page.css'

const { TextArea } = Input

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'ALL'

export function InstructorApplicationListPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const { params, setParams } = useQueryParams<{ programId?: string; status?: string }>()
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)

  const {
    applications,
    loading,
    currentFilters,
    selectedApplication,
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

  const [drawerOpen, setDrawerOpen] = useState(false)

  // 프로그램 목록
  const { getAllSync: getAllProgramsSync } = useProgramService()
  const programs = getAllProgramsSync()

  // 쿼리 파라미터에서 필터 값 파싱
  const parseFiltersFromParams = useCallback(() => {
    const programId = params.programId || undefined
    const status = (params.status || 'ALL') as ApplicationStatus
    return { programId, status }
  }, [params])

  // 적용된 필터 (쿼리 파라미터에서 가져옴)
  const appliedFilters = useMemo(() => parseFiltersFromParams(), [parseFiltersFromParams])

  // 임시 필터 상태 (조회 버튼 클릭 전까지)
  const [pendingFilters, setPendingFilters] = useState(() => ({
    programId: appliedFilters.programId || 'ALL',
    status: appliedFilters.status,
  }))

  // 쿼리 파라미터 변경 시 pendingFilters 동기화
  useEffect(() => {
    const filters = parseFiltersFromParams()
    setPendingFilters({
      programId: filters.programId || 'ALL',
      status: filters.status,
    })
  }, [parseFiltersFromParams])

  // 초기 로드 및 필터 변경 시 데이터 불러오기
  useEffect(() => {
    const filters = parseFiltersFromParams()
    fetchApplications({
      programId: filters.programId,
      status: filters.status === 'ALL' ? undefined : filters.status,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 필터 옵션
  const programOptions = useMemo(() => {
    return [
      { label: '전체 프로그램', value: 'ALL' },
      ...programs.map(program => ({
        label: program.title,
        value: program.id,
      })),
    ]
  }, [programs])

  const statusOptions = [
    { label: '전체', value: 'ALL' },
    { label: '대기', value: 'PENDING' },
    { label: '승인', value: 'APPROVED' },
    { label: '거절', value: 'REJECTED' },
    { label: '마감', value: 'CLOSED' },
  ]

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    const programId = pendingFilters.programId === 'ALL' ? undefined : pendingFilters.programId
    const status = pendingFilters.status === 'ALL' ? undefined : pendingFilters.status

    // 쿼리 파라미터 업데이트
    setParams({
      programId: programId as string | undefined,
      status: status as string | undefined,
    })

    // 필터 적용하여 데이터 조회
    fetchApplications({
      programId: programId as string | undefined,
      status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED' | undefined,
    })
  }, [pendingFilters, setParams, fetchApplications])


  const handleView = useCallback(
    (item: InstructorApplicationItem) => {
      setSelectedApplication(item)
      setDrawerOpen(true)
    },
    [setSelectedApplication]
  )

  const handleApprove = useCallback(
    async (item: InstructorApplicationItem) => {
      await approveApplication(item.id)
    },
    [approveApplication]
  )

  const handleReject = useCallback(
    (item: InstructorApplicationItem) => {
      requestReject(item)
    },
    [requestReject]
  )

  const handleClose = useCallback(
    async (item: InstructorApplicationItem) => {
      await closeApplication(item.id)
    },
    [closeApplication]
  )

  return (
    <div>
      {/* 페이지 헤더 영역 - 추가배정 버튼만 */}
      <div
        style={{
          marginBottom: LAYOUT_CONSTANTS.margins.lg,
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {/* Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가 */}
        {canWrite && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAssignmentModalOpen(true)}
          >
            추가 배정
          </Button>
        )}
      </div>

      <UnifiedFilterCard
        fields={[
          {
            key: 'programId',
            type: 'select',
            label: '프로그램',
            placeholder: '전체 프로그램',
            options: programOptions,
            defaultValue: pendingFilters.programId,
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체',
            options: statusOptions,
            defaultValue: pendingFilters.status,
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        loading={loading}
      />

      <InstructorApplicationList
        data={applications}
        loading={loading}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={handleClose}
      />

      {/* 강사 신청 상세 Drawer */}
      <InstructorApplicationDetailDrawer
        open={drawerOpen}
        application={selectedApplication}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedApplication(null)
        }}
        loading={loading}
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
            showSuccessMessage(MESSAGES.success.manualAssignmentCompleted)
            setAssignmentModalOpen(false)
            // 현재 필터로 다시 조회
            await fetchApplications(currentFilters)
          } catch (error) {
            handleError(error, { defaultMessage: MESSAGES.error.manualAssignmentFailed })
          } finally {
            setAssignmentLoading(false)
          }
        }}
        loading={assignmentLoading}
      />
    </div>
  )
}
