/**
 * 강사 신청 관리 페이지 (관리자용)
 * Phase 0.3.5: 강사 신청 관리 UI
 * Phase 2: 리팩토링 패턴 적용
 */

import { Space, Modal, Typography } from 'antd'
import { InterviewList } from '@/features/interview/ui/interview-list'
import { InterviewDetailDrawer } from '@/features/interview/ui/interview-detail-drawer'
import { InterviewScheduleForm } from '@/features/interview/ui/interview-schedule-form'
import { InterviewResultForm } from '@/features/interview/ui/interview-result-form'
import { ApprovalModal } from '@/features/interview/ui/approval-modal'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import type { UserRole } from '@/types/user'
import { useInstructorApplications } from '@/features/interview/hooks/use-instructor-applications'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import './interview-list-page.css'

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

      <ListPageFilters
        filters={{
          status: filters.status === 'ALL' ? undefined : filters.status,
          role: filters.role === 'ALL' ? undefined : filters.role,
        }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value || 'ALL')
          } else if (key === 'role') {
            // "ALL"인 경우 null로 변환하여 필터 제거
            setRoleFilter(value && value !== 'ALL' ? (value as UserRole) : null)
          }
        }}
        filterConfig={[
          {
            key: 'status',
            type: 'select',
            options: [
              { label: '면접 필요', value: 'PENDING' },
              { label: '면접 일정 확정', value: 'SCHEDULED' },
              { label: '면접 완료', value: 'COMPLETED' },
              { label: '승인 완료', value: 'APPROVED' },
              { label: '반려', value: 'REJECTED' },
              { label: '면접 불필요', value: 'NOT_REQUIRED' },
            ],
            placeholder: '상태 선택',
          },
          {
            key: 'role',
            type: 'select',
            options: [
              { label: '강사', value: 'INSTRUCTOR' },
              { label: '개인(참여자)', value: 'INDIVIDUAL' },
              { label: '학교', value: 'SCHOOL' },
            ],
            placeholder: '신청 유형',
          },
        ]}
        onReset={resetFilters}
        showReset={filters.status !== 'ALL' || filters.role !== 'ALL'}
      />

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
        width={LAYOUT_CONSTANTS.widths.modal.medium}
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
        width={LAYOUT_CONSTANTS.widths.modal.medium}
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
