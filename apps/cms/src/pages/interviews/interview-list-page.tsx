/**
 * 강사 신청 관리 페이지 (관리자용)
 * Phase 0.3.5: 강사 신청 관리 UI
 */

import { Space, Select, Button, Modal, Typography } from 'antd'
import { InterviewList } from '@/features/interview/ui/interview-list'
import { InterviewDetailDrawer } from '@/features/interview/ui/interview-detail-drawer'
import { InterviewScheduleForm } from '@/features/interview/ui/interview-schedule-form'
import { InterviewResultForm } from '@/features/interview/ui/interview-result-form'
import { ApprovalModal } from '@/features/interview/ui/approval-modal'
import type { UserRole } from '@/types/user'
import { useInstructorApplications } from '@/features/interview/hooks/use-instructor-applications'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import './interview-list-page.css'

const { Option } = Select

export function InterviewListPage() {
  const { user } = useAuthStore()
  // Phase 0.5.2: GENERAL 관리자는 쓰기 작업 불가
  const canWrite = canPerformWriteAction(user)

  const {
    interviews,
    loading,
    filters,
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
    closeScheduleModal,
    closeResultModal,
    closeApprovalModal,
    closeRejectModal,
  } = useInstructorApplications()

  return (
    <div>
      <Space className="interview-list-header">
        <div>
          <h1 className="interview-list-title">강사 신청 관리</h1>
          <Typography.Text type="secondary">강사 신청(면접/승인)을 관리합니다.</Typography.Text>
        </div>
      </Space>

      <Space className="interview-list-filters" size="middle" wrap>
        <Select
          value={filters.status === 'ALL' ? undefined : filters.status}
          onChange={setStatusFilter}
          className="interview-list-filter--status"
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
          value={filters.role === 'ALL' ? undefined : filters.role}
          onChange={setRoleFilter as (value: UserRole | null) => void}
          className="interview-list-filter--role"
          placeholder="신청 유형"
          allowClear
        >
          <Option value="INSTRUCTOR">강사</Option>
          <Option value="INDIVIDUAL">개인(참여자)</Option>
          <Option value="SCHOOL">학교</Option>
        </Select>
        {(filters.status !== 'ALL' || filters.role !== 'ALL') && (
          <Button onClick={resetFilters}>필터 초기화</Button>
        )}
      </Space>

      <InterviewList
        data={interviews}
        loading={loading}
        onView={openDetail}
        onSchedule={canWrite ? openSchedule : undefined}
        onApprove={canWrite ? openApprove : undefined}
        onReject={canWrite ? openReject : undefined}
        onRowClick={openDetail}
      />

      <InterviewDetailDrawer
        open={drawerOpen}
        interview={selectedInterview}
        onClose={closeDetail}
      />

      <Modal
        open={scheduleModalOpen}
        title="일정 등록"
        onCancel={closeScheduleModal}
        footer={null}
        width={600}
        zIndex={1001}
      >
        <InterviewScheduleForm
          interview={selectedInterview}
          onSubmit={submitSchedule}
          onCancel={closeScheduleModal}
        />
      </Modal>

      <Modal
        open={resultModalOpen}
        title="면접 결과 입력"
        onCancel={closeResultModal}
        footer={null}
        width={600}
        zIndex={1001}
      >
        <InterviewResultForm
          interview={selectedInterview}
          onSubmit={submitResult}
          onCancel={closeResultModal}
        />
      </Modal>

      <ApprovalModal
        open={approvalModalOpen}
        interview={selectedInterview}
        onApprove={reason => submitApproval(true, reason)}
        onCancel={closeApprovalModal}
      />

      <ApprovalModal
        open={rejectModalOpen}
        interview={selectedInterview}
        onApprove={reason => submitApproval(false, reason)}
        onCancel={closeRejectModal}
        isReject
      />
    </div>
  )
}
